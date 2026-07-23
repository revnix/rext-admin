import type { JWT } from "next-auth/jwt";

jest.mock("@/lib/logger", () => ({
  log: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));
jest.mock("@/lib/auth-utils", () => ({
  getPrimaryRole: () => "user",
  AUTH_SESSION_UPDATE_ACTION: "refresh-backend-token",
  AUTH_SESSION_TOKEN_SWAP_ACTION: "replace-backend-tokens",
}));
jest.mock("@/lib/error-utils", () => ({
  extractApiError: (_body: unknown, fallback: string) => fallback,
  safeParseErrorBody: jest.fn(),
}));
jest.mock("@/lib/utils", () => ({
  safeJsonParse: (value: string, fallback: unknown) => {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  },
}));

jest.mock("next-auth", () => ({
  CredentialsSignin: class CredentialsSignin extends Error {
    code = "credentials";
  },
}));
jest.mock("next-auth/providers/credentials", () => ({
  __esModule: true,
  default: (options: object) => ({ id: "credentials", ...options }),
}));
jest.mock("next-auth/providers/github", () => ({
  __esModule: true,
  default: (options: object) => ({ id: "github", ...options }),
}));
jest.mock("next-auth/providers/google", () => ({
  __esModule: true,
  default: (options: object) => ({ id: "google", ...options }),
}));

import authConfig from "@/auth.config";

function unsignedJwt(jti: string, expiresInSeconds = 3600): string {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");

  return `${encode({ alg: "none", typ: "JWT" })}.${encode({
    id: "user-1",
    jti,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    type: "refresh",
  })}.signature`;
}

function refreshResponse(rotation: number): Response {
  const body = JSON.stringify({
    data: {
      access_token: `access-${rotation}`,
      refresh_token: unsignedJwt(`refresh-${rotation}`),
      expires_in: 300,
    },
  });

  return {
    ok: true,
    status: 200,
    text: async () => body,
  } as Response;
}

describe("AuthJS refresh-token persistence", () => {
  const jwtCallback = authConfig.callbacks?.jwt;

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("persists the successor refresh token through three explicit rotations", async () => {
    expect(jwtCallback).toBeDefined();
    if (!jwtCallback) throw new Error("JWT callback is not configured");

    let rotation = 0;
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockImplementation(async () => refreshResponse(++rotation));

    let token: JWT = {
      id: "user-1",
      email: "user@example.com",
      full_name: "Test User",
      picture: null,
      accessToken: "access-0",
      refreshToken: unsignedJwt("refresh-0"),
      accessTokenExpires: Date.now() - 1,
    };

    for (let expectedRotation = 1; expectedRotation <= 3; expectedRotation++) {
      token = await jwtCallback({
        token,
        trigger: "update",
        user: undefined as never,
        account: null,
        profile: undefined,
        isNewUser: false,
        session: { authAction: "refresh-backend-token" },
      });

      expect(token.accessToken).toBe(`access-${expectedRotation}`);
      expect(token.refreshToken).toBe(
        unsignedJwt(`refresh-${expectedRotation}`),
      );
      expect(token.error).toBeUndefined();

      // Advance to the next access-token expiry without changing the refresh
      // credential. The next callback must send the successor from the prior
      // response, not the original or an intermediate token.
      token.accessTokenExpires = Date.now() - 1;
    }

    const presentedJtis = fetchMock.mock.calls.map(([, init]) => {
      const body = JSON.parse((init as RequestInit).body as string);
      const payload = body.refresh_token.split(".")[1];
      return JSON.parse(Buffer.from(payload, "base64url").toString()).jti;
    });

    expect(presentedJtis).toEqual(["refresh-0", "refresh-1", "refresh-2"]);
  });

  it("does not rotate tokens during an ordinary expired session read", async () => {
    expect(jwtCallback).toBeDefined();
    if (!jwtCallback) throw new Error("JWT callback is not configured");

    const fetchMock = jest.spyOn(global, "fetch");
    const originalRefreshToken = unsignedJwt("refresh-0");
    const originalToken: JWT = {
      id: "user-1",
      email: "user@example.com",
      full_name: "Test User",
      picture: null,
      accessToken: "access-0",
      refreshToken: originalRefreshToken,
      accessTokenExpires: Date.now() - 60_000,
    };

    const token = await jwtCallback({
      token: originalToken,
      trigger: undefined,
      user: undefined as never,
      account: null,
      profile: undefined,
      isNewUser: false,
      session: undefined,
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(token).toBe(originalToken);
  });

  it("uses the explicit update action for a proactive rotation", async () => {
    expect(jwtCallback).toBeDefined();
    if (!jwtCallback) throw new Error("JWT callback is not configured");

    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValue(refreshResponse(1));

    const token = await jwtCallback({
      token: {
        id: "user-1",
        email: "user@example.com",
        full_name: "Test User",
        picture: null,
        accessToken: "access-0",
        refreshToken: unsignedJwt("refresh-0"),
        accessTokenExpires: Date.now() + 120_000,
      },
      trigger: "update",
      session: { authAction: "refresh-backend-token" },
      user: undefined as never,
      account: null,
      profile: undefined,
      isNewUser: false,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(token.refreshToken).toBe(unsignedJwt("refresh-1"));
  });

  it("treats a refresh-endpoint 401 as a terminal credential rejection", async () => {
    expect(jwtCallback).toBeDefined();
    if (!jwtCallback) throw new Error("JWT callback is not configured");

    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 401,
      text: async () =>
        JSON.stringify({
          error: {
            code: "unauthorized",
            message: "Refresh token session has been revoked",
          },
        }),
    } as Response);

    const token = await jwtCallback({
      token: {
        id: "user-1",
        email: "user@example.com",
        full_name: "Test User",
        picture: null,
        accessToken: "access-0",
        refreshToken: unsignedJwt("refresh-0"),
        accessTokenExpires: Date.now() - 1,
      },
      trigger: "update",
      session: { authAction: "refresh-backend-token" },
      user: undefined as never,
      account: null,
      profile: undefined,
      isNewUser: false,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(token.error).toBe("RefreshAccessTokenError");
  });

  it("does not persist a partial refresh response", async () => {
    expect(jwtCallback).toBeDefined();
    if (!jwtCallback) throw new Error("JWT callback is not configured");

    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          data: {
            access_token: "orphaned-access-token",
            expires_in: 300,
          },
        }),
    } as Response);
    const originalRefreshToken = unsignedJwt("refresh-0");
    const originalToken: JWT = {
      id: "user-1",
      email: "user@example.com",
      full_name: "Test User",
      picture: null,
      accessToken: "access-0",
      refreshToken: originalRefreshToken,
      accessTokenExpires: Date.now() - 1,
    };

    const token = await jwtCallback({
      token: originalToken,
      trigger: "update",
      session: { authAction: "refresh-backend-token" },
      user: undefined as never,
      account: null,
      profile: undefined,
      isNewUser: false,
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(token).toBe(originalToken);
    expect(token.accessToken).toBe("access-0");
    expect(token.refreshToken).toBe(originalRefreshToken);
    expect(token.error).toBeUndefined();
  });

  it("uses the backend OAuth expires_in value for proactive refresh timing", async () => {
    expect(jwtCallback).toBeDefined();
    if (!jwtCallback) throw new Error("JWT callback is not configured");

    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          data: {
            access_token: "oauth-access",
            refresh_token: unsignedJwt("oauth-refresh"),
            expires_in: 120,
            user: {
              id: "user-1",
              email: "oauth@example.com",
              roles: ["user"],
              permissions: ["user.read"],
            },
          },
        }),
    } as Response);

    const before = Date.now();
    const token = await jwtCallback({
      token: {},
      user: {
        id: "user-1",
        email: "oauth@example.com",
        name: "OAuth User",
        image: null,
      },
      account: {
        provider: "google",
        providerAccountId: "google-1",
      },
      trigger: "signIn",
      profile: undefined,
      isNewUser: false,
      session: undefined,
    } as never);

    expect(token.accessTokenExpires).toBeGreaterThanOrEqual(before + 120_000);
    expect(token.accessTokenExpires).toBeLessThanOrEqual(Date.now() + 120_000);
  });

  it("keeps the refresh token server-only in the public session", async () => {
    const sessionCallback = authConfig.callbacks?.session;
    expect(sessionCallback).toBeDefined();
    if (!sessionCallback) throw new Error("Session callback is not configured");

    const session = await sessionCallback({
      session: {
        user: { id: "user-1", email: "user@example.com", name: "Test User" },
        expires: new Date(Date.now() + 60_000).toISOString(),
      },
      token: {
        id: "user-1",
        email: "user@example.com",
        full_name: "Test User",
        picture: null,
        accessToken: "access-0",
        refreshToken: unsignedJwt("refresh-0"),
      },
      newSession: undefined,
      trigger: undefined,
    } as never);

    expect(session.user.accessToken).toBe("access-0");
    expect(session.user).not.toHaveProperty("refreshToken");
  });

  it("revokes backend tokens from the server-side sign-out event", async () => {
    const signOutEvent = authConfig.events?.signOut;
    expect(signOutEvent).toBeDefined();
    if (!signOutEvent) throw new Error("Sign-out event is not configured");

    const previousApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.rext.test";
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);

    try {
      await signOutEvent({
        token: {
          accessToken: "access-0",
          refreshToken: "refresh-0",
        } as never,
      });
    } finally {
      if (previousApiBaseUrl === undefined) {
        delete process.env.NEXT_PUBLIC_API_BASE_URL;
      } else {
        process.env.NEXT_PUBLIC_API_BASE_URL = previousApiBaseUrl;
      }
    }

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.rext.test/api/v1/user/logout",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer access-0",
        }),
        body: JSON.stringify({ refresh_token: "refresh-0" }),
      }),
    );
  });

  it("refreshes once before sign-out when the access token already expired", async () => {
    const signOutEvent = authConfig.events?.signOut;
    expect(signOutEvent).toBeDefined();
    if (!signOutEvent) throw new Error("Sign-out event is not configured");

    const previousApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.rext.test";
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce({ ok: false, status: 401 } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            access_token: "access-1",
            refresh_token: "refresh-1",
          },
        }),
      } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200 } as Response);

    try {
      await signOutEvent({
        token: {
          accessToken: "access-0",
          refreshToken: "refresh-0",
        } as never,
      });
    } finally {
      if (previousApiBaseUrl === undefined) {
        delete process.env.NEXT_PUBLIC_API_BASE_URL;
      } else {
        process.env.NEXT_PUBLIC_API_BASE_URL = previousApiBaseUrl;
      }
    }

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.rext.test/api/v1/user/refresh",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ refresh_token: "refresh-0" }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "https://api.rext.test/api/v1/user/logout",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer access-1",
        }),
        body: JSON.stringify({ refresh_token: "refresh-1" }),
      }),
    );
  });
});
