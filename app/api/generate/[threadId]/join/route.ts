import type { NextRequest } from "next/server";

import {
  getGenerationClient,
  requireThreadOwner,
} from "@/lib/generate-content/thread-access";

// Reconnect to the live SSE stream of an already-running server-owned run so a
// user returning to an in-progress generation sees tokens render live instead
// of a poll-only skeleton. Relies on the run being started with
// `streamResumable: true`. cancelOnDisconnect is false so viewing (and then
// leaving again) never cancels the run.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const { threadId } = await params;

  const access = await requireThreadOwner(threadId);
  if (!access.ok) return access.response;

  let body: { runId?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.runId) {
    return new Response(JSON.stringify({ error: "runId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const client = getGenerationClient(access.accessToken);
  const { signal } = request;

  const stream = client.runs.joinStream(threadId, body.runId, {
    streamMode: ["updates", "messages", "custom"],
    cancelOnDisconnect: false,
    signal,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (signal.aborted) break;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`),
          );
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
