/**
 * @jest-environment node
 */
/**
 * Who the support chat says a user is (revnix/rext-control#711): a session token that can't be
 * guessed, never while an admin impersonates someone, and nothing when the chat isn't set up.
 */
import { createHmac } from "node:crypto";
import type { Session } from "next-auth";

import {
  supportChatIdentity,
  supportChatTokenId,
} from "@/lib/support-chat/identity";

const SECRET = "a-made-up-secret-for-the-test";

function session(claims: Record<string, unknown>): Session {
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return {
    user: {
      accessToken: `header.${payload}.signature`,
      email: "ana@example.com",
      name: "Ana",
    },
    expires: "2099-01-01T00:00:00Z",
  } as unknown as Session;
}

describe("supportChatIdentity", () => {
  it("gives the signed-in user an unguessable token, the same every time", () => {
    const outcome = supportChatIdentity(session({ id: "u-1" }), SECRET);
    const again = supportChatIdentity(session({ id: "u-1" }), SECRET);

    expect(outcome).toEqual({
      ok: true,
      identity: {
        tokenId: createHmac("sha256", SECRET)
          .update("rext-support:u-1")
          .digest("hex"),
        userId: "u-1",
        email: "ana@example.com",
        name: "Ana",
      },
    });
    expect(again).toEqual(outcome);
  });

  it("gives another user, or another secret, another token", () => {
    expect(supportChatTokenId("u-1", SECRET)).not.toBe(
      supportChatTokenId("u-2", SECRET),
    );
    expect(supportChatTokenId("u-1", SECRET)).not.toBe(
      supportChatTokenId("u-1", "another-secret"),
    );
    expect(supportChatTokenId("u-1", SECRET)).not.toContain("u-1");
  });

  it("refuses while an admin views as someone else", () => {
    expect(
      supportChatIdentity(
        session({ id: "u-1", is_impersonating: true }),
        SECRET,
      ),
    ).toEqual({ ok: false, status: 403 });
  });

  it("refuses a request with no signed-in user", () => {
    expect(supportChatIdentity(null, SECRET)).toEqual({
      ok: false,
      status: 401,
    });
    expect(supportChatIdentity(session({}), SECRET)).toEqual({
      ok: false,
      status: 401,
    });
  });

  it("offers nothing when the chat isn't set up", () => {
    expect(supportChatIdentity(session({ id: "u-1" }), undefined)).toEqual({
      ok: false,
      status: 404,
    });
  });
});
