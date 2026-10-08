/**
 * @jest-environment node
 */
/**
 * Who the support chat says a user is (revnix/rext-control#711): the user the backend verifies
 * the session's token for, never a claim read from the token; an unguessable session token;
 * never while an admin impersonates someone; nothing when the chat isn't set up.
 */
import { createHmac } from "node:crypto";
import type { Session } from "next-auth";

import {
  resolveSupportChatIdentity,
  supportChatTokenId,
} from "@/lib/support-chat/identity";

const SECRET = "a-made-up-secret-for-the-test";

function session(claims: Record<string, unknown> = {}): Session {
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return {
    user: { accessToken: `header.${payload}.signature` },
    expires: "2099-01-01T00:00:00Z",
  } as unknown as Session;
}

/** The backend: which user the token is, and whether it's an impersonation. */
function backend({
  ok = true,
  impersonating = false,
  profile = { id: "u-1", email: "ana@example.com", full_name: "Ana" },
}: {
  ok?: boolean;
  impersonating?: boolean;
  profile?: Record<string, unknown>;
} = {}) {
  return jest.fn(async (url: string) => {
    if (!ok) return { ok: false, json: async () => ({}) } as Response;
    // As the backend answers: the profile is one level down, under `profile`.
    const data = url.endsWith("/api/v1/user/impersonate/status")
      ? { is_impersonating: impersonating }
      : { profile };
    return { ok: true, json: async () => ({ data }) } as Response;
  }) as unknown as typeof fetch;
}

describe("resolveSupportChatIdentity", () => {
  it("gives the backend's user an unguessable token, the same every time", async () => {
    const fetchImpl = backend();

    const outcome = await resolveSupportChatIdentity(
      session(),
      SECRET,
      fetchImpl,
    );

    expect(outcome).toEqual({
      ok: true,
      identity: {
        tokenId: createHmac("sha256", SECRET)
          .update("rext-support:u-1")
          .digest("hex"),
        userId: "u-1",
        email: "ana@example.com",
        name: "Ana",
        plan: null,
      },
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/user\/profile$/),
      {
        headers: { Authorization: expect.stringMatching(/^Bearer /) },
        cache: "no-store",
      },
    );
  });

  it("ignores a user id written into the token: only the backend's check counts", async () => {
    const outcome = await resolveSupportChatIdentity(
      session({ id: "victim-id", is_impersonating: false }),
      SECRET,
      backend(),
    );

    expect(outcome.ok && outcome.identity.userId).toBe("u-1");
  });

  it("refuses a token the backend doesn't accept", async () => {
    await expect(
      resolveSupportChatIdentity(session(), SECRET, backend({ ok: false })),
    ).resolves.toEqual({ ok: false, status: 401 });
  });

  it("refuses while an admin views as someone else", async () => {
    await expect(
      resolveSupportChatIdentity(
        session(),
        SECRET,
        backend({ impersonating: true }),
      ),
    ).resolves.toEqual({ ok: false, status: 403 });
  });

  it("refuses a request with no signed-in user, without asking the backend", async () => {
    const fetchImpl = backend();
    await expect(
      resolveSupportChatIdentity(null, SECRET, fetchImpl),
    ).resolves.toEqual({ ok: false, status: 401 });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("offers nothing when the chat isn't set up", async () => {
    await expect(
      resolveSupportChatIdentity(session(), undefined, backend()),
    ).resolves.toEqual({ ok: false, status: 404 });
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
});

describe("the backend's profile answer", () => {
  // Recorded from staging's GET /api/v1/user/profile on 2026-10-08 (values replaced): the route
  // read `data.id`, which this shape doesn't have, and answered 401 to every signed-in user.
  const recorded = {
    success: true,
    message: "Profile retrieved successfully",
    data: {
      profile: {
        id: "0b0f6a52-8f0e-4b0e-9d58-1c2f3a4b5c6d",
        email: "ana@example.com",
        full_name: "Ana Costa",
        display_name: null,
        avatar_url: null,
        bio: null,
        email_verified: true,
        language: "en",
        status: "active",
        timezone: "UTC",
        created_at: "2026-10-01T00:00:00Z",
        updated_at: "2026-10-01T00:00:00Z",
      },
    },
  };

  it("is read where the backend puts it", async () => {
    const fetchImpl = jest.fn(async (url: string) => ({
      ok: true,
      json: async () =>
        url.endsWith("/status")
          ? { data: { is_impersonating: false } }
          : recorded,
    })) as unknown as typeof fetch;

    const outcome = await resolveSupportChatIdentity(
      session(),
      SECRET,
      fetchImpl,
    );

    expect(outcome).toMatchObject({
      ok: true,
      identity: {
        userId: "0b0f6a52-8f0e-4b0e-9d58-1c2f3a4b5c6d",
        email: "ana@example.com",
        name: "Ana Costa",
      },
    });
  });

  it("answers 401 when it carries no profile", async () => {
    const fetchImpl = jest.fn(async (url: string) => ({
      ok: true,
      json: async () =>
        url.endsWith("/status")
          ? { data: { is_impersonating: false } }
          : { data: { id: "u-1" } },
    })) as unknown as typeof fetch;

    expect(
      await resolveSupportChatIdentity(session(), SECRET, fetchImpl),
    ).toEqual({ ok: false, status: 401 });
  });
});

describe("the plan sent beside the email", () => {
  const answers = (subscription: unknown) =>
    jest.fn(async (url: string) => ({
      ok: !(subscription instanceof Error && url.endsWith("/current")),
      json: async () => {
        if (url.endsWith("/status"))
          return { data: { is_impersonating: false } };
        if (url.endsWith("/profile")) {
          return { data: { profile: { id: "u-1", email: "ana@example.com" } } };
        }
        return { data: { subscription } };
      },
    })) as unknown as typeof fetch;

  it("is the plan's name as the customer sees it", async () => {
    const outcome = await resolveSupportChatIdentity(
      session(),
      SECRET,
      answers({ plan_name: "growth", plan_display_name: "Growth" }),
    );

    expect(outcome).toMatchObject({ ok: true, identity: { plan: "Growth" } });
  });

  it("falls back to the plan's own name", async () => {
    const outcome = await resolveSupportChatIdentity(
      session(),
      SECRET,
      answers({ plan_name: "trial", plan_display_name: null }),
    );

    expect(outcome).toMatchObject({ ok: true, identity: { plan: "trial" } });
  });

  it("is left out when the backend can't say, and the chat still opens", async () => {
    const outcome = await resolveSupportChatIdentity(
      session(),
      SECRET,
      answers(new Error("the subscription route failed")),
    );

    expect(outcome).toMatchObject({
      ok: true,
      identity: { userId: "u-1", plan: null },
    });
  });
});
