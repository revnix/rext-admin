import type { NextRequest } from "next/server";

import {
  backendAwayResponse,
  isBackendAway,
} from "@/lib/generate-content/backend-away";
import { ownWords } from "@/lib/generate-content/run-gone";
import {
  getGenerationClient,
  requireThreadOwner,
} from "@/lib/generate-content/thread-access";

const NOT_NOW = "We couldn't cancel this right now. Try again in a moment.";

// Stop a server-owned run. Runs are started with `onDisconnect: "continue"`, so
// closing the tab or aborting the SSE reader never stops the work — this route
// is the only way a user can actually end a generation they no longer want.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const { threadId } = await params;

  const access = await requireThreadOwner(threadId);
  if (!access.ok) return access.response;

  // A thread that no longer exists passes the gate (`thread: null`): the run is already
  // stopped, and that is a successful cancel rather than a job stranded in the dock.
  if (!access.thread) {
    return Response.json({ threadId, runId: null, cancelled: true });
  }

  const client = getGenerationClient(access.accessToken);

  try {
    // No body, or a body that isn't an object, names no run.
    const body = ((await request.json().catch(() => null)) ?? {}) as {
      runId?: string;
    };
    // The tracking record may not have picked up a run id yet (the dock's
    // discovery grace period), so fall back to the thread's newest run.
    let runId = body.runId;
    if (!runId) {
      let runs: Awaited<ReturnType<typeof client.runs.list>>;
      try {
        runs = await client.runs.list(threadId, { limit: 10 });
      } catch (error) {
        // The listing failed (a deploy restarts the backend for about a minute, or it
        // answered an error): nothing is known about this thread's runs. Reading that as
        // "no run" used to delete the thread, and with it every finished step of a run
        // that was only waiting. Nothing is deleted; the person can cancel again.
        if (isBackendAway(error)) return backendAwayResponse();
        return Response.json({ error: NOT_NOW }, { status: 502 });
      }
      runId = runs.sort(
        (left, right) =>
          new Date(right.created_at).getTime() -
          new Date(left.created_at).getTime(),
      )[0]?.run_id;
    }

    // The thread exists and the listing answered with no run: the stream POST that
    // creates one is either still in flight or never landed. There is nothing to
    // interrupt, so drop the thread — that also takes out a run created a moment later,
    // which is what makes cancelling in the first seconds actually stop the work
    // instead of orphaning it. Reporting this as an error instead used to
    // strand the job in the dock, where it then blocked every new generation.
    if (!runId) {
      await client.threads.delete(threadId).catch(() => {});

      return Response.json({ threadId, runId: null, cancelled: true });
    }

    // "interrupt" stops the run but keeps the thread's checkpoints, so the
    // work completed so far stays inspectable instead of being rolled back.
    try {
      await client.runs.cancel(threadId, runId, false, "interrupt");
    } catch (error) {
      // A tracked run id can be stale (server restart, run already finished),
      // and cancelling a run that is no longer active is a no-op, not an error.
      // Only a run still going means the cancel genuinely failed.
      const stillActive = await client.runs
        .get(threadId, runId)
        .then((run) => run.status === "pending" || run.status === "running")
        .catch(() => false);
      if (stillActive) throw error;
    }

    return Response.json({ threadId, runId, cancelled: true });
  } catch (error) {
    // Never the remote error's own text (rext-control task 824).
    return Response.json({ error: ownWords(error, NOT_NOW) }, { status: 500 });
  }
}
