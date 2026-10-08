/**
 * No request leaves a signed-in page without its session token, and only a verdict on the session
 * signs a person out (revnix/rext-control#858). A page that outlived its session sent its
 * requests bare, the API answered 422 "Authorization: Field required", and a newcomer pressed
 * Create twice, nineteen minutes apart, to that sentence.
 */

import type * as SignedOut from "@/lib/auth/signed-out";
import type * as AuthUtils from "@/lib/auth-utils";

jest.mock("next-auth/react", () => ({
  getSession: jest.fn(),
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
jest.mock("@/lib/auth/go-to", () => ({ goTo: jest.fn() }));
jest.mock("@/lib/analytics", () => ({
  analytics: { track: jest.fn(() => true) },
}));

const URL_ASKED = "https://api.example.test/api/v1/workspaces/";
const SESSION_URL = "/api/auth/session";

/** A token whose payload carries the expiry the wrapper compares. */
const token = (name: string, expiresInSeconds: number) =>
  `${name}.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expiresInSeconds }))}.sig`;
const session = (accessToken: string, extra: object = {}) => ({
  user: { accessToken },
  ...extra,
});

/** An answer, as much of a Response as the wrapper and its callers read. */
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
const fine = () => answer(200, { data: {} });
const refusal = (status: number, code: string, message: string) =>
  answer(status, { error: { code, message } });

let send: jest.Mock;
let readSession: jest.Mock;
let signedOut: typeof SignedOut;

/** The real wrapper, loaded afresh: jest.setup.ts stands a mock in for it everywhere else. */
function freshWrapper(): typeof AuthUtils {
  jest.resetModules();
  const wrapper = jest.requireActual("@/lib/auth-utils") as typeof AuthUtils;
  readSession = jest.requireMock("next-auth/react").getSession as jest.Mock;
  signedOut = jest.requireActual("@/lib/auth/signed-out") as typeof SignedOut;
  return wrapper;
}

const signOuts = () =>
  (jest.requireMock("@/lib/logout-utils").performLogout as jest.Mock).mock
    .calls;
const sentTo = (url: string) =>
  send.mock.calls.filter(([asked]) => asked === url);

/** The request's end, kept either way so a rejection is never left unhandled. */
const settle = <T>(request: Promise<T>) =>
  request.then(
    (value) => ({ value, error: undefined }),
    (error: Error) => ({ value: undefined, error }),
  );

const realResponse = global.Response;

beforeEach(() => {
  jest.useFakeTimers();
  send = jest.fn();
  global.fetch = send as unknown as typeof fetch;
  // The wrapper builds its own answers with the constructor; jest.setup.ts has only the statics.
  global.Response = class {
    readonly status: number;
    readonly ok: boolean;
    constructor(
      private readonly body: string,
      init: { status: number },
    ) {
      this.status = init.status;
      this.ok = init.status < 400;
    }
    async json() {
      return JSON.parse(this.body);
    }
    async text() {
      return this.body;
    }
    clone() {
      return this;
    }
  } as unknown as typeof Response;
  window.history.pushState({}, "", "/w/create");
});

afterEach(() => {
  jest.useRealTimers();
  global.Response = realResponse;
});

describe("a signed-in page whose session read comes back empty", () => {
  it("reads the session once more, and sends the request with the token found then", async () => {
    const { authenticatedFetch } = freshWrapper();
    readSession
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(session("access-token"));
    send.mockResolvedValueOnce(fine());

    const request = settle(authenticatedFetch(URL_ASKED, { method: "POST" }));
    await jest.advanceTimersByTimeAsync(300);
    const { value } = await request;

    expect(value?.status).toBe(200);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][1].headers.get("Authorization")).toBe(
      "Bearer access-token",
    );
    expect(signedOut.isSignedOut()).toBe(false);
  });

  it("sends nothing when the second read is empty too, and answers in plain words", async () => {
    const { authenticatedFetch } = freshWrapper();
    readSession.mockResolvedValue(null);

    const request = settle(authenticatedFetch(URL_ASKED, { method: "POST" }));
    await jest.advanceTimersByTimeAsync(300);
    const { value } = await request;

    expect(send).not.toHaveBeenCalled();
    expect(value?.status).toBe(401);
    expect(await value?.json()).toEqual({
      success: false,
      error: {
        code: "signed_out",
        message: "You've been signed out. Sign in again to carry on.",
      },
    });
    // The page says so; nobody is signed out on the absence of a session.
    expect(signedOut.isSignedOut()).toBe(true);
    await jest.advanceTimersByTimeAsync(50);
    expect(signOuts()).toEqual([]);
  });

  it("does not wait or read twice once the page is known to be signed out", async () => {
    const { authenticatedFetch } = freshWrapper();
    readSession.mockResolvedValue(null);
    signedOut.reportSignedOut();

    const { value } = await settle(authenticatedFetch(URL_ASKED));

    expect(value?.status).toBe(401);
    expect(readSession).toHaveBeenCalledTimes(1);
    expect(send).not.toHaveBeenCalled();
  });

  it("takes the notice away when a later read finds a token", async () => {
    const { authenticatedFetch } = freshWrapper();
    readSession.mockResolvedValue(session("access-token"));
    signedOut.reportSignedOut();
    send.mockResolvedValueOnce(fine());

    const { value } = await settle(authenticatedFetch(URL_ASKED));

    expect(value?.status).toBe(200);
    expect(signedOut.isSignedOut()).toBe(false);
  });

  it("still sends from a page that opens without a session", async () => {
    window.history.pushState({}, "", "/invitations/accept?token=abc");
    const { authenticatedFetch } = freshWrapper();
    readSession.mockResolvedValue(null);
    send.mockResolvedValueOnce(fine());

    const { value } = await settle(authenticatedFetch(URL_ASKED));

    expect(value?.status).toBe(200);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][1].headers.has("Authorization")).toBe(false);
    expect(signedOut.isSignedOut()).toBe(false);
  });
});

describe("a 503 that says the session could not be checked", () => {
  const notChecked = () =>
    refusal(
      503,
      "database_connection_error",
      "We could not check your session just now. Please try again.",
    );

  it("is asked again, a POST too, since the request was never carried out", async () => {
    const { authenticatedFetch } = freshWrapper();
    readSession.mockResolvedValue(session("access-token"));
    send.mockResolvedValueOnce(notChecked()).mockResolvedValueOnce(fine());

    const request = settle(authenticatedFetch(URL_ASKED, { method: "POST" }));
    await jest.advanceTimersByTimeAsync(700);
    const { value } = await request;

    expect(value?.status).toBe(200);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("is given to the caller after two more tries", async () => {
    const { authenticatedFetch } = freshWrapper();
    readSession.mockResolvedValue(session("access-token"));
    send.mockResolvedValue(notChecked());

    const request = settle(authenticatedFetch(URL_ASKED, { method: "POST" }));
    await jest.advanceTimersByTimeAsync(700 + 1500);
    const { value } = await request;

    expect(value?.status).toBe(503);
    expect(send).toHaveBeenCalledTimes(3);
  });

  it("is known in the runtime's shape too, where the words are the body's detail", async () => {
    const { authenticatedFetch } = freshWrapper();
    readSession.mockResolvedValue(session("access-token"));
    send
      .mockResolvedValueOnce(
        answer(503, {
          detail: "We could not check your session just now. Please try again.",
        }),
      )
      .mockResolvedValueOnce(fine());

    const request = settle(authenticatedFetch(URL_ASKED, { method: "POST" }));
    await jest.advanceTimersByTimeAsync(700);
    const { value } = await request;

    expect(value?.status).toBe(200);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('does not use up the askings a "revoked" answer is owed', async () => {
    const { authenticatedFetch } = freshWrapper();
    readSession.mockResolvedValue(session("access-token"));
    const revoked = () =>
      refusal(401, "unauthorized", "Authentication session has been revoked");
    // A restarting backend: could not check, twice, then "revoked" twice, then it is itself.
    send
      .mockResolvedValueOnce(notChecked())
      .mockResolvedValueOnce(notChecked())
      .mockResolvedValueOnce(revoked())
      .mockResolvedValueOnce(revoked())
      .mockResolvedValueOnce(fine());

    const request = settle(authenticatedFetch(URL_ASKED));
    await jest.advanceTimersByTimeAsync(2 * (700 + 1500));
    const { value } = await request;

    expect(value?.status).toBe(200);
    expect(send).toHaveBeenCalledTimes(5);
    await jest.advanceTimersByTimeAsync(50);
    expect(signOuts()).toEqual([]);
  });

  it("leaves any other 503 alone", async () => {
    const { authenticatedFetch } = freshWrapper();
    readSession.mockResolvedValue(session("access-token"));
    send.mockResolvedValue(
      refusal(503, "external_service_error", "The search service is away."),
    );

    const { value } = await settle(
      authenticatedFetch(URL_ASKED, { method: "POST" }),
    );

    expect(value?.status).toBe(503);
    expect(send).toHaveBeenCalledTimes(1);
  });
});

describe("an expired token whose refresh did not advance the session", () => {
  const expired = () =>
    refusal(401, "token_expired", "Authentication token has expired");
  // Time left by this browser's clock, so nothing renews it ahead; the backend says otherwise.
  const old = token("old", 60);

  /** The API answers "expired"; the session update answers with `refreshed`. */
  function expiredThenRefresh(refreshed: unknown, refreshOk = true) {
    send.mockImplementation(async (url: string) =>
      url === SESSION_URL
        ? { ...answer(refreshOk ? 200 : 500, refreshed), ok: refreshOk }
        : expired(),
    );
  }

  it("keeps the person signed in when the refresh failed in passing, and says to try again", async () => {
    const { authenticatedFetch } = freshWrapper();
    // Every read holds the same token: the refresh changed nothing and reported no refusal.
    readSession.mockResolvedValue(session(old));
    expiredThenRefresh(session(old));

    const { value } = await settle(authenticatedFetch(URL_ASKED));

    expect(value?.status).toBe(503);
    expect(await value?.json()).toEqual({
      success: false,
      error: {
        code: "session_unconfirmed",
        message:
          "We couldn't confirm your session just now. Try again in a moment.",
      },
    });
    expect(sentTo(SESSION_URL)).toHaveLength(1);
    expect(signedOut.isSignedOut()).toBe(false);
    await jest.advanceTimersByTimeAsync(50);
    expect(signOuts()).toEqual([]);
  });

  it("does the same when the session update gave no answer at all", async () => {
    const { authenticatedFetch } = freshWrapper();
    readSession.mockResolvedValue(session(old));
    expiredThenRefresh(null, false);

    const { value } = await settle(authenticatedFetch(URL_ASKED));

    expect(value?.status).toBe(503);
    await jest.advanceTimersByTimeAsync(50);
    expect(signOuts()).toEqual([]);
  });

  it("says the page is signed out when the session is gone, without a second sign-out", async () => {
    const { authenticatedFetch } = freshWrapper();
    // The request went out with a token; by the time the refresh is over there is no session.
    readSession
      .mockResolvedValueOnce(session(old))
      .mockResolvedValueOnce(session(old))
      .mockResolvedValue(null);
    expiredThenRefresh(null);

    const { value } = await settle(authenticatedFetch(URL_ASKED));

    expect(value?.status).toBe(401);
    const body = await value?.json();
    expect(body?.error.code).toBe("signed_out");
    expect(signedOut.isSignedOut()).toBe(true);
    await jest.advanceTimersByTimeAsync(50);
    expect(signOuts()).toEqual([]);
  });

  it("signs out when the refresh was refused for good", async () => {
    const { authenticatedFetch } = freshWrapper();
    readSession.mockResolvedValue(session(old));
    expiredThenRefresh(session(old, { error: "RefreshAccessTokenError" }));

    const { error } = await settle(authenticatedFetch(URL_ASKED));
    await jest.advanceTimersByTimeAsync(50);

    expect(error?.message).toBe("Session expired");
    expect(signOuts()).toEqual([
      ["/login?redirect=%2Fw%2Fcreate&error=SessionExpired"],
    ]);
  });

  it("sends the request again with the new token when the refresh advanced", async () => {
    const { authenticatedFetch } = freshWrapper();
    const renewed = token("new", 600);
    readSession
      .mockResolvedValueOnce(session(old))
      .mockResolvedValueOnce(session(old))
      .mockResolvedValue(session(renewed));
    send.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url === SESSION_URL) return answer(200, session(renewed));
      const sent = new Headers(init?.headers).get("Authorization");
      return sent === `Bearer ${renewed}` ? fine() : expired();
    });

    const { value } = await settle(authenticatedFetch(URL_ASKED));

    expect(value?.status).toBe(200);
    expect(signOuts()).toEqual([]);
  });
});

describe("the request sent again after a refresh", () => {
  const expired = () =>
    refusal(401, "token_expired", "Authentication token has expired");
  // Time left by this browser's clock, so nothing renews it ahead; the backend says otherwise.
  const old = token("old", 60);
  const renewed = token("new", 600);

  /** The first answer is "expired", the refresh advances, and `again` answers the second send. */
  function refreshedThen(again: () => unknown) {
    readSession
      .mockResolvedValueOnce(session(old))
      .mockResolvedValueOnce(session(old))
      .mockResolvedValue(session(renewed));
    send.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url === SESSION_URL) return answer(200, session(renewed));
      const sent = new Headers(init?.headers).get("Authorization");
      return sent === `Bearer ${renewed}` ? again() : expired();
    });
  }

  it("signs out when the session was revoked meanwhile: still a verdict", async () => {
    const { authenticatedFetch } = freshWrapper();
    refreshedThen(() =>
      refusal(401, "unauthorized", "Authentication session has been revoked"),
    );

    const request = settle(authenticatedFetch(URL_ASKED));
    await jest.advanceTimersByTimeAsync(700 + 1500 + 50);
    const { error } = await request;

    expect(error?.message).toBe("Session expired");
    expect(signOuts()).toEqual([
      ["/login?redirect=%2Fw%2Fcreate&error=SessionEnded"],
    ]);
  });

  it("is not refreshed a second time when answered as expired again, and signs nobody out", async () => {
    const { authenticatedFetch } = freshWrapper();
    refreshedThen(expired);

    const { value } = await settle(authenticatedFetch(URL_ASKED));
    await jest.advanceTimersByTimeAsync(50);

    expect(value?.status).toBe(503);
    const body = await value?.json();
    expect(body?.error.code).toBe("session_unconfirmed");
    // Sent once with each token, and the session renewed no more than once.
    expect(sentTo(URL_ASKED)).toHaveLength(2);
    expect(sentTo(SESSION_URL).length).toBeLessThanOrEqual(1);
    expect(signOuts()).toEqual([]);
  });

  it("gives the endpoint's own 401 to the caller", async () => {
    const { authenticatedFetch } = freshWrapper();
    refreshedThen(() =>
      refusal(401, "unauthorized", "You are not a member of this workspace"),
    );

    const { value } = await settle(authenticatedFetch(URL_ASKED));
    await jest.advanceTimersByTimeAsync(50);

    expect(value?.status).toBe(401);
    expect(signOuts()).toEqual([]);
  });
});

describe("a tab that keeps failing to confirm its session", () => {
  const expired = () =>
    refusal(401, "token_expired", "Authentication token has expired");
  // Time left by this browser's clock for the whole test, so nothing renews it ahead.
  const old = token("old", 600);
  /** What analytics was told, in order. */
  const told = () =>
    (
      jest.requireMock("@/lib/analytics").analytics.track as jest.Mock
    ).mock.calls.filter(([event]) => event === "session_confirmation_failed");

  /** The API answers "expired" and the renewal brings the same token back, until `mended`. */
  function stuck() {
    const state = { mended: false };
    readSession.mockResolvedValue(session(old));
    send.mockImplementation(async (url: string) => {
      if (url === SESSION_URL) return answer(200, session(old));
      return state.mended ? fine() : expired();
    });
    return state;
  }

  /** `count` requests one after another, `apartMs` apart; the last answer's status. */
  async function ask(
    wrapper: typeof AuthUtils,
    count: number,
    apartMs = 2000,
  ): Promise<number | undefined> {
    let status: number | undefined;
    for (let i = 0; i < count; i += 1) {
      const { value } = await settle(wrapper.authenticatedFetch(URL_ASKED));
      status = value?.status;
      await jest.advanceTimersByTimeAsync(apartMs);
    }
    return status;
  }

  it("says nothing of one failure or two: those pass", async () => {
    const wrapper = freshWrapper();
    stuck();

    expect(await ask(wrapper, 2)).toBe(503);

    expect(told()).toEqual([]);
  });

  it("says so at the third in a row, with how long it has lasted", async () => {
    const wrapper = freshWrapper();
    stuck();

    await ask(wrapper, 3);

    expect(told()).toEqual([
      ["session_confirmation_failed", { in_a_row: 3, seconds: 4 }],
    ]);
    expect(signOuts()).toEqual([]);
  });

  it("says so once more at the tenth, and never again in that run", async () => {
    const wrapper = freshWrapper();
    stuck();

    await ask(wrapper, 14);

    expect(told()).toEqual([
      ["session_confirmation_failed", { in_a_row: 3, seconds: 4 }],
      ["session_confirmation_failed", { in_a_row: 10, seconds: 18 }],
    ]);
  });

  it("counts requests that failed together on one renewal as one failure", async () => {
    const wrapper = freshWrapper();
    stuck();

    const together = await Promise.all(
      Array.from({ length: 6 }, () =>
        settle(wrapper.authenticatedFetch(URL_ASKED)),
      ),
    );

    expect(together.map(({ value }) => value?.status)).toEqual(
      Array(6).fill(503),
    );
    expect(told()).toEqual([]);
  });

  it("starts again from nought once the API takes the token", async () => {
    const wrapper = freshWrapper();
    const state = stuck();

    await ask(wrapper, 2);
    state.mended = true;
    expect(await ask(wrapper, 1)).toBe(200);
    state.mended = false;
    await ask(wrapper, 2);

    expect(told()).toEqual([]);
  });

  it("does not take a server that is away for the token being taken", async () => {
    const wrapper = freshWrapper();
    stuck();

    await ask(wrapper, 2);
    send.mockImplementation(async () => answer(502, {}));
    expect(await ask(wrapper, 1)).toBe(502);
    stuck();
    await ask(wrapper, 1);

    expect(told()).toEqual([
      ["session_confirmation_failed", { in_a_row: 3, seconds: 6 }],
    ]);
  });
});

describe("a token that is past its time when a request is about to leave", () => {
  const past = token("past", -60);
  const renewed = token("renewed", 600);

  /** The session update answers with `next`; the API accepts whatever it is sent. */
  function renewalGives(next: unknown) {
    send.mockImplementation(async (url: string) =>
      url === SESSION_URL ? answer(200, next) : fine(),
    );
  }
  const tokensSent = () =>
    sentTo(URL_ASKED).map(([, init]) =>
      new Headers(init.headers).get("Authorization"),
    );

  it("is renewed first, so the backend is never asked with it", async () => {
    const { authenticatedFetch } = freshWrapper();
    readSession.mockResolvedValue(session(past));
    renewalGives(session(renewed));

    const { value } = await settle(authenticatedFetch(URL_ASKED));

    expect(value?.status).toBe(200);
    expect(tokensSent()).toEqual([`Bearer ${renewed}`]);
    expect(sentTo(SESSION_URL)).toHaveLength(1);
  });

  it("is renewed once for a page's ten first requests", async () => {
    const { authenticatedFetch } = freshWrapper();
    readSession.mockResolvedValue(session(past));
    renewalGives(session(renewed));

    const answers = await Promise.all(
      Array.from({ length: 10 }, () => settle(authenticatedFetch(URL_ASKED))),
    );

    expect(answers.every(({ value }) => value?.status === 200)).toBe(true);
    expect(tokensSent()).toEqual(Array(10).fill(`Bearer ${renewed}`));
    expect(sentTo(SESSION_URL)).toHaveLength(1);
  });

  it("goes as it is when the renewal brings nothing later, and is not tried ahead again", async () => {
    const { authenticatedFetch } = freshWrapper();
    readSession.mockResolvedValue(session(past));
    // The renewal failed in passing: the same token comes back.
    renewalGives(session(past));

    await settle(authenticatedFetch(URL_ASKED));
    await settle(authenticatedFetch(URL_ASKED));

    expect(tokensSent()).toEqual([`Bearer ${past}`, `Bearer ${past}`]);
    expect(sentTo(SESSION_URL)).toHaveLength(1);
  });

  it("stops renewing ahead when a token just renewed is past its time too: this clock is wrong", async () => {
    const { authenticatedFetch } = freshWrapper();
    const alsoPast = token("renewed-and-past", -30);
    readSession
      .mockResolvedValueOnce(session(past))
      .mockResolvedValueOnce(session(past))
      .mockResolvedValue(session(alsoPast));
    renewalGives(session(alsoPast));

    await settle(authenticatedFetch(URL_ASKED));
    await jest.advanceTimersByTimeAsync(11_000);
    await settle(authenticatedFetch(URL_ASKED));
    await jest.advanceTimersByTimeAsync(11_000);
    await settle(authenticatedFetch(URL_ASKED));

    // One renewal in all: the backend's own clock decides from here, through its 401.
    expect(sentTo(SESSION_URL)).toHaveLength(1);
    expect(sentTo(URL_ASKED)).toHaveLength(3);
  });

  it("leaves a token with time left alone", async () => {
    const { authenticatedFetch } = freshWrapper();
    readSession.mockResolvedValue(session(token("fresh", 600)));
    renewalGives(session(renewed));

    await settle(authenticatedFetch(URL_ASKED));

    expect(sentTo(SESSION_URL)).toHaveLength(0);
  });
});

describe("a write of the session cookie that is not a refresh", () => {
  it("waits its turn behind a refresh that is under way", async () => {
    const { inTurnWithTokenRefresh, requestBackendTokenRefresh } =
      freshWrapper();
    let finishRefresh: (value: null) => void = () => undefined;
    const refresh = requestBackendTokenRefresh(
      () =>
        new Promise<null>((resolve) => {
          finishRefresh = resolve;
        }),
    );
    const write = jest.fn(async () => "written");

    const turn = inTurnWithTokenRefresh(write);
    await jest.advanceTimersByTimeAsync(50);
    expect(write).not.toHaveBeenCalled();

    finishRefresh(null);
    await refresh;

    expect(await turn).toBe("written");
    expect(write).toHaveBeenCalledTimes(1);
  });

  it("runs at once when no refresh is under way", async () => {
    const { inTurnWithTokenRefresh } = freshWrapper();
    expect(await inTurnWithTokenRefresh(async () => 7)).toBe(7);
  });
});

describe("a 401 that is a verdict on the token itself", () => {
  it.each(["Invalid authentication token", "User ID missing in token payload"])(
    "signs out on %p after asking again, as for a revoked session",
    async (message) => {
      const { authenticatedFetch } = freshWrapper();
      readSession.mockResolvedValue(session("access-token"));
      send.mockResolvedValue(refusal(401, "unauthorized", message));

      const request = settle(authenticatedFetch(URL_ASKED));
      await jest.advanceTimersByTimeAsync(700 + 1500 + 50);
      const { error } = await request;

      expect(error?.message).toBe("Session expired");
      expect(send).toHaveBeenCalledTimes(3);
      expect(signOuts()).toEqual([
        ["/login?redirect=%2Fw%2Fcreate&error=SessionEnded"],
      ]);
    },
  );

  it("reads the verdict from the runtime's shape too (a run's or a thread's request)", async () => {
    const { authenticatedFetch } = freshWrapper();
    readSession.mockResolvedValue(session("access-token"));
    send.mockResolvedValue(
      answer(401, { detail: "Authentication session has been revoked" }),
    );

    const request = settle(authenticatedFetch(URL_ASKED));
    await jest.advanceTimersByTimeAsync(700 + 1500 + 50);
    const { error } = await request;

    expect(error?.message).toBe("Session expired");
    expect(signOuts()).toEqual([
      ["/login?redirect=%2Fw%2Fcreate&error=SessionEnded"],
    ]);
  });

  it("signs out again on a page that stayed open through a sign-out and has a session again", async () => {
    const { authenticatedFetch } = freshWrapper();
    readSession.mockResolvedValue(session("access-token"));
    send.mockResolvedValue(
      refusal(401, "unauthorized", "Authentication session has been revoked"),
    );
    const refusedAndSignedOut = async () => {
      const request = settle(authenticatedFetch(URL_ASKED));
      await jest.advanceTimersByTimeAsync(700 + 1500 + 50);
      await request;
    };

    await refusedAndSignedOut();
    expect(signOuts()).toHaveLength(1);

    // The person stayed on the page (a form with text in it), then signed in from another tab.
    signedOut.reportSignedOut("/login?error=SessionEnded");
    signedOut.reportSignedIn();

    await refusedAndSignedOut();
    expect(signOuts()).toHaveLength(2);
  });

  it("gives any other 401 to the caller and signs nobody out", async () => {
    const { authenticatedFetch } = freshWrapper();
    readSession.mockResolvedValue(session("access-token"));
    send.mockResolvedValue(
      refusal(401, "unauthorized", "You are not a member of this workspace"),
    );

    const { value } = await settle(authenticatedFetch(URL_ASKED));
    await jest.advanceTimersByTimeAsync(50);

    expect(value?.status).toBe(401);
    expect(send).toHaveBeenCalledTimes(1);
    expect(signOuts()).toEqual([]);
  });
});

describe("the query client", () => {
  it("signs nobody out on a query's 401: the verdict is the wrapper's", () => {
    const { makeQueryClient } = jest.requireActual(
      "@/lib/query-client",
    ) as typeof import("@/lib/query-client");
    expect(
      makeQueryClient().getDefaultOptions().queries?.throwOnError,
    ).toBeUndefined();
  });
});
