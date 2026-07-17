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

  it("persists the successor refresh token through three rotations", async () => {
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
        trigger: undefined,
        user: undefined as never,
        account: null,
        profile: undefined,
        isNewUser: false,
        session: undefined,
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
});
