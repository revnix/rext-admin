import { Client } from "@langchain/langgraph-sdk";
import type { NextRequest } from "next/server";

import { auth } from "@/auth";
import { resolveApiBaseUrl } from "@/lib/api-base-url";
import { deriveBackgroundProgress } from "@/lib/generate-content/background-progress";
import type { WREXT } from "@/types/generate-content";

const getClient = () =>
  new Client<WREXT>({
    apiUrl: resolveApiBaseUrl({
      explicitBaseUrl: process.env.LANGGRAPH_API_URL,
    }),
  });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { threadId } = await params;
  const runId = request.nextUrl.searchParams.get("runId");
  const includeState =
    request.nextUrl.searchParams.get("includeState") === "true";
  const client = getClient();

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
