const threadsGet = jest.fn();
const authMock = jest.fn();

jest.mock("@langchain/langgraph-sdk", () => ({
  Client: jest.fn().mockImplementation(() => ({
    threads: { get: (...args: unknown[]) => threadsGet(...args) },
  })),
}));
jest.mock("@/auth", () => ({ auth: () => authMock() }));
jest.mock("@/lib/api-base-url", () => ({
  resolveApiBaseUrl: () => "http://localhost:2024",
}));

import { requireThreadOwner } from "@/lib/generate-content/thread-access";

const httpError = (status: number) =>
  Object.assign(new Error(`HTTP ${status}`), { status });

describe("requireThreadOwner", () => {
  beforeEach(() => {
    authMock.mockReset().mockResolvedValue({ user: { id: "user-1" } });
    threadsGet
      .mockReset()
      .mockResolvedValue({ thread_id: "t1", metadata: { owner: "user-1" } });
  });

  it("admits the owner", async () => {
    const access = await requireThreadOwner("t1");

    expect(access).toMatchObject({ ok: true, userId: "user-1" });
  });

  it("rejects an anonymous caller without hitting LangGraph", async () => {
    authMock.mockResolvedValue(null);

    const access = await requireThreadOwner("t1");

    expect(access.ok).toBe(false);
    expect(!access.ok && access.response.status).toBe(401);
    expect(threadsGet).not.toHaveBeenCalled();
  });

  it("rejects another tenant's thread", async () => {
    threadsGet.mockResolvedValue({
      thread_id: "t1",
      metadata: { owner: "user-2" },
    });

    const access = await requireThreadOwner("t1");

    expect(!access.ok && access.response.status).toBe(403);
  });

  // Threads created before ownership was stamped cannot be told apart from
  // another tenant's, so they are refused rather than grandfathered.
  it("rejects a thread with no owner recorded", async () => {
    threadsGet.mockResolvedValue({ thread_id: "t1", metadata: {} });

    const access = await requireThreadOwner("t1");

    expect(!access.ok && access.response.status).toBe(403);
  });

  it("reports a deleted thread as ownerless-but-allowed", async () => {
    threadsGet.mockRejectedValue(httpError(404));

    const access = await requireThreadOwner("t1");

    expect(access).toMatchObject({ ok: true, thread: null });
  });

  // A LangGraph outage must close the gate, not open it.
  it("denies when ownership cannot be read", async () => {
    threadsGet.mockRejectedValue(httpError(500));

    const access = await requireThreadOwner("t1");

    expect(!access.ok && access.response.status).toBe(502);
  });
});
