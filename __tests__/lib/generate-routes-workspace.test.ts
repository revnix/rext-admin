/**
 * @jest-environment node
 */

// The generation routes name the workspace to the backend, which checks the
// caller's content.create role there (rext-backend E17): the thread is stamped
// with it, and every run on the thread repeats it.

const threadsCreate = jest.fn();
const runsCreate = jest.fn();
const runsStream = jest.fn();

jest.mock("@/lib/generate-content/thread-access", () => ({
  getGenerationClient: jest.fn(() => ({
    threads: { create: threadsCreate },
    runs: { create: runsCreate, stream: runsStream },
  })),
  isExpiredTokenError: jest.fn(() => false),
  requireGenerationIdentity: jest.fn(async () => ({
    ok: true,
    userId: "u1",
    accessToken: "token",
  })),
  requireThreadOwner: jest.fn(async () => ({
    ok: true,
    userId: "u1",
    accessToken: "token",
    thread: { thread_id: "t1", metadata: { owner: "u1", workspace_id: "w1" } },
  })),
  tokenExpired: jest.fn(),
}));
jest.mock("@/lib/generate-content/run-webhook", () => ({
  runWebhookOption: {},
}));

import { POST as resume } from "@/app/api/generate/[threadId]/resume/route";
import { POST as stream } from "@/app/api/generate/[threadId]/stream/route";
import { POST as createThread } from "@/app/api/generate/threads/route";

const json = (body: unknown) =>
  new Request("http://localhost/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("starting a generation names its workspace", () => {
  beforeEach(() => {
    threadsCreate.mockReset();
    runsCreate.mockReset();
    runsStream.mockReset();
  });

  it("stamps the new thread with its owner and workspace", async () => {
    threadsCreate.mockResolvedValueOnce({ thread_id: "t1" });

    const res = await createThread(json({ workspace_id: "w1" }));

    expect(res.status).toBe(200);
    expect(threadsCreate).toHaveBeenCalledWith({
      metadata: { owner: "u1", workspace_id: "w1" },
    });
  });

  it("asks for the workspace when none is named", async () => {
    const res = await createThread(json({}));

    expect(res.status).toBe(400);
    expect(threadsCreate).not.toHaveBeenCalled();
  });

  it("passes on the backend's refusal for a role without content.create", async () => {
    threadsCreate.mockRejectedValueOnce(
      Object.assign(new Error("Forbidden"), { status: 403 }),
    );

    const res = await createThread(json({ workspace_id: "w1" }));

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({
      error: "Your role in this workspace can't create content.",
      code: "CONTENT_CREATE_REQUIRED",
    });
  });

  it("resumes a run with the thread's own workspace", async () => {
    runsCreate.mockResolvedValueOnce({
      run_id: "r1",
      status: "pending",
      created_at: "now",
      updated_at: "now",
    });

    const res = await resume(
      json({ payload: { action: "approve" }, background: true }) as never,
      { params: Promise.resolve({ threadId: "t1" }) },
    );

    expect(res.status).toBe(202);
    expect(runsCreate).toHaveBeenCalledWith(
      "t1",
      "agent",
      expect.objectContaining({ metadata: { workspace_id: "w1" } }),
    );
  });

  it("runs a new analysis in the thread's workspace, whatever the body names", async () => {
    runsStream.mockReturnValueOnce((async function* () {})());

    // jest.setup.ts stubs Response with a JSON-only object, so the route's
    // streaming reply can't be built here; the run's options are what count.
    await stream(
      json({
        input: { serp_payload: { query: "q", workspace_id: "elsewhere" } },
      }) as never,
      { params: Promise.resolve({ threadId: "t1" }) },
    ).catch(() => undefined);

    expect(runsStream).toHaveBeenCalledWith(
      "t1",
      "agent",
      expect.objectContaining({
        input: { serp_payload: { query: "q", workspace_id: "w1" } },
        metadata: { workspace_id: "w1" },
      }),
    );
  });
});
