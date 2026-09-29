import type { NextRequest } from "next/server";

import {
  getGenerationClient,
  requireThreadOwner,
} from "@/lib/generate-content/thread-access";

const ASSISTANT_ID = "agent";
// LangGraph calls this back in-process when the run ends (Generation Failed).
const GENERATION_RUN_WEBHOOK = "/api/v1/content/generation/run-finished";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const { threadId } = await params;

  const access = await requireThreadOwner(threadId);
  if (!access.ok) return access.response;

  let body: { input: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const client = getGenerationClient();
  let createdRunId: string | undefined;

  const stream = client.runs.stream(threadId, ASSISTANT_ID, {
    input: body.input,
    streamMode: ["updates", "messages", "custom"],
    streamSubgraphs: true,
    streamResumable: true,
    webhook: GENERATION_RUN_WEBHOOK,
    onDisconnect: "continue",
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
          const data = `data: ${JSON.stringify(chunk)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
        if (signal.aborted) return;
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        if (signal.aborted) return;
        const msg = error instanceof Error ? error.message : "Stream error";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`),
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
