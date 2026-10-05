import { auth } from "@/auth";
import {
  AuthenticationError,
  withApiMiddleware,
  createSuccessResponse,
} from "@/lib/api-middleware";
import { generationIdentity } from "@/lib/generate-content/generation-identity";
import { getGenerationClient } from "@/lib/generate-content/thread-access";

export const POST = withApiMiddleware(
  async (_request, context) => {
    const identity = generationIdentity(await auth());
    if (!identity) throw new AuthenticationError();

    const client = getGenerationClient(identity.accessToken);
    // `metadata.owner` is what every other /api/generate route checks against
    // the user the caller's token speaks for. Nothing else writes it, so a
    // thread created without it is permanently unusable — keep this in step
    // with `requireThreadOwner`.
    const thread = await client.threads.create({
      metadata: { owner: identity.userId },
    });

    return createSuccessResponse(
      { thread_id: thread.thread_id },
      context.requestId,
    );
  },
  { enableLogging: true, requestIdPrefix: "gen_thread" },
);
