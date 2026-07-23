/**
 * Regression test for the `/api/auth/session` request storm: concurrent
 * getAuthHeaders() callers (one per component fetching data on page mount)
 * must share a single getSession() call instead of each firing their own.
 */
// jest.setup.ts globally stubs this module out; this test needs the real
// implementation to exercise the single-flight fix.
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
jest.mock("next-auth/react", () => ({
  getSession: (...args: unknown[]) => getSessionMock(...args),
  getCsrfToken: jest.fn(),
}));

import { clearAuthHeadersCache, getAuthHeaders } from "@/lib/auth-utils";

describe("getAuthHeaders single-flight session fetch", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    clearAuthHeadersCache();
  });

  it("coalesces concurrent callers into one getSession() call", async () => {
    let resolveSession: (value: unknown) => void = () => {};
    getSessionMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSession = resolve;
        }),
    );

    // Simulate the page-mount fan-out: many components calling
    // getAuthHeaders() before any of them has resolved.
    const calls = Array.from({ length: 10 }, () => getAuthHeaders());

    resolveSession({ user: { accessToken: "token-123" } });
    const results = await Promise.all(calls);

    expect(getSessionMock).toHaveBeenCalledTimes(1);
    expect(getSessionMock).toHaveBeenCalledWith({ broadcast: false });
    for (const headers of results) {
      expect(headers.Authorization).toBe("Bearer token-123");
    }
  });

  it("issues a fresh getSession() call when skipCache bypasses a warm cache", async () => {
    getSessionMock.mockResolvedValue({ user: { accessToken: "token-A" } });

    await getAuthHeaders(); // populates the 10s header cache
    await getAuthHeaders(); // served from cache, no new call
    expect(getSessionMock).toHaveBeenCalledTimes(1);

    await getAuthHeaders(true); // skipCache forces a fresh getSession() call
    expect(getSessionMock).toHaveBeenCalledTimes(2);
  });
});
