/**
 * @jest-environment node
 */

// Cancelling a generation (rext-control task 826): the thread is deleted only when the listing of its
// runs answered and was empty. A listing that failed (the backend restarting, an error) used to be
// read as "no run", which deleted the thread and every finished step of a run that was only waiting.

const runsList = jest.fn();
const runsCancel = jest.fn();
const runsGet = jest.fn();
const threadsDelete = jest.fn();
const requireThreadOwner = jest.fn();

jest.mock("@/lib/generate-content/thread-access", () => ({
  getGenerationClient: jest.fn(() => ({
    runs: { list: runsList, cancel: runsCancel, get: runsGet },
    threads: { delete: threadsDelete },
  })),
  requireThreadOwner: (...args: unknown[]) => requireThreadOwner(...args),
}));

import { POST as cancel } from "@/app/api/generate/[threadId]/cancel/route";
import {
  SERVER_UNREACHABLE,
  SERVER_UNREACHABLE_MESSAGE,
} from "@/lib/api-client/server-away";

const post = (body?: unknown) =>
  cancel(
    new Request("http://localhost/api/generate/t1/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    }) as never,
    { params: Promise.resolve({ threadId: "t1" }) },
  );

/** LangGraph's SDK puts the answer's status on its error. */
const sdkError = (status: number) =>
  Object.assign(new Error(`HTTP ${status}`), { status });

const run = (run_id: string, created_at: string, status = "running") => ({
  run_id,
  created_at,
  status,
});

beforeEach(() => {
  for (const mock of [runsList, runsCancel, runsGet, threadsDelete]) {
    mock.mockReset();
  }
  threadsDelete.mockResolvedValue(undefined);
  runsCancel.mockResolvedValue(undefined);
  requireThreadOwner.mockReset();
  requireThreadOwner.mockResolvedValue({
    ok: true,
    userId: "u1",
    accessToken: "token",
    thread: { thread_id: "t1", metadata: { owner: "u1" } },
  });
});

describe("cancelling a generation", () => {
  it("interrupts the thread's newest run and keeps the thread", async () => {
    runsList.mockResolvedValueOnce([
      run("older", "2026-10-08T04:00:00Z"),
      run("newest", "2026-10-08T04:20:00Z"),
    ]);

    const response = await post({});

    expect(await response.json()).toEqual({
      threadId: "t1",
      runId: "newest",
      cancelled: true,
    });
    expect(runsCancel).toHaveBeenCalledWith("t1", "newest", false, "interrupt");
    expect(threadsDelete).not.toHaveBeenCalled();
  });

  it("interrupts the run it is given without listing any", async () => {
    const response = await post({ runId: "tracked" });

    expect((await response.json()).runId).toBe("tracked");
    expect(runsList).not.toHaveBeenCalled();
    expect(runsCancel).toHaveBeenCalledWith(
      "t1",
      "tracked",
      false,
      "interrupt",
    );
    expect(threadsDelete).not.toHaveBeenCalled();
  });

  it("drops a thread whose listing answered with no run", async () => {
    runsList.mockResolvedValueOnce([]);

    const response = await post();

    expect(await response.json()).toEqual({
      threadId: "t1",
      runId: null,
      cancelled: true,
    });
    expect(response.status).toBe(200);
    expect(threadsDelete).toHaveBeenCalledWith("t1");
    expect(runsCancel).not.toHaveBeenCalled();
  });

  it.each([
    ["the backend is restarting", sdkError(503)],
    ["the proxy answers for it", sdkError(502)],
    ["the request never arrives", new TypeError("fetch failed")],
  ])("deletes nothing and says to try again when %s", async (_, error) => {
    runsList.mockRejectedValueOnce(error);

    const response = await post({});

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: SERVER_UNREACHABLE_MESSAGE,
      code: SERVER_UNREACHABLE,
    });
    expect(threadsDelete).not.toHaveBeenCalled();
    expect(runsCancel).not.toHaveBeenCalled();
  });

  it("deletes nothing when the listing fails any other way", async () => {
    runsList.mockRejectedValueOnce(sdkError(500));

    const response = await post({});

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: "We couldn't cancel this right now. Try again in a moment.",
    });
    expect(threadsDelete).not.toHaveBeenCalled();
    expect(runsCancel).not.toHaveBeenCalled();
  });

  it("counts a thread that is already gone as cancelled, asking nothing more", async () => {
    requireThreadOwner.mockResolvedValueOnce({
      ok: true,
      userId: "u1",
      accessToken: "token",
      thread: null,
    });

    const response = await post({});

    expect(await response.json()).toEqual({
      threadId: "t1",
      runId: null,
      cancelled: true,
    });
    expect(runsList).not.toHaveBeenCalled();
    expect(threadsDelete).not.toHaveBeenCalled();
  });

  it("answers the gate's refusal as it is", async () => {
    requireThreadOwner.mockResolvedValueOnce({
      ok: false,
      response: Response.json({ error: "Forbidden" }, { status: 403 }),
    });

    const response = await post({});

    expect(response.status).toBe(403);
    expect(runsList).not.toHaveBeenCalled();
    expect(threadsDelete).not.toHaveBeenCalled();
  });

  it("treats a run that already ended as cancelled", async () => {
    runsCancel.mockRejectedValueOnce(sdkError(409));
    runsGet.mockResolvedValueOnce(
      run("tracked", "2026-10-08T04:20:00Z", "success"),
    );

    const response = await post({ runId: "tracked" });

    expect(response.status).toBe(200);
    expect((await response.json()).cancelled).toBe(true);
  });
});
