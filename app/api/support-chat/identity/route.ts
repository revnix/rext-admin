import { auth } from "@/auth";
import { supportChatIdentity } from "@/lib/support-chat/identity";

/**
 * The signed-in user's identity for the support chat (revnix/rext-control#711), read by the
 * chat loader on the first "Chat with us". The proxy skips /api, so the session is checked
 * here. Never cached: it's the caller's own.
 */
export async function GET() {
  const outcome = supportChatIdentity(
    await auth(),
    process.env.CRISP_TOKEN_SECRET,
  );
  if (!outcome.ok) {
    return Response.json(
      { error: "The support chat isn't available" },
      { status: outcome.status, headers: { "Cache-Control": "no-store" } },
    );
  }
  return Response.json(outcome.identity, {
    headers: { "Cache-Control": "no-store" },
  });
}
