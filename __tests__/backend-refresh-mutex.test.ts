/**
 * Regression test for the proactive/reactive refresh race: SessionTimeoutWarning's
 * proactive timer and authenticatedFetch()'s reactive 401 handler used to be two
 * independent implementations with no shared lock — if both triggered within
 * milliseconds of each other, they'd race the backend's single-use refresh
 * token and one would get hard-rejected as "revoked" instead of the harmless
 * request-coalescing this file now provides via requestBackendTokenRefresh().
 */
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

const getSessionMock = jest.fn();
const getCsrfTokenMock = jest.fn();
jest.mock("next-auth/react", () => ({
  getSession: (...args: unknown[]) => getSessionMock(...args),
  getCsrfToken: (...args: unknown[]) => getCsrfTokenMock(...args),
}));

import {
  authenticatedFetch,
  requestBackendTokenRefresh,
} from "@/lib/auth-utils";

describe("requestBackendTokenRefresh cross-path mutex", () => {
  const originalLocks = navigator.locks;

  beforeEach(() => {
    getSessionMock.mockReset();
    getCsrfTokenMock.mockReset();
    getCsrfTokenMock.mockResolvedValue("csrf-token-123");
    (global.fetch as jest.Mock).mockReset();
  });

  afterEach(() => {
    Object.defineProperty(navigator, "locks", {
      configurable: true,
      value: originalLocks,
    });
  });

  it("coalesces concurrent default-path (reactive) callers into one fetch", async () => {
    (global.fetch as jest.Mock).mockImplementation(async () => ({
      ok: true,
      json: async () => ({ user: { accessToken: "refreshed-token" } }),
    }));

    // All 5 fire synchronously, before the first one's async chain (which
    // needs at least one microtask tick, via the awaited getCsrfToken())
    // can resolve — so they all see the same in-flight backendRefreshPromise.
    const calls = Array.from({ length: 5 }, () => requestBackendTokenRefresh());
    const results = await Promise.all(calls);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    for (const session of results) {
      expect(session?.user?.accessToken).toBe("refreshed-token");
    }
  });

  it("shares the SAME lock between the reactive (default) path and a proactive override, e.g. SessionTimeoutWarning's update()", async () => {
    // Simulates SessionTimeoutWarning's proactive path: it doesn't call
    // fetch() at all, it calls next-auth's update() hook instead. If this
    // wins the race, its result must be what every caller — including the
    // reactive default-path caller — receives.
    const proactiveUpdate = jest.fn(async () => ({
      user: { accessToken: "proactive-path-token" },
    }));

    // The reactive (401-handler) path uses the default forceSessionRefresh,
    // which calls fetch(). It must NOT fire if the proactive path already
    // has one in flight.
    (global.fetch as jest.Mock).mockImplementation(async () => ({
      ok: true,
      json: async () => ({ user: { accessToken: "reactive-path-token" } }),
    }));

    // Synchronous fanout: the proactive call is issued first and claims the
    // mutex before the reactive call's own invocation runs a moment later.
    const proactiveCall = requestBackendTokenRefresh(proactiveUpdate as never);
    const reactiveCall = requestBackendTokenRefresh(); // no override -> default fetch path

    const [proactiveResult, reactiveResult] = await Promise.all([
      proactiveCall,
      reactiveCall,
    ]);

    // Only the winner's implementation should have actually run.
    expect(proactiveUpdate).toHaveBeenCalledTimes(1);
    expect(global.fetch).not.toHaveBeenCalled();

    // Both callers get the SAME (winner's) result.
    expect(proactiveResult?.user?.accessToken).toBe("proactive-path-token");
    expect(reactiveResult?.user?.accessToken).toBe("proactive-path-token");
  });

  it("allows a fresh refresh once the prior one has settled", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ user: { accessToken: "token-1" } }),
    });
    await requestBackendTokenRefresh();
    expect(global.fetch).toHaveBeenCalledTimes(1);

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ user: { accessToken: "token-2" } }),
    });
    const second = await requestBackendTokenRefresh();

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(second?.user?.accessToken).toBe("token-2");
  });

  it("re-reads inside the browser lock and skips a redundant tab refresh", async () => {
    getSessionMock.mockResolvedValue({
      user: { accessToken: "access-from-other-tab" },
      accessTokenExpires: 200,
    });
    const performRefresh = jest.fn(async () => ({
      user: { accessToken: "unnecessary-rotation" },
    }));
    const requestLock = jest.fn(
      async (_name: string, callback: () => Promise<unknown>) => callback(),
    );
    Object.defineProperty(navigator, "locks", {
      configurable: true,
      value: { request: requestLock },
    });

    const result = await requestBackendTokenRefresh(performRefresh as never, {
      accessToken: "stale-access",
      accessTokenExpires: 100,
    });

    expect(requestLock).toHaveBeenCalledWith(
      "rext-backend-token-refresh",
      expect.any(Function),
    );
    expect(getSessionMock).toHaveBeenCalledWith({ broadcast: false });
    expect(performRefresh).not.toHaveBeenCalled();
    expect(result?.user?.accessToken).toBe("access-from-other-tab");
  });

  it("does not mistake a regressed cookie for a newer session", async () => {
    getSessionMock.mockResolvedValue({
      user: { accessToken: "older-access-from-late-response" },
      accessTokenExpires: 50,
    });
    const performRefresh = jest.fn(async () => ({
      user: { accessToken: "actually-refreshed" },
      accessTokenExpires: 200,
    }));
    Object.defineProperty(navigator, "locks", {
      configurable: true,
      value: {
        request: async (_name: string, callback: () => Promise<unknown>) =>
          callback(),
      },
    });

    const result = await requestBackendTokenRefresh(performRefresh as never, {
      accessToken: "newer-snapshot",
      accessTokenExpires: 100,
    });

    expect(performRefresh).toHaveBeenCalledTimes(1);
    expect(result?.user?.accessToken).toBe("actually-refreshed");
  });
});

describe("authenticatedFetch 401 handling", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    getCsrfTokenMock.mockReset();
    getCsrfTokenMock.mockResolvedValue("csrf-token-123");
    (global.fetch as jest.Mock).mockReset();
  });

  it("does NOT force a logout when the session-refresh round-trip itself fails transiently (network/5xx to /api/auth/session) — only a definitive backend rejection should log the user out", async () => {
    getSessionMock.mockResolvedValue({ user: { accessToken: "stale-token" } });

    (global.fetch as jest.Mock).mockImplementation(
      async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url === "/api/auth/session") {
          // Simulate a transient failure reaching our own session endpoint —
          // NOT a definitive "refresh token revoked" response.
          return { ok: false, status: 503 };
        }
        // The protected API call itself.
        return { ok: false, status: 401 };
      },
    );

    const response = await authenticatedFetch("/api/v1/some-protected-route");

    // The original 401 is surfaced to the caller instead of throwing/redirecting.
    expect(response.status).toBe(401);
    // Only the protected call + the one failed session round-trip — no
    // retry loop, no redirect side effects.
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
