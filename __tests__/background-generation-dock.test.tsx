import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { BackgroundGenerationDock } from "@/components/background-generation-dock";
import {
  BACKGROUND_GENERATION_RESTORE_EVENT,
  BACKGROUND_GENERATION_REMOVAL_STORAGE_KEY,
  type BackgroundGenerationRestoreDetail,
} from "@/lib/generate-content/background-generation-sync";
import { BACKGROUND_GENERATION_STORAGE_KEY } from "@/stores/background-generation-store";
import { useBackgroundGenerationStore } from "@/stores/background-generation-store";

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

describe("background generation dock", () => {
  beforeEach(() => {
    const now = new Date().toISOString();
    useBackgroundGenerationStore.setState({
      hasHydrated: false,
      jobs: [
        {
          threadId: "thread-1",
          workspaceId: "workspace-1",
          workspaceSlug: "demo-workspace",
          title: "A useful article",
          keyword: "content operations",
          status: "running",
          stage: "Drafting your article",
          progress: 42,
          createdAt: now,
          updatedAt: now,
          resultUrl: "/w/demo-workspace/generate_content?thread=thread-1",
          completionNotified: false,
        },
      ],
    });
  });

  it("shows a new in-memory job without waiting for persistence hydration", async () => {
    render(<BackgroundGenerationDock />);

    expect(
      await screen.findByRole("region", {
        name: "Background generation activity",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("A useful article")).toBeInTheDocument();
    expect(screen.getByText("42%")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /view progress/i }),
    ).toBeInTheDocument();
  });

  it("applies a completion from another tab and makes the article actionable", async () => {
    const restoreRequests: BackgroundGenerationRestoreDetail[] = [];
    const handleRestore = (event: Event) => {
      restoreRequests.push(
        (event as CustomEvent<BackgroundGenerationRestoreDetail>).detail,
      );
    };
    window.addEventListener(BACKGROUND_GENERATION_RESTORE_EVENT, handleRestore);
    render(<BackgroundGenerationDock />);

    const completedJob = {
      ...useBackgroundGenerationStore.getState().jobs[0],
      status: "completed" as const,
      stage: "Article ready",
      progress: 100,
      updatedAt: new Date(Date.now() + 1_000).toISOString(),
    };
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: BACKGROUND_GENERATION_STORAGE_KEY,
          newValue: JSON.stringify({
            state: { jobs: [completedJob] },
            version: 0,
          }),
        }),
      );
    });

    const openArticle = await screen.findByRole("button", {
      name: /open article/i,
    });
    expect(screen.getByText("Article ready")).toBeInTheDocument();
    expect(restoreRequests).toContainEqual({ threadId: "thread-1" });
    expect(useBackgroundGenerationStore.getState().jobs[0].updatedAt).toBe(
      completedJob.updatedAt,
    );

    fireEvent.click(openArticle);
    expect(restoreRequests).toHaveLength(2);
    expect(useBackgroundGenerationStore.getState().jobs).toHaveLength(0);
    expect(
      screen.queryByRole("region", {
        name: "Background generation activity",
      }),
    ).not.toBeInTheDocument();

    window.removeEventListener(
      BACKGROUND_GENERATION_RESTORE_EVENT,
      handleRestore,
    );
  });

  it("ignores a stale completed run after another tab resumes the workflow", async () => {
    const resumedAt = new Date(Date.now() + 5_000).toISOString();
    useBackgroundGenerationStore.setState({
      jobs: [
        {
          ...useBackgroundGenerationStore.getState().jobs[0],
          runId: undefined,
          status: "running",
          stage: "Content Outline Generation",
          updatedAt: resumedAt,
        },
      ],
    });
    const handleRestore = jest.fn();
    window.addEventListener(BACKGROUND_GENERATION_RESTORE_EVENT, handleRestore);
    render(<BackgroundGenerationDock />);

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: BACKGROUND_GENERATION_STORAGE_KEY,
          newValue: JSON.stringify({
            state: {
              jobs: [
                {
                  ...useBackgroundGenerationStore.getState().jobs[0],
                  runId: "old-run",
                  status: "completed",
                  stage: "Topics ready to review",
                  progress: 32,
                  updatedAt: new Date(Date.now() - 5_000).toISOString(),
                },
              ],
            },
            version: 0,
          }),
        }),
      );
    });

    expect(
      await screen.findByRole("button", { name: /view progress/i }),
    ).toBeInTheDocument();
    expect(useBackgroundGenerationStore.getState().jobs[0]).toMatchObject({
      runId: undefined,
      status: "running",
      stage: "Content Outline Generation",
      updatedAt: resumedAt,
    });
    expect(handleRestore).not.toHaveBeenCalled();

    window.removeEventListener(
      BACKGROUND_GENERATION_RESTORE_EVENT,
      handleRestore,
    );
  });

  it("closes a dismissed progress bar in another tab", () => {
    render(<BackgroundGenerationDock />);

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: BACKGROUND_GENERATION_REMOVAL_STORAGE_KEY,
          newValue: JSON.stringify({
            threadIds: ["thread-1"],
            removedAt: new Date().toISOString(),
          }),
        }),
      );
    });

    expect(
      screen.queryByRole("region", {
        name: "Background generation activity",
      }),
    ).not.toBeInTheDocument();
    expect(useBackgroundGenerationStore.getState().jobs).toHaveLength(0);
  });

  it("returns to the blank generation page after cancelling", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    render(<BackgroundGenerationDock />);

    fireEvent.click(
      await screen.findByRole("button", {
        name: /cancel a useful article/i,
      }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Cancel generation" }),
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        "/w/demo-workspace/generate_content",
      );
    });
    expect(useBackgroundGenerationStore.getState().jobs).toHaveLength(0);
  });
});
