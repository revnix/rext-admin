import { Client } from "@langchain/langgraph-sdk";
import { withApiMiddleware, createSuccessResponse } from "@/lib/api-middleware";

import { resolveApiBaseUrl } from "@/lib/api-base-url";

const getClient = () =>
  new Client({
    apiUrl: resolveApiBaseUrl({
      explicitBaseUrl: process.env.LANGGRAPH_API_URL,
    }),
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
