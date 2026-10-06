import {
  getGenerationClient,
  isExpiredTokenError,
  requireGenerationIdentity,
  tokenExpired,
} from "@/lib/generate-content/thread-access";

const CONTENT_CREATE_REQUIRED = "CONTENT_CREATE_REQUIRED";

export async function POST(request: Request) {
  const access = await requireGenerationIdentity();
  if (!access.ok) return access.response;

  let workspaceId: unknown;
  try {
    ({ workspace_id: workspaceId } = await request.json());
  } catch {
    workspaceId = undefined;
  }
  if (typeof workspaceId !== "string" || !workspaceId) {
    return Response.json({ error: "Name the workspace" }, { status: 400 });
  }

  try {
    // `metadata.owner` is what every other /api/generate route checks against
    // the user the caller's token speaks for. Nothing else writes it, so a
    // thread created without it is permanently unusable — keep this in step
    // with `requireThreadOwner`. `metadata.workspace_id` is checked by the
    // backend, not trusted here: it refuses the thread unless the caller holds
    // content.create in that workspace, and every later run on the thread is
    // held to it (rext-backend E17).
    const thread = await getGenerationClient(access.accessToken).threads.create(
      { metadata: { owner: access.userId, workspace_id: workspaceId } },
    );

    return Response.json({ data: { thread_id: thread.thread_id } });
  } catch (error) {
    if (isExpiredTokenError(error)) return tokenExpired();
    if ((error as { status?: number })?.status === 403) {
      return Response.json(
        {
          error: "Your role in this workspace can't create content.",
          code: CONTENT_CREATE_REQUIRED,
        },
        { status: 403 },
      );
    }

    return Response.json(
      { error: "Unable to start a generation" },
      { status: 502 },
    );
  }
}
