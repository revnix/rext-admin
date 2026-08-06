import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

import GenerateContentPage from "@/app/w/[workspaceSlug]/generate_content/page";
import { useBackgroundGenerationStore } from "@/stores/background-generation-store";

const mockReplace = jest.fn();
const mockPush = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParams,
}));

jest.mock("@/providers/workspace-provider", () => ({
  useWorkspace: () => ({
    workspace: {
      id: "workspace-1",
      name: "Demo Workspace",
      slug: "demo-workspace",
    },
    workspaceId: "workspace-1",
  }),
}));

jest.mock("@/hooks/use-permission", () => ({
  useWorkspacePermission: () => ({
    hasPermission: true,
    isLoading: false,
  }),
}));

jest.mock("@/components/page-layout", () => ({
  PageLayout: ({ children }: { children: ReactNode }) => children,
}));

jest.mock("@/components/permission/permission-guard", () => ({
  PermissionGuard: ({ children }: { children: ReactNode }) => children,
}));

jest.mock("@/components/generate-content/selection-view", () => ({
  SelectionView: () => <div>New content generation</div>,
}));

jest.mock("@/components/generate-content/fresh-generation-view", () => ({
  FreshGenerationView: ({ onBack }: { onBack: () => void }) => (
    <div>
      Existing content generation
      <button type="button" onClick={onBack}>
        Start a new article
      </button>
    </div>
  ),
}));

describe("content generation entry", () => {
  beforeEach(() => {
    localStorage.clear();
    mockSearchParams = new URLSearchParams();
    useBackgroundGenerationStore.setState({
      hasHydrated: true,
      jobs: [],
    });
  });

  it("returns to the active generation instead of showing a new workflow", async () => {
    useBackgroundGenerationStore.setState({
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
          createdAt: "2026-07-29T07:00:00.000Z",
          updatedAt: "2026-07-29T07:01:00.000Z",
          resultUrl: "/w/demo-workspace/generate_content?thread=thread-1",
        },
      ],
    });

    render(<GenerateContentPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        "/w/demo-workspace/generate_content?thread=thread-1",
      );
    });
    expect(
      screen.queryByText("New content generation"),
    ).not.toBeInTheDocument();
  });

  it("shows the new workflow entry when there is no active generation", () => {
    render(<GenerateContentPage />);

    expect(screen.getByText("New content generation")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("recovers from an empty persisted store instead of loading forever", async () => {
    useBackgroundGenerationStore.setState({ hasHydrated: false });
    localStorage.clear();

    render(<GenerateContentPage />);

    expect(
      await screen.findByText("New content generation"),
    ).toBeInTheDocument();
  });

  it("leaves a failed thread and returns to the new article selection", () => {
    mockSearchParams = new URLSearchParams("thread=failed-thread");
    const now = "2026-07-29T08:00:00.000Z";
    useBackgroundGenerationStore.setState({
      jobs: [
        {
          threadId: "failed-thread",
          workspaceSlug: "demo-workspace",
          title: "Failed article",
          keyword: "old keyword",
          status: "failed",
          stage: "Generation failed",
          progress: 100,
          createdAt: now,
          updatedAt: now,
          resultUrl: "/w/demo-workspace/generate_content?thread=failed-thread",
        },
        {
          threadId: "previous-keyword-thread",
          workspaceSlug: "demo-workspace",
          title: "Previous keyword",
          keyword: "previous keyword",
          status: "completed",
          stage: "Topics ready to review",
          progress: 32,
          createdAt: now,
          updatedAt: now,
          resultUrl:
            "/w/demo-workspace/generate_content?thread=previous-keyword-thread",
          awaitingInput: true,
        },
      ],
    });

    render(<GenerateContentPage />);
    fireEvent.click(
      screen.getByRole("button", { name: "Start a new article" }),
    );

    expect(mockReplace).toHaveBeenCalledWith(
      "/w/demo-workspace/generate_content",
    );
    expect(useBackgroundGenerationStore.getState().jobs).toEqual([]);
    expect(screen.getByText("New content generation")).toBeInTheDocument();
  });

  it("resets the mounted workflow when cancellation removes the thread URL", () => {
    mockSearchParams = new URLSearchParams("thread=cancelled-thread");
    const { rerender } = render(<GenerateContentPage />);
    expect(screen.getByText("Existing content generation")).toBeInTheDocument();

    mockSearchParams = new URLSearchParams();
    rerender(<GenerateContentPage />);

    expect(screen.getByText("New content generation")).toBeInTheDocument();
  });
});
