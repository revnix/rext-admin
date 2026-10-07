/**
 * @jest-environment node
 */

// E27: the backend refuses a run with 429 when the user already has two in flight (rext-backend
// G62). The proxy routes forward its sentence with a code, and the browser's stream reader keeps the
// code, so the page shows the refusal instead of a failure.

jest.mock("@/auth", () => ({ auth: jest.fn() }));

import {
  RunStreamError,
  streamFromSSE,
} from "@/lib/generate-content/stream-utils";
import { TOO_MANY_RUNS } from "@/lib/generate-content/run-events";
import {
  getGenerationClient,
  RunRefusedError,
  refusalMessage,
  streamErrorPayload,
} from "@/lib/generate-content/thread-access";

jest.mock("@/lib/auth-utils", () => ({
  authenticatedFetch: jest.fn(),
}));

const SENTENCE =
  "You already have 2 articles generating. Wait for one to finish, then start another.";

describe("the backend's refusal", () => {
  it("reads the sentence from the 429's body, or falls back", async () => {
    expect(await refusalMessage(JSON.stringify({ detail: SENTENCE }))).toBe(
      SENTENCE,
    );
    expect(await refusalMessage("<html>Too Many Requests</html>")).toMatch(
      /Wait for one to finish/,
    );
    expect(await refusalMessage(undefined)).toMatch(/Wait for one to finish/);
  });

  it("is sent with its code; any other error with its message only", () => {
    expect(streamErrorPayload(new RunRefusedError(SENTENCE))).toEqual({
      error: SENTENCE,
      code: TOO_MANY_RUNS,
    });
    expect(streamErrorPayload(new Error("HTTP 500: boom"))).toEqual({
      error: "HTTP 500: boom",
    });
  });

  it("reaches the page with its code", async () => {
    const { authenticatedFetch } = jest.requireMock("@/lib/auth-utils");
    const body = `data: ${JSON.stringify({ error: SENTENCE, code: TOO_MANY_RUNS })}\n\n`;
    // The route's reply as the reader sees it: one SSE event, then the end.
    const chunks = [new TextEncoder().encode(body)];
    authenticatedFetch.mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: async () =>
            chunks.length
              ? { done: false, value: chunks.shift() }
              : { done: true, value: undefined },
          cancel: jest.fn(),
        }),
      },
    });

    const stream = streamFromSSE("/api/generate/t1/stream", {});
    const error = await stream.next().then(
      () => null,
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(RunStreamError);
    expect((error as RunStreamError).code).toBe(TOO_MANY_RUNS);
    expect((error as RunStreamError).message).toBe(SENTENCE);
  });

  it("stops the client's retries at a 429, with the backend's sentence", async () => {
    // The SDK retries a failed call up to five times, and reads a failed response's body before
    // its failed-response hook runs: the client keeps a 429's body from its fetch, and the hook
    // throws, which ends the retries. Reached through the SDK's caller, as the hook sees it.
    const refusal = {
      status: 429,
      ok: false,
      clone: () => ({ text: async () => JSON.stringify({ detail: SENTENCE }) }),
    };
    const failure = {
      status: 503,
      ok: false,
      clone: () => ({ text: async () => "" }),
    };
    const realFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(refusal)
      .mockResolvedValueOnce(failure);
    try {
      const caller = (
        getGenerationClient("token").runs as unknown as {
          asyncCaller: {
            customFetch: (url: string) => Promise<unknown>;
            onFailedResponseHook: (response: unknown) => Promise<boolean>;
          };
        }
      ).asyncCaller;
      await caller.customFetch("http://backend/threads/t1/runs/stream");
      await caller.customFetch("http://backend/threads/t1/runs/stream");

      await expect(caller.onFailedResponseHook(refusal)).rejects.toEqual(
        new RunRefusedError(SENTENCE),
      );
      // Anything else is left to the SDK's usual retries.
      await expect(caller.onFailedResponseHook(failure)).resolves.toBe(false);
    } finally {
      global.fetch = realFetch;
    }
  });
});
