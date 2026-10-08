/**
 * @jest-environment node
 */

// A run that is no longer there (rext-control task 824). The runtime answers "not found" to an id
// that isn't a thread and to anyone but the thread's owner, in its own text ("HTTP 404:
// {"detail":"thread … not found"}"), and the page once showed that text. The routes answer with a
// code and a sentence of the app's own, and never pass a remote error's text on.

const runsList = jest.fn();
const runsGet = jest.fn();
const getState = jest.fn();
const requireThreadOwner = jest.fn();

jest.mock("@/lib/generate-content/thread-access", () => ({
  getGenerationClient: jest.fn(() => ({
    runs: { list: runsList, get: runsGet },
    threads: { getState },
  })),
  requireThreadOwner: (...args: unknown[]) => requireThreadOwner(...args),
}));

import { GET as status } from "@/app/api/generate/[threadId]/status/route";
import { SERVER_UNREACHABLE } from "@/lib/api-client/server-away";
import {
  ownWords,
  RUN_NOT_FOUND,
  RUN_NOT_FOUND_MESSAGE,
} from "@/lib/generate-content/run-gone";

const THREAD = "01a119bf-0000-4000-8000-000000000000";
const get = () =>
  status(
    Object.assign(
      new Request(`http://localhost/api/generate/${THREAD}/status`),
      {
        nextUrl: new URL(
          `http://localhost/api/generate/${THREAD}/status?includeState=true`,
        ),
      },
    ) as never,
    { params: Promise.resolve({ threadId: THREAD }) },
  );

/** LangGraph's SDK: the status on the error, and the remote body in its message. */
const sdkError = (code: number, body: string) =>
  Object.assign(new Error(`HTTP ${code}: ${body}`), { status: code });
const NOT_FOUND = sdkError(404, `{"detail":"thread ${THREAD} not found"}`);

const owned = {
  ok: true,
  userId: "u1",
  accessToken: "token",
  thread: { thread_id: THREAD, metadata: { owner: "u1" } },
};

beforeEach(() => {
  for (const mock of [runsList, runsGet, getState, requireThreadOwner]) {
    mock.mockReset();
  }
  requireThreadOwner.mockResolvedValue(owned);
  getState.mockResolvedValue({ values: {}, tasks: [] });
});

/** Nothing of the runtime's answer: no status code in words, no JSON, no id. */
const expectPlain = (text: string) => {
  expect(text).not.toMatch(/HTTP \d/);
  expect(text).not.toContain("detail");
  expect(text).not.toContain(THREAD);
  expect(text).not.toContain("{");
};

describe("the status of a run that isn't there", () => {
  it("says so with a code of its own, without asking the runtime again", async () => {
    // The gate found no such thread.
    requireThreadOwner.mockResolvedValueOnce({ ...owned, thread: null });

    const response = await get();

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toEqual({
      error: RUN_NOT_FOUND_MESSAGE,
      code: RUN_NOT_FOUND,
    });
    expect(body.error).toBe(
      "This article's run is no longer here. Start a new one.",
    );
    expectPlain(JSON.stringify(body.error));
    expect(runsList).not.toHaveBeenCalled();
  });

  it("says the same when the run goes between the gate and the read", async () => {
    runsList.mockRejectedValueOnce(NOT_FOUND);

    const response = await get();

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.code).toBe(RUN_NOT_FOUND);
    expectPlain(body.error);
  });
});

describe("a status the runtime couldn't give", () => {
  it("answers a sentence of the app's own, never the runtime's text", async () => {
    runsList.mockRejectedValueOnce(
      sdkError(500, '{"detail":"relation \\"run\\" does not exist"}'),
    );

    const response = await get();

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe(
      "This article's status couldn't be read. Try again in a moment.",
    );
    expectPlain(body.error);
    expect(body.error).not.toContain("relation");
  });

  it("still says the backend is away when it is", async () => {
    runsList.mockRejectedValueOnce(sdkError(503, "upstream"));

    const response = await get();

    expect(response.status).toBe(503);
    expect((await response.json()).code).toBe(SERVER_UNREACHABLE);
  });
});

describe("ownWords", () => {
  it("keeps a sentence of the app's own", () => {
    expect(
      ownWords(new Error("Your role can't create content here."), "Fallback."),
    ).toBe("Your role can't create content here.");
  });

  it("replaces the SDK's status-and-body text, and anything that isn't an error", () => {
    expect(ownWords(NOT_FOUND, "Fallback.")).toBe("Fallback.");
    expect(ownWords(new Error("HTTP 500"), "Fallback.")).toBe("Fallback.");
    expect(ownWords(new Error("  "), "Fallback.")).toBe("Fallback.");
    expect(ownWords("a string", "Fallback.")).toBe("Fallback.");
  });
});
