import { render, screen } from "@testing-library/react";

import { BackgroundGenerationDock } from "@/components/background-generation-dock";
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
});
