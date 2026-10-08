import type { NextRequest } from "next/server";

import {
  backendAwayResponse,
  isBackendAway,
} from "@/lib/generate-content/backend-away";
import { GENERATION_STREAM_MODES } from "@/lib/generate-content/run-events";
import {
  isRunGone,
  ownWords,
  runGoneResponse,
} from "@/lib/generate-content/run-gone";
import { runWebhookOption } from "@/lib/generate-content/run-webhook";
import {
  getGenerationClient,
  streamErrorPayload,
  requireThreadOwner,
} from "@/lib/generate-content/thread-access";
import { leanChunk } from "@/lib/generate-content/lean-stream-chunk";

const ASSISTANT_ID = "agent";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const { threadId } = await params;

  const access = await requireThreadOwner(threadId);
  if (!access.ok) return access.response;
  // No such run: nothing to resume (rext-control task 824).
  if (!access.thread) return runGoneResponse();

  let body: {
    payload: Record<string, unknown>;
    background?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const client = getGenerationClient(access.accessToken);
  // A resume carries no input, so the run names its workspace in its metadata:
  // the thread's own, stamped when it was created. The backend refuses the run
  // unless the caller may still create content there (rext-backend E17).
  const runMetadata = { workspace_id: access.thread?.metadata?.workspace_id };

  if (body.background) {
    try {
      const run = await client.runs.create(threadId, ASSISTANT_ID, {
        command: { resume: body.payload },
        metadata: runMetadata,
        streamMode: GENERATION_STREAM_MODES,
        streamSubgraphs: true,
        streamResumable: true,
        ...runWebhookOption,
      });

      return Response.json(
        {
          threadId,
          run: {
            id: run.run_id,
            status: run.status,
            createdAt: run.created_at,
            updatedAt: run.updated_at,
          },
        },
        { status: 202 },
      );
    } catch (error) {
      if (isBackendAway(error)) return backendAwayResponse();
      if (isRunGone(error)) return runGoneResponse();
      // The backend's own sentence (a refusal) is passed on; the SDK's "HTTP 500: {…}" never is.
      return Response.json(
        {
          error: ownWords(
            error,
            "The article couldn't be started just now. Try again in a moment.",
          ),
        },
        { status: 500 },
      );
    }
  }

  let createdRunId: string | undefined;

  const stream = client.runs.stream(threadId, ASSISTANT_ID, {
    command: { resume: body.payload },
    metadata: runMetadata,
    streamMode: GENERATION_STREAM_MODES,
    streamSubgraphs: true,
    streamResumable: true,
    onDisconnect: "continue",
    ...runWebhookOption,
    onRunCreated: ({ run_id }) => {
      createdRunId = run_id;
    },
  });

  const { signal } = request;
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      let runAnnounced = false;
      try {
        for await (const chunk of stream) {
          if (signal.aborted) break;
          if (createdRunId && !runAnnounced) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  event: "run/created",
                  data: { run_id: createdRunId, thread_id: threadId },
                })}\n\n`,
              ),
            );
            runAnnounced = true;
          }
          const data = `data: ${JSON.stringify(leanChunk(chunk))}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
        if (signal.aborted) return;
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        if (signal.aborted) return;
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify(streamErrorPayload(error))}\n\n`,
          ),
        );
        controller.close();
      }
    },
    cancel() {
      // Called by the runtime when the client disconnects
      stream.return?.(undefined);
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
