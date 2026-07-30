const runsList = jest.fn();
const runsCancel = jest.fn();
const runsGet = jest.fn();
const threadsDelete = jest.fn();

jest.mock("@langchain/langgraph-sdk", () => ({
  Client: jest.fn().mockImplementation(() => ({
    runs: {
      list: (...args: unknown[]) => runsList(...args),
      cancel: (...args: unknown[]) => runsCancel(...args),
      get: (...args: unknown[]) => runsGet(...args),
    },
    threads: { delete: (...args: unknown[]) => threadsDelete(...args) },
  })),
}));
jest.mock("@/auth", () => ({
  auth: jest.fn().mockResolvedValue({ user: {} }),
}));
jest.mock("@/lib/api-base-url", () => ({
  resolveApiBaseUrl: () => "http://localhost:2024",
}));

import { POST } from "@/app/api/generate/[threadId]/cancel/route";

const cancel = (body: unknown) =>
  POST({ json: async () => body } as never, {
    params: Promise.resolve({ threadId: "thread-1" }),
  });

describe("cancelling a generation", () => {
  beforeEach(() => {
    runsList.mockReset().mockResolvedValue([]);
    runsCancel.mockReset().mockResolvedValue(undefined);
    runsGet.mockReset();
    threadsDelete.mockReset().mockResolvedValue(undefined);
  });

  // The run only exists once the stream POST reaches LangGraph, so cancelling
  // in the first seconds finds nothing to interrupt — it must still stop.
  it("drops the thread when no run exists yet", async () => {
    const response = await cancel({});

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ cancelled: true });
    expect(threadsDelete).toHaveBeenCalledWith("thread-1");
  });

  it("treats a stale run id as already stopped", async () => {
    runsCancel.mockRejectedValue(new Error("HTTP 404"));
    runsGet.mockResolvedValue({ status: "success" });

    const response = await cancel({ runId: "run-1" });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ cancelled: true });
  });

  it("reports failure when the run is still going", async () => {
    runsCancel.mockRejectedValue(new Error("connection reset"));
    runsGet.mockResolvedValue({ status: "running" });

    const response = await cancel({ runId: "run-1" });

    expect(response.status).toBe(500);
  });

  it("cancels the newest run when the caller has no run id", async () => {
    runsList.mockResolvedValue([
      { run_id: "old", created_at: "2026-07-30T10:00:00Z" },
      { run_id: "new", created_at: "2026-07-30T10:05:00Z" },
    ]);

    await cancel({});

    expect(runsCancel).toHaveBeenCalledWith(
      "thread-1",
      "new",
      false,
      "interrupt",
    );
    expect(threadsDelete).not.toHaveBeenCalled();
  });
});
