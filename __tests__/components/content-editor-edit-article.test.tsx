/**
 * "Edit article" on the article page (task 706): it opens the full-screen editor. An article
 * written just now is saved first, since the editor works on the saved one.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContentEditor } from "@/components/generate-content/content";

jest.mock("marked", () => ({
  marked: { parse: (text: string) => text, use: jest.fn() },
}));

jest.mock("@/providers/workspace-provider", () => {
  const workspace = {
    workspace: { id: "w1", slug: "nextly", name: "Nextly" },
    workspaceSlug: "nextly",
    workspaceId: "w1",
    isLoading: false,
  };
  return {
    useWorkspace: () => workspace,
    useWorkspaceOptional: () => workspace,
    WorkspaceProvider: ({ children }: { children: React.ReactNode }) =>
      children,
  };
});

jest.mock("@/stores/workspace/use-workspace-context-store", () => ({
  ...jest.requireActual("@/stores/workspace/use-workspace-context-store"),
  useCurrentWorkspaceId: () => "w1",
  useCurrentWorkspaceSlug: () => "nextly",
}));

const mockPermission = jest.fn();
jest.mock("@/hooks/use-permission", () => ({
  ...jest.requireActual("@/hooks/use-permission"),
  useWorkspacePermission: (permission: string) => mockPermission(permission),
}));

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/w/nextly/generate-content",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ workspaceSlug: "nextly" }),
}));

jest.mock("@/lib/api-client", () => ({
  ApiError: jest.requireActual("@/lib/api-client/core").ApiError,
  apiClient: {
    profile: { get: jest.fn().mockResolvedValue({}) },
    integrations: { list: jest.fn().mockResolvedValue([]) },
    content: { save: jest.fn(), update: jest.fn() },
  },
}));

const api = jest.requireMock("@/lib/api-client").apiClient as {
  content: { save: jest.Mock; update: jest.Mock };
};

const editor = (props: Partial<React.ComponentProps<typeof ContentEditor>>) => (
  <QueryClientProvider client={new QueryClient()}>
    <ContentEditor
      allContent={{ title: "How to start a podcast" } as never}
      readabilityScore={{ flesch_reading_ease: 60 } as never}
      trustScore={{ score: 70 } as never}
      seoScore={{ seo_health_score: 90, issues: [] } as never}
      generatedContent="Body"
      userKeyword="start a podcast"
      outline={null}
      {...props}
    />
  </QueryClientProvider>
);

const editArticle = () =>
  screen.getAllByRole("button", { name: "Edit article" })[0];

beforeEach(() => {
  jest.clearAllMocks();
  mockPermission.mockReturnValue({ hasPermission: true, isLoading: false });
});

describe("Edit article", () => {
  it("opens the full-screen editor on a saved article, saving nothing", async () => {
    render(editor({ contentId: "c1" }));
    await userEvent.click(editArticle());

    expect(mockPush).toHaveBeenCalledWith("/edit/nextly/c1");
    expect(api.content.save).not.toHaveBeenCalled();
    expect(api.content.update).not.toHaveBeenCalled();
  });

  it("saves an article written just now as its run's own, then opens the editor on it", async () => {
    api.content.save.mockResolvedValue({ id: "c9" });
    render(editor({ threadId: "t1" }));
    await userEvent.click(editArticle());

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/edit/nextly/c9"),
    );
    expect(api.content.save).toHaveBeenCalledTimes(1);
    expect(api.content.save).toHaveBeenCalledWith(
      "w1",
      expect.objectContaining({
        title: "How to start a podcast",
        body_markdown: "Body",
        langgraph_thread_id: "t1",
      }),
    );
  });

  it("says so and stays when that save fails", async () => {
    api.content.save.mockRejectedValue(new Error("offline"));
    render(editor({ threadId: "t1" }));
    await userEvent.click(editArticle());

    expect(
      await screen.findByText("The editor couldn't be opened"),
    ).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
    // Behind the message, the button is ready for another try.
    await waitFor(() =>
      expect(
        screen.getAllByRole("button", {
          name: "Edit article",
          hidden: true,
        })[0],
      ).toBeEnabled(),
    );
  });

  it("waits for the article to be finished", () => {
    render(editor({ contentId: "c1", seoScore: null }));
    expect(editArticle()).toBeDisabled();
  });

  it("is locked without the permission to update content", () => {
    mockPermission.mockReturnValue({ hasPermission: false, isLoading: false });
    render(editor({ contentId: "c1" }));
    expect(editArticle()).toBeDisabled();
  });
});
