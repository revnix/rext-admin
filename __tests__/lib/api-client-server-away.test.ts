// Riding out a backend deploy (rext-control task 759): the API restarts for about a minute, and the
// proxy answers 502 or 503 meanwhile, or the connection just fails. A GET is sent again after 1, 3
// and 8 seconds; anything that may change something fails at once with a sentence to show.

import { ApiClient, ApiError } from "@/lib/api-client/core";
import {
  alreadyRetried,
  isServerAway,
  noteServerAnswered,
  reportServerAway,
  reportServerBack,
  SERVER_UNREACHABLE,
  SERVER_UNREACHABLE_MESSAGE,
  stopWatchingServer,
} from "@/lib/api-client/server-away";
import { isTransientError } from "@/lib/retry/transient-retry";

jest.mock("@/lib/auth-utils", () => ({
  authenticatedFetch: jest.fn(),
  redirectToLogin: jest.fn(),
}));
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

const send = jest.requireMock("@/lib/auth-utils")
  .authenticatedFetch as jest.Mock;
// The real one: jest.setup.ts stands a mock in for the query client.
const { makeQueryClient } = jest.requireActual(
  "@/lib/query-client",
) as typeof import("@/lib/query-client");

/** The proxy's answer while the API restarts: a status and plain words, no JSON. */
const proxy = (status: 502 | 503) => ({
  ok: false,
  status,
  statusText: status === 502 ? "Bad Gateway" : "Service Unavailable",
  text: async () => "no available server",
});
/** The backend's own answer. */
const api = (status: number, body: unknown) => ({
  ok: status < 400,
  status,
  statusText: "",
  text: async () => JSON.stringify(body),
  json: async () => body,
});
const cut = () => new TypeError("Failed to fetch");

/** The request's end, kept either way so a rejection is never left unhandled. */
const settle = <T>(request: Promise<T>) =>
  request.then(
    (value) => ({ value, error: undefined }),
    (error: unknown) => ({ value: undefined, error }),
  );

const online = (value: boolean) =>
  Object.defineProperty(navigator, "onLine", { value, configurable: true });

// Each test starts a day after the last, so nothing one left behind (the quiet minute after the
// API answered) reaches the next.
let clock = Date.UTC(2026, 9, 8);
beforeEach(() => {
  clock += 24 * 60 * 60 * 1000;
  jest.useFakeTimers({ now: clock });
  send.mockReset();
  stopWatchingServer();
  noteServerAnswered();
  online(true);
});
afterEach(() => {
  jest.useRealTimers();
});

describe("a request that changes nothing", () => {
  it("is sent again after 1, 3 and 8 seconds, and answers once the API is back", async () => {
    send
      .mockResolvedValueOnce(proxy(502))
      .mockResolvedValueOnce(proxy(503))
      .mockRejectedValueOnce(cut())
      .mockResolvedValueOnce(api(200, { id: "p1" }));
    const done = settle(new ApiClient().request("/api/v1/personas"));

    await jest.advanceTimersByTimeAsync(999);
    expect(send).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1);
    expect(send).toHaveBeenCalledTimes(2);
    await jest.advanceTimersByTimeAsync(2999);
    expect(send).toHaveBeenCalledTimes(2);
    await jest.advanceTimersByTimeAsync(1);
    expect(send).toHaveBeenCalledTimes(3);
    await jest.advanceTimersByTimeAsync(8000);
    expect(send).toHaveBeenCalledTimes(4);

    expect(await done).toEqual({ value: { id: "p1" }, error: undefined });
    expect(isServerAway()).toBe(false);
  });

  it("fails with the sentence after the third retry, and tells the shell the server is away", async () => {
    send.mockRejectedValue(cut());
    const done = settle(new ApiClient().request("/api/v1/personas"));
    await jest.advanceTimersByTimeAsync(12000);
    const { error } = await done;

    expect(send).toHaveBeenCalledTimes(4);
    expect(ApiError.is(error)).toBe(true);
    expect((error as ApiError).message).toBe(SERVER_UNREACHABLE_MESSAGE);
    expect((error as ApiError).code).toBe(SERVER_UNREACHABLE);
    expect(isServerAway()).toBe(true);
    // A query doesn't wait it out again on top.
    expect(alreadyRetried(error)).toBe(true);
    const retry = makeQueryClient().getDefaultOptions().queries?.retry as (
      count: number,
      error: unknown,
    ) => boolean;
    expect(retry(0, error)).toBe(false);
    expect(retry(0, new Error("anything else"))).toBe(true);
  });

  it("retries the backend's own 503 but keeps its words, and doesn't call the server away", async () => {
    send.mockResolvedValue(
      api(503, { error: { message: "Payments are unavailable right now." } }),
    );
    const done = settle(new ApiClient().request("/api/v1/plans"));
    await jest.advanceTimersByTimeAsync(12000);
    const { error } = await done;

    expect(send).toHaveBeenCalledTimes(4);
    expect((error as ApiError).message).toBe(
      "Payments are unavailable right now.",
    );
    expect(isServerAway()).toBe(false);
  });

  it("is not retried for any other failure", async () => {
    send.mockResolvedValueOnce(api(500, { message: "boom" }));
    const failed = await settle(new ApiClient().request("/api/v1/personas"));
    expect((failed.error as ApiError).statusCode).toBe(500);

    send.mockResolvedValueOnce(api(404, { message: "Persona not found" }));
    const missing = await settle(new ApiClient().request("/api/v1/personas/x"));
    expect((missing.error as ApiError).statusCode).toBe(404);

    expect(send).toHaveBeenCalledTimes(2);
    expect(isServerAway()).toBe(false);
  });

  it("doesn't wait when the browser itself is offline", async () => {
    online(false);
    send.mockRejectedValue(cut());
    const { error } = await settle(new ApiClient().request("/api/v1/personas"));

    expect(send).toHaveBeenCalledTimes(1);
    expect((error as ApiError).message).toBe(SERVER_UNREACHABLE_MESSAGE);
    expect(isServerAway()).toBe(false);
  });

  it("stops waiting when the request is aborted", async () => {
    send.mockResolvedValue(proxy(503));
    const controller = new AbortController();
    const done = settle(
      new ApiClient().request("/api/v1/personas", {
        signal: controller.signal,
      }),
    );
    await jest.advanceTimersByTimeAsync(500);
    controller.abort();
    await jest.advanceTimersByTimeAsync(20000);
    const { error } = await done;

    expect(send).toHaveBeenCalledTimes(1);
    expect((error as Error).name).toBe("AbortError");
    expect(isServerAway()).toBe(false);
  });

  it("is retried the same way when the answer is read raw", async () => {
    send
      .mockResolvedValueOnce(proxy(503))
      .mockResolvedValueOnce({ ok: true, status: 200 });
    const done = settle(new ApiClient().requestRaw("/api/v1/content/1/export"));
    await jest.advanceTimersByTimeAsync(1000);

    expect((await done).value).toEqual({ ok: true, status: 200 });
    expect(send).toHaveBeenCalledTimes(2);
  });
});

describe("the report that the server is away", () => {
  it("says nothing new for a minute after the API answered, so one failing request can't bring the notice back in a loop", () => {
    reportServerAway();
    expect(isServerAway()).toBe(true);
    reportServerBack();
    expect(isServerAway()).toBe(false);

    reportServerAway();
    expect(isServerAway()).toBe(false);
    jest.advanceTimersByTime(59_999);
    reportServerAway();
    expect(isServerAway()).toBe(false);

    jest.advanceTimersByTime(1);
    reportServerAway();
    expect(isServerAway()).toBe(true);
  });

  it("stays quiet after the watch gave up, until a request is answered again", async () => {
    reportServerAway();
    stopWatchingServer();
    expect(isServerAway()).toBe(false);

    jest.advanceTimersByTime(10 * 60 * 1000);
    reportServerAway();
    expect(isServerAway()).toBe(false);

    send.mockResolvedValueOnce(api(200, { ok: true }));
    await new ApiClient().request("/api/v1/personas");
    reportServerAway();
    expect(isServerAway()).toBe(true);
  });
});

describe("a request that may change something", () => {
  it.each([
    ["the proxy's 502", () => send.mockResolvedValue(proxy(502))],
    ["the proxy's 503", () => send.mockResolvedValue(proxy(503))],
    ["a connection that fails", () => send.mockRejectedValue(cut())],
  ])(
    "is never sent again on %s: it fails at once with the sentence",
    async (_name, arrange) => {
      arrange();
      const { error } = await settle(
        new ApiClient().request("/api/v1/personas", {
          method: "POST",
          body: "{}",
        }),
      );

      expect(send).toHaveBeenCalledTimes(1);
      expect((error as ApiError).message).toBe(SERVER_UNREACHABLE_MESSAGE);
      expect((error as ApiError).code).toBe(SERVER_UNREACHABLE);
      // Not waited out by the client, so a caller's own bounded retry still may.
      expect(alreadyRetried(error)).toBe(false);
      expect(isTransientError(error)).toBe(true);
      expect(isServerAway()).toBe(false);
    },
  );

  it("keeps the backend's own words on its 503", async () => {
    send.mockResolvedValue(
      api(503, { error: { message: "Payments are unavailable right now." } }),
    );
    const { error } = await settle(
      new ApiClient().request("/api/v1/checkout", { method: "POST" }),
    );

    expect(send).toHaveBeenCalledTimes(1);
    expect((error as ApiError).message).toBe(
      "Payments are unavailable right now.",
    );
  });
});
