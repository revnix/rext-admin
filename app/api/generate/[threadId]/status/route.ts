import type { NextRequest } from "next/server";

import { deriveBackgroundProgress } from "@/lib/generate-content/background-progress";
import {
  getGenerationClient,
  requireThreadOwner,
} from "@/lib/generate-content/thread-access";
import type { WREXT } from "@/types/generate-content";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const { threadId } = await params;

  const access = await requireThreadOwner(threadId);
  if (!access.ok) return access.response;

  const runId = request.nextUrl.searchParams.get("runId");
  const includeState =
    request.nextUrl.searchParams.get("includeState") === "true";
  const client = getGenerationClient<WREXT>();

  try {
    const [run, threadState] = await Promise.all([
      runId
        ? client.runs.get(threadId, runId)
        : client.runs
            .list(threadId, { limit: 10 })
            .then(
              (runs) =>
                runs.sort(
                  (left, right) =>
                    new Date(right.created_at).getTime() -
                    new Date(left.created_at).getTime(),
                )[0],
            ),
      // `subgraphs: true` is what makes the nested node names (and the
      // interrupts raised inside `seo_engine` / `content_engine`) visible. The
      // top level only reports the container node, which cannot tell an outline
      // being written apart from the article being written.
      client.threads.getState(threadId, undefined, { subgraphs: true }),
    ]);

    if (!run) {
      return Response.json(
        {
          threadId,
          run: null,
          state: includeState ? threadState : undefined,
          progress: 8,
          stage: "Queued for generation",
        },
        { status: 202 },
      );
    }

    const progress = deriveBackgroundProgress(run.status, threadState);

    return Response.json({
      threadId,
      run: {
        id: run.run_id,
        status: run.status,
        createdAt: run.created_at,
        updatedAt: run.updated_at,
      },
      ...progress,
      state: includeState ? threadState : undefined,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load generation status";

    return Response.json({ error: message }, { status: 500 });
  }
}
