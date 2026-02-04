import { Client } from "@langchain/langgraph-sdk";
import { withApiMiddleware, createSuccessResponse } from "@/lib/api-middleware";

const getClient = () =>
  new Client({
    apiUrl:
      process.env.LANGGRAPH_API_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "http://localhost:2024",
  });

export const POST = withApiMiddleware(
  async (_request, context) => {
    const client = getClient();
    const thread = await client.threads.create();

    return createSuccessResponse(
      { thread_id: thread.thread_id },
      context.requestId,
    );
  },
  { enableLogging: true, requestIdPrefix: "gen_thread" },
);
