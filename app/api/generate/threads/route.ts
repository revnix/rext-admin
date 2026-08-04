import { withApiMiddleware, createSuccessResponse } from "@/lib/api-middleware";
import { getGenerationClient } from "@/lib/generate-content/thread-access";

export const POST = withApiMiddleware(
  async (_request, context) => {
    const client = getGenerationClient();
    // `metadata.owner` is what every other /api/generate route checks against
    // the caller's session. Nothing else writes it, so a thread created without
    // it is permanently unusable — keep this in step with `requireThreadOwner`.
    const thread = await client.threads.create({
      metadata: { owner: context.userId },
    });

    return createSuccessResponse(
      { thread_id: thread.thread_id },
      context.requestId,
    );
  },
  { enableLogging: true, requestIdPrefix: "gen_thread" },
);
