import {
  getGenerationClient,
  isExpiredTokenError,
  requireGenerationIdentity,
  tokenExpired,
} from "@/lib/generate-content/thread-access";

export async function POST() {
  const access = await requireGenerationIdentity();
  if (!access.ok) return access.response;

  try {
    // `metadata.owner` is what every other /api/generate route checks against
    // the user the caller's token speaks for. Nothing else writes it, so a
    // thread created without it is permanently unusable — keep this in step
    // with `requireThreadOwner`.
    const thread = await getGenerationClient(access.accessToken).threads.create(
      { metadata: { owner: access.userId } },
    );

    return Response.json({ data: { thread_id: thread.thread_id } });
  } catch (error) {
    if (isExpiredTokenError(error)) return tokenExpired();

    return Response.json(
      { error: "Unable to start a generation" },
      { status: 502 },
    );
  }
}
