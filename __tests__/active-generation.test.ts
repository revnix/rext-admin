import {
  findActiveGenerationJob,
  isActiveGenerationJob,
} from "@/lib/generate-content/active-generation";
import type { BackgroundGenerationJob } from "@/stores/background-generation-store";

const createJob = (
  overrides: Partial<BackgroundGenerationJob> = {},
): BackgroundGenerationJob => ({
  threadId: "thread-1",
  workspaceSlug: "demo-workspace",
  title: "A useful article",
  keyword: "content operations",
  status: "running",
  stage: "Drafting your article",
  progress: 42,
  createdAt: "2026-07-29T07:00:00.000Z",
  updatedAt: "2026-07-29T07:00:00.000Z",
  resultUrl: "/w/demo-workspace/generate_content?thread=thread-1",
  ...overrides,
});

describe("active content generation", () => {
  it.each([
    "queued",
    "running",
  ] as const)("treats a %s job as active", (status) => {
    expect(isActiveGenerationJob(createJob({ status }))).toBe(true);
  });

  it("keeps a workflow active while it waits for user input", () => {
    expect(
      isActiveGenerationJob(
        createJob({
          status: "completed",
          awaitingInput: true,
          stage: "Outline ready to review",
        }),
      ),
    ).toBe(true);
  });

  it.each([
    "completed",
    "failed",
  ] as const)("does not block a new article for a finished %s job", (status) => {
    expect(
      isActiveGenerationJob(createJob({ status, awaitingInput: false })),
    ).toBe(false);
  });

  it("returns the newest active workflow across browser tabs", () => {
    const activeJob = findActiveGenerationJob([
      createJob({
        threadId: "older-thread",
        updatedAt: "2026-07-29T07:01:00.000Z",
      }),
      createJob({
        threadId: "finished-thread",
        status: "completed",
        updatedAt: "2026-07-29T07:03:00.000Z",
      }),
      createJob({
        threadId: "newer-thread",
        updatedAt: "2026-07-29T07:02:00.000Z",
        resultUrl: "/w/demo-workspace/generate_content?thread=newer-thread",
      }),
    ]);

    expect(activeJob).toMatchObject({
      threadId: "newer-thread",
      resultUrl: "/w/demo-workspace/generate_content?thread=newer-thread",
    });
  });
});
