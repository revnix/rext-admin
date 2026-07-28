import {
  type BackgroundGenerationJob,
  useBackgroundGenerationStore,
} from "@/stores/background-generation-store";

const createJob = (
  overrides: Partial<BackgroundGenerationJob> = {},
): BackgroundGenerationJob => ({
  threadId: "thread-1",
  workspaceId: "workspace-1",
  workspaceSlug: "demo-workspace",
  title: "A useful article",
  keyword: "content operations",
  status: "queued",
  stage: "Queued for generation",
  progress: 8,
  createdAt: "2026-07-27T10:00:00.000Z",
  updatedAt: "2026-07-27T10:00:00.000Z",
  resultUrl: "/w/demo-workspace/generate_content?thread=thread-1",
  completionNotified: false,
  ...overrides,
});

describe("background generation store", () => {
  beforeEach(() => {
    localStorage.clear();
    useBackgroundGenerationStore.setState({
      jobs: [],
      hasHydrated: true,
    });
  });

  it("upserts one job per generation thread", () => {
    const store = useBackgroundGenerationStore.getState();
    store.upsertJob(createJob());
    store.upsertJob(
      createJob({
        status: "running",
        stage: "Drafting your article",
        progress: 28,
      }),
    );

    const jobs = useBackgroundGenerationStore.getState().jobs;
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      threadId: "thread-1",
      status: "running",
      progress: 28,
    });
  });

  it("keeps completed jobs available for the notification and restore actions", () => {
    const store = useBackgroundGenerationStore.getState();
    store.upsertJob(createJob());
    store.updateJob("thread-1", {
      runId: "run-1",
      status: "completed",
      stage: "Article ready",
      progress: 100,
    });

    expect(useBackgroundGenerationStore.getState().jobs[0]).toMatchObject({
      runId: "run-1",
      status: "completed",
      stage: "Article ready",
      progress: 100,
      completionNotified: false,
    });
  });

  it("merges jobs received from another browser tab", () => {
    const store = useBackgroundGenerationStore.getState();
    store.upsertJob(createJob());
    store.mergeJobs([
      createJob({
        threadId: "thread-2",
        title: "Generated in another tab",
        resultUrl: "/w/demo-workspace/generate_content?thread=thread-2",
      }),
    ]);

    expect(useBackgroundGenerationStore.getState().jobs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          threadId: "thread-1",
          title: "A useful article",
        }),
        expect.objectContaining({
          threadId: "thread-2",
          title: "Generated in another tab",
        }),
      ]),
    );
    expect(useBackgroundGenerationStore.getState().jobs).toHaveLength(2);
  });

  it("keeps the newest cross-tab update for the same thread", () => {
    const store = useBackgroundGenerationStore.getState();
    store.upsertJob(
      createJob({
        status: "running",
        progress: 58,
        updatedAt: "2026-07-27T10:05:00.000Z",
      }),
    );
    store.mergeJobs([
      createJob({
        progress: 8,
        updatedAt: "2026-07-27T10:01:00.000Z",
      }),
    ]);

    expect(useBackgroundGenerationStore.getState().jobs[0]).toMatchObject({
      status: "running",
      progress: 58,
    });
  });
});
