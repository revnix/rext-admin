import { act, fireEvent, render, screen } from "@testing-library/react";

import { BackgroundGenerationDock } from "@/components/background-generation-dock";
import {
  BACKGROUND_GENERATION_RESTORE_EVENT,
  type BackgroundGenerationRestoreDetail,
} from "@/lib/generate-content/background-generation-sync";
import { BACKGROUND_GENERATION_STORAGE_KEY } from "@/stores/background-generation-store";
import { useBackgroundGenerationStore } from "@/stores/background-generation-store";

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

    fireEvent.click(openArticle);
    expect(restoreRequests).toHaveLength(2);

    window.removeEventListener(
      BACKGROUND_GENERATION_RESTORE_EVENT,
      handleRestore,
    );
  });
});
