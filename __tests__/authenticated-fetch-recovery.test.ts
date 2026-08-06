jest.unmock("@/lib/auth-utils");

jest.mock("@/lib/logger", () => ({
  log: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));
jest.mock("@/auth", () => ({ auth: jest.fn() }));
const mockAuthStoreState = {
  accessToken: null as string | null,
  refreshToken: null as string | null,
  clearTokens: jest.fn(() => {
    mockAuthStoreState.accessToken = null;
    mockAuthStoreState.refreshToken = null;
  }),
};
jest.mock("@/stores/auth-store", () => ({
  useAuthStore: {
    getState: () => mockAuthStoreState,
  },
}));

const getSessionMock = jest.fn();
const getCsrfTokenMock = jest.fn();
jest.mock("next-auth/react", () => ({
  getSession: (...args: unknown[]) => getSessionMock(...args),
  getCsrfToken: (...args: unknown[]) => getCsrfTokenMock(...args),
}));

import { authenticatedFetch, clearAuthHeadersCache } from "@/lib/auth-utils";

function response(status: number, body: unknown): Response {
  const serialized = JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Unauthorized",
    clone: () => response(status, body),
    json: async () => body,
    text: async () => serialized,
  } as Response;
}

function unsignedAccessJwt(expiresAtMs: number, jti: string): string {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "none", typ: "JWT" })}.${encode({
    exp: Math.floor(expiresAtMs / 1000),
    jti,
    type: "access",
  })}.signature`;
}

const oldAccessToken = unsignedAccessJwt(Date.now() - 60_000, "access-old");
const newAccessToken = unsignedAccessJwt(Date.now() + 60_000, "access-new");
const oldSession = {
  user: { accessToken: oldAccessToken },
  accessTokenExpires: Date.now() - 60_000,
};
const newSession = {
  user: { accessToken: newAccessToken },
  accessTokenExpires: Date.now() + 60_000,
};

describe("authenticatedFetch 401 recovery", () => {
  beforeEach(() => {
    clearAuthHeadersCache();
    getSessionMock.mockReset();
    getCsrfTokenMock.mockReset();
    getCsrfTokenMock.mockResolvedValue("csrf-token");
    (global.fetch as jest.Mock).mockReset();
    mockAuthStoreState.accessToken = null;
    mockAuthStoreState.refreshToken = null;
    mockAuthStoreState.clearTokens.mockClear();
  });

  it("returns an unrelated 401 without rotating or signing out", async () => {
    getSessionMock.mockResolvedValue(oldSession);
    const unauthorized = response(401, {
      error: { code: "unauthorized", message: "Permission denied" },
    });
    (global.fetch as jest.Mock).mockResolvedValue(unauthorized);

    const result = await authenticatedFetch("/protected");

    expect(result).toBe(unauthorized);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(getCsrfTokenMock).not.toHaveBeenCalled();
  });

  it("retries with a token already refreshed by another tab", async () => {
    getSessionMock
      .mockResolvedValueOnce(oldSession)
      .mockResolvedValueOnce(newSession)
      .mockResolvedValueOnce(newSession);
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(
        response(401, {
          error: {
            code: "token_expired",
            message: "Authentication token has expired",
          },
        }),
      )
      .mockResolvedValueOnce(response(200, { success: true }));

    const result = await authenticatedFetch("/protected");

    expect(result.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(getCsrfTokenMock).not.toHaveBeenCalled();
    const retryHeaders = (global.fetch as jest.Mock).mock.calls[1][1]
      .headers as Headers;
    expect(retryHeaders.get("Authorization")).toBe(`Bearer ${newAccessToken}`);
  });

  it("keeps the session when the refresh endpoint fails transiently", async () => {
    getSessionMock.mockResolvedValue(oldSession);
    const expired = response(401, {
      error: {
        code: "token_expired",
        message: "Authentication token has expired",
      },
    });
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(expired)
      .mockResolvedValueOnce(response(503, { error: { code: "unavailable" } }));

    const result = await authenticatedFetch("/protected");

    expect(result).toBe(expired);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(getCsrfTokenMock).toHaveBeenCalledTimes(1);
  });

  it("does not retry a cookie that regressed to an older access expiry", async () => {
    getSessionMock
      .mockResolvedValueOnce(newSession)
      .mockResolvedValueOnce(oldSession)
      .mockResolvedValueOnce(oldSession)
      .mockResolvedValueOnce({
        user: { accessToken: "access-refreshed" },
        accessTokenExpires: Date.now() + 120_000,
      });
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(
        response(401, {
          error: {
            code: "token_expired",
            message: "Authentication token has expired",
          },
        }),
      )
      .mockResolvedValueOnce(
        response(200, {
          user: { accessToken: "access-refreshed" },
          accessTokenExpires: Date.now() + 120_000,
        }),
      )
      .mockResolvedValueOnce(response(200, { success: true }));

    const result = await authenticatedFetch("/protected");

    expect(result.status).toBe(200);
    expect(getCsrfTokenMock).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  // Regression: the backend raises "Authentication session has been revoked"
  // with the same generic `unauthorized` code as a permission failure. It used
  // to fall through the expiry check and be handed straight back to the caller,
  // leaving the Auth.js cookie valid and error-free — so nothing refreshed,
  // nothing redirected, and the user was stranded on a dashboard where every
  // request 401'd forever.
  it("signs out when the backend reports the session was revoked", async () => {
    getSessionMock.mockResolvedValue(newSession);
    (global.fetch as jest.Mock).mockResolvedValue(
      response(401, {
        error: {
          code: "unauthorized",
          message: "Authentication session has been revoked",
        },
      }),
    );

    await expect(authenticatedFetch("/protected")).rejects.toThrow(
      "Session expired",
    );
    // Terminal: no refresh is attempted, because the refresh token belongs to
    // the same session the backend already discarded.
    expect(getCsrfTokenMock).not.toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("signs out when the backend reports the user was deleted", async () => {
    getSessionMock.mockResolvedValue(newSession);
    (global.fetch as jest.Mock).mockResolvedValue(
      response(401, {
        error: {
          code: "unauthorized",
          message: "User not found or has been deleted",
        },
      }),
    );

    await expect(authenticatedFetch("/protected")).rejects.toThrow(
      "Session expired",
    );
    expect(getCsrfTokenMock).not.toHaveBeenCalled();
  });

  it("falls back to the original session when impersonation access expires", async () => {
    mockAuthStoreState.accessToken = "impersonation-access";
    mockAuthStoreState.refreshToken = "impersonation-refresh";
    getSessionMock.mockResolvedValue(newSession);
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(
        response(401, {
          error: {
            code: "token_expired",
            message: "Authentication token has expired",
          },
        }),
      )
      .mockResolvedValueOnce(response(200, { success: true }));

    const result = await authenticatedFetch("/protected");

    expect(result.status).toBe(200);
    expect(mockAuthStoreState.clearTokens).toHaveBeenCalledTimes(1);
    const retryHeaders = (global.fetch as jest.Mock).mock.calls[1][1]
      .headers as Headers;
    expect(retryHeaders.get("Authorization")).toBe(`Bearer ${newAccessToken}`);
    expect(getCsrfTokenMock).not.toHaveBeenCalled();
  });
});
