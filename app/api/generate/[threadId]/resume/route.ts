import type { NextRequest } from "next/server";
import { Client } from "@langchain/langgraph-sdk";

const ASSISTANT_ID = "agent";

const getClient = () =>
  new Client({
    apiUrl:
      process.env.LANGGRAPH_API_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "http://localhost:2024",
  });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const { threadId } = await params;

  let body: { payload: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const client = getClient();

  const stream = client.runs.stream(threadId, ASSISTANT_ID, {
    command: { resume: body.payload },
    streamMode: "updates",
    streamSubgraphs: true,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const data = `data: ${JSON.stringify(chunk)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Stream error";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`),
        );
        controller.close();
      }
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
