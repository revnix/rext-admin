import { Client } from "@langchain/langgraph-sdk";
import type { NextRequest } from "next/server";

import { auth } from "@/auth";
import { resolveApiBaseUrl } from "@/lib/api-base-url";

const getClient = () =>
  new Client({
    apiUrl: resolveApiBaseUrl({
      explicitBaseUrl: process.env.LANGGRAPH_API_URL,
    }),
  });

// Stop a server-owned run. Runs are started with `onDisconnect: "continue"`, so
// closing the tab or aborting the SSE reader never stops the work — this route
// is the only way a user can actually end a generation they no longer want.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { threadId } = await params;
  const client = getClient();

  try {
    const body = (await request.json().catch(() => ({}))) as { runId?: string };
    // The tracking record may not have picked up a run id yet (the dock's
    // discovery grace period), so fall back to the thread's newest run.
    const runId =
      body.runId ??
      (await client.runs
        .list(threadId, { limit: 10 })
        .then(
          (runs) =>
            runs.sort(
              (left, right) =>
                new Date(right.created_at).getTime() -
                new Date(left.created_at).getTime(),
            )[0]?.run_id,
        ));

    if (!runId) {
      return Response.json(
        { error: "No run to cancel on this thread" },
        { status: 404 },
      );
    }

    // "interrupt" stops the run but keeps the thread's checkpoints, so the
    // work completed so far stays inspectable instead of being rolled back.
    await client.runs.cancel(threadId, runId, false, "interrupt");

    return Response.json({ threadId, runId, cancelled: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to cancel this run";

    return Response.json({ error: message }, { status: 500 });
  }
}
