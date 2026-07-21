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

import { requestBackendTokenRefresh } from "@/lib/auth-utils";

describe("requestBackendTokenRefresh cross-path mutex", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    getCsrfTokenMock.mockReset();
    getCsrfTokenMock.mockResolvedValue("csrf-token-123");
    (global.fetch as jest.Mock).mockReset();
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
});
