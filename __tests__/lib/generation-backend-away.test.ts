/**
 * @jest-environment node
 */

// The generation flow while the backend is away (rext-control task 759): a deploy restarts it for
// about a minute. A start or a step says it couldn't reach the server instead of a raw error, and
// a status read tells "away" from a run that failed, so the page keeps asking.

jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/auth-utils", () => ({
  authenticatedFetch: jest.fn(),
}));

import {
  SERVER_UNREACHABLE,
  SERVER_UNREACHABLE_MESSAGE,
} from "@/lib/api-client/server-away";
import {
  AWAY_PATIENCE_MS,
  BackendAwayError,
  backendAwayResponse,
  isAwayFailure,
  isAwayResponse,
  isBackendAway,
  keepsWaiting,
} from "@/lib/generate-content/backend-away";
import {
  createThread,
  RunStreamError,
  streamFromSSE,
} from "@/lib/generate-content/stream-utils";
import { streamErrorPayload } from "@/lib/generate-content/thread-access";

const send = jest.requireMock("@/lib/auth-utils")
  .authenticatedFetch as jest.Mock;

/** LangGraph's SDK puts the answer's status on its error. */
const sdkError = (status: number) =>
  Object.assign(new Error(`HTTP ${status}`), { status });

const firstEvent = (url: string) =>
  streamFromSSE(url, {}).next() as Promise<unknown>;

beforeEach(() => send.mockReset());

describe("in a generate route", () => {
  it("tells the backend being away from any other failure", () => {
    expect(isBackendAway(sdkError(502))).toBe(true);
    expect(isBackendAway(sdkError(503))).toBe(true);
    expect(isBackendAway(sdkError(504))).toBe(true);
    expect(isBackendAway(new TypeError("fetch failed"))).toBe(true);
    expect(isBackendAway(new TypeError("terminated"))).toBe(true);

    expect(isBackendAway(sdkError(500))).toBe(false);
    expect(isBackendAway(sdkError(404))).toBe(false);
    // A bug is a bug, not a deploy.
    expect(isBackendAway(new TypeError("chunk.data is not iterable"))).toBe(
      false,
    );
  });

  it("answers 503 with the sentence and the code", async () => {
    const response = backendAwayResponse();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: SERVER_UNREACHABLE_MESSAGE,
      code: SERVER_UNREACHABLE,
    });
  });

  it("sends a stream's end the same way: the sentence, not the SDK's error", () => {
    expect(streamErrorPayload(new TypeError("terminated"))).toEqual({
      error: SERVER_UNREACHABLE_MESSAGE,
      code: SERVER_UNREACHABLE,
    });
    expect(streamErrorPayload(sdkError(503))).toEqual({
      error: SERVER_UNREACHABLE_MESSAGE,
      code: SERVER_UNREACHABLE,
    });
    // Any other end of the SDK's making: the app's own sentence, never its status-and-body text
    // (rext-control task 824).
    expect(streamErrorPayload(sdkError(500))).toEqual({
      error: "This run stopped on our side. Try again, or start a new article.",
    });
    // A run that isn't there (any more) is said as that, with its code.
    expect(streamErrorPayload(sdkError(404))).toEqual({
      error: "This article's run is no longer here. Start a new one.",
      code: "run_not_found",
    });
    // A sentence of the app's own is passed on as it is.
    expect(
      streamErrorPayload(new Error("Your role can't create content here.")),
    ).toEqual({ error: "Your role can't create content here." });
  });
});

describe("in the page", () => {
  it.each([502, 503, 504])(
    "a step answered %i says it couldn't reach the server",
    async (status) => {
      send.mockResolvedValue({ ok: false, status });
      const error = await firstEvent("/api/generate/t1/resume").catch(
        (e: unknown) => e,
      );

      expect(error).toBeInstanceOf(RunStreamError);
      expect((error as RunStreamError).message).toBe(
        SERVER_UNREACHABLE_MESSAGE,
      );
      expect((error as RunStreamError).code).toBe(SERVER_UNREACHABLE);
      // Sent once: it may have arrived.
      expect(send).toHaveBeenCalledTimes(1);
    },
  );

  it("a step whose connection fails says the same", async () => {
    send.mockRejectedValue(new TypeError("Failed to fetch"));
    const error = await firstEvent("/api/generate/t1/resume").catch(
      (e: unknown) => e,
    );

    expect((error as RunStreamError).code).toBe(SERVER_UNREACHABLE);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("a step whose stream is cut after it opened says the same, so it's never sent twice", async () => {
    send.mockResolvedValue({
      ok: true,
      status: 200,
      body: {
        getReader: () => ({
          read: async () => {
            throw new TypeError("terminated");
          },
          cancel: jest.fn(),
        }),
      },
    });
    const error = await firstEvent("/api/generate/t1/resume").catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(RunStreamError);
    expect((error as RunStreamError).code).toBe(SERVER_UNREACHABLE);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("any other failed step keeps its own error, and an abort stays an abort", async () => {
    send.mockResolvedValue({ ok: false, status: 500 });
    const failed = await firstEvent("/api/generate/t1/resume").catch(
      (e: unknown) => e,
    );
    expect(failed).not.toBeInstanceOf(RunStreamError);
    expect((failed as Error).message).toBe("Stream failed");

    const abort = Object.assign(new Error("aborted"), { name: "AbortError" });
    send.mockRejectedValue(abort);
    expect(
      await firstEvent("/api/generate/t1/resume").catch((e: unknown) => e),
    ).toBe(abort);
  });

  it("a new run that can't reach the server says so", async () => {
    send.mockResolvedValue({ ok: false, status: 503 });
    await expect(createThread("ws-1")).rejects.toThrow(
      SERVER_UNREACHABLE_MESSAGE,
    );

    // The route's own refusal still shows its words.
    send.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        error: "Your role in this workspace can't create content.",
      }),
    });
    await expect(createThread("ws-1")).rejects.toThrow(
      "Your role in this workspace can't create content.",
    );
  });

  it("a status read tells away from failed, and waits three minutes for the backend", () => {
    expect(isAwayResponse(503)).toBe(true);
    expect(isAwayResponse(500)).toBe(false);
    expect(isAwayResponse(202)).toBe(false);

    expect(isAwayFailure(new BackendAwayError())).toBe(true);
    expect(isAwayFailure(new TypeError("Failed to fetch"))).toBe(true);
    expect(
      isAwayFailure(new Error("This article could not be generated.")),
    ).toBe(false);

    const since = 1_000_000;
    expect(keepsWaiting(since, since)).toBe(true);
    expect(keepsWaiting(since, since + AWAY_PATIENCE_MS - 1)).toBe(true);
    expect(keepsWaiting(since, since + AWAY_PATIENCE_MS)).toBe(false);
    expect(AWAY_PATIENCE_MS).toBe(180_000);
  });
});
