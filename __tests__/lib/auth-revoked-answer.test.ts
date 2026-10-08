/**
 * A "session revoked" answer is asked again before anyone is signed out (revnix/rext-control#858).
 * In the minute after the API restarts, a session that exists was answered "revoked" and accepted
 * again within a second; signing out on the first answer put a person who had just signed in back
 * on the sign-in page.
 */

import type * as AuthUtils from "@/lib/auth-utils";

jest.mock("next-auth/react", () => ({
  getSession: jest.fn(async () => ({
    user: { accessToken: "access-token" },
    accessTokenExpires: Date.now() + 600_000,
  })),
  getCsrfToken: jest.fn(async () => "csrf"),
}));
jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/logger", () => {
  const quiet = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const logger = { ...quiet, forComponent: () => quiet };
  return { logger, log: logger };
});
jest.mock("@/stores/auth-store", () => ({
  useAuthStore: {
    getState: () => ({ accessToken: null, clearTokens: jest.fn() }),
  },
}));
jest.mock("@/lib/logout-utils", () => ({
  performLogout: jest.fn(async () => undefined),
}));

const URL_ASKED = "https://api.example.test/api/v1/workspaces/all";

/** The backend's answer, as much of a Response as the wrapper reads. */
function answer(status: number, body: unknown) {
  const response = {
    ok: status < 400,
    status,
    statusText: "",
    json: async () => body,
    text: async () => JSON.stringify(body),
    clone: () => response,
  };
  return response;
}
const revoked = () =>
  answer(401, {
    error: {
      code: "unauthorized",
      message: "Authentication session has been revoked",
    },
  });
const fine = () => answer(200, { data: { workspaces: [] } });

let send: jest.Mock;

/** The real wrapper, loaded afresh: jest.setup.ts stands a mock in for it everywhere else. */
function freshWrapper(): typeof AuthUtils {
  jest.resetModules();
  return jest.requireActual("@/lib/auth-utils") as typeof AuthUtils;
}

const signedOutWith = () =>
  (jest.requireMock("@/lib/logout-utils").performLogout as jest.Mock).mock
    .calls;

/** The request's end, kept either way so a rejection is never left unhandled. */
const settle = <T>(request: Promise<T>) =>
  request.then(
    (value) => ({ value, error: undefined }),
    (error: Error) => ({ value: undefined, error }),
  );

beforeEach(() => {
  jest.useFakeTimers();
  send = jest.fn();
  global.fetch = send as unknown as typeof fetch;
});

afterEach(() => {
  jest.useRealTimers();
});

describe("a 401 that says the session is revoked", () => {
  it("is asked again, and the person stays signed in when it is then accepted", async () => {
    const { authenticatedFetch } = freshWrapper();
    send.mockResolvedValueOnce(revoked()).mockResolvedValueOnce(fine());

    const request = settle(authenticatedFetch(URL_ASKED));
    await jest.advanceTimersByTimeAsync(700);
    const { value } = await request;

    expect(value?.status).toBe(200);
    expect(send).toHaveBeenCalledTimes(2);
    // The same request, with the same sign-in.
    const [firstUrl, first] = send.mock.calls[0];
    const [secondUrl, second] = send.mock.calls[1];
    expect(secondUrl).toBe(firstUrl);
    expect(second.headers.get("Authorization")).toBe("Bearer access-token");
    expect(first.headers.get("Authorization")).toBe("Bearer access-token");
    await jest.advanceTimersByTimeAsync(50);
    expect(signedOutWith()).toEqual([]);
  });

  it("is accepted on the second asking too", async () => {
    const { authenticatedFetch } = freshWrapper();
    send
      .mockResolvedValueOnce(revoked())
      .mockResolvedValueOnce(revoked())
      .mockResolvedValueOnce(fine());

    const request = settle(authenticatedFetch(URL_ASKED));
    await jest.advanceTimersByTimeAsync(700 + 1500);
    const { value } = await request;

    expect(value?.status).toBe(200);
    expect(send).toHaveBeenCalledTimes(3);
    await jest.advanceTimersByTimeAsync(50);
    expect(signedOutWith()).toEqual([]);
  });

  it("signs the person out when the backend still says so", async () => {
    const { authenticatedFetch } = freshWrapper();
    send.mockResolvedValue(revoked());

    const request = settle(authenticatedFetch(URL_ASKED));
    await jest.advanceTimersByTimeAsync(700 + 1500);
    const { error } = await request;

    expect(error?.message).toBe("Session expired");
    expect(send).toHaveBeenCalledTimes(3);
    await jest.advanceTimersByTimeAsync(50);
    expect(signedOutWith()).toEqual([["/login?error=SessionExpired"]]);
  });

  it("gives back another kind of refusal met on asking again, without a sign-out", async () => {
    const { authenticatedFetch } = freshWrapper();
    const noPermission = answer(401, {
      error: { code: "unauthorized", message: "Incorrect password" },
    });
    send.mockResolvedValueOnce(revoked()).mockResolvedValueOnce(noPermission);

    const request = settle(authenticatedFetch(URL_ASKED));
    await jest.advanceTimersByTimeAsync(700);
    const { value } = await request;

    expect(value).toBe(noPermission);
    await jest.advanceTimersByTimeAsync(50);
    expect(signedOutWith()).toEqual([]);
  });
});

describe("what comes back on asking again", () => {
  it("is handled as a first answer would be: an expired token goes on to be refreshed", async () => {
    const { authenticatedFetch } = freshWrapper();
    const expired = answer(401, {
      error: {
        code: "token_expired",
        message: "Authentication token has expired",
      },
    });
    send.mockResolvedValueOnce(revoked()).mockResolvedValue(expired);

    const request = settle(authenticatedFetch(URL_ASKED));
    await jest.advanceTimersByTimeAsync(700);
    await jest.advanceTimersByTimeAsync(3000);
    await request;

    // Handed straight back, it would have ended at two sends. The refresh path sends more:
    // the session's refresh, or the request again with a newer token.
    expect(send.mock.calls.length).toBeGreaterThan(2);
  });

  it("tells the page its permissions may be stale when it is a 403", async () => {
    const { authenticatedFetch, PERMISSIONS_STALE_EVENT } = freshWrapper();
    const stale = jest.fn();
    window.addEventListener(PERMISSIONS_STALE_EVENT, stale);
    send
      .mockResolvedValueOnce(revoked())
      .mockResolvedValueOnce(answer(403, { error: { message: "Forbidden" } }));

    const request = settle(authenticatedFetch(URL_ASKED));
    await jest.advanceTimersByTimeAsync(700);
    const { value } = await request;
    window.removeEventListener(PERMISSIONS_STALE_EVENT, stale);

    expect(value?.status).toBe(403);
    expect(stale).toHaveBeenCalledTimes(1);
  });
});

describe("a caller that cancels while the answer is being asked again", () => {
  it("gets its cancellation, and nobody is signed out", async () => {
    const { authenticatedFetch } = freshWrapper();
    send.mockResolvedValue(revoked());
    const cancel = new AbortController();

    const request = settle(
      authenticatedFetch(URL_ASKED, { signal: cancel.signal }),
    );
    await jest.advanceTimersByTimeAsync(300);
    cancel.abort();
    const { error } = await request;

    expect(error?.name).toBe("AbortError");
    expect(send).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(3000);
    expect(signedOutWith()).toEqual([]);
  });

  it("gets the failure of the second send, and nobody is signed out", async () => {
    // The API away at that moment (a restart): the request fails as any other does then.
    const { authenticatedFetch } = freshWrapper();
    send
      .mockResolvedValueOnce(revoked())
      .mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const request = settle(authenticatedFetch(URL_ASKED));
    await jest.advanceTimersByTimeAsync(700);
    const { error } = await request;

    expect(error?.message).toBe("Failed to fetch");
    await jest.advanceTimersByTimeAsync(3000);
    expect(signedOutWith()).toEqual([]);
  });
});

describe("a suspended or banned account", () => {
  it("is signed out at once: that answer is the account's own status", async () => {
    const { authenticatedFetch } = freshWrapper();
    send.mockResolvedValue(
      answer(401, {
        error: {
          code: "account_banned",
          message: "Your account has been banned.",
        },
      }),
    );

    const { error } = await settle(authenticatedFetch(URL_ASKED));

    expect(error?.message).toBe("AccountBanned");
    expect(send).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(50);
    expect(signedOutWith()).toEqual([["/login?error=AccountBanned"]]);
  });
});
