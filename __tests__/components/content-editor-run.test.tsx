import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { ContentEditor } from "@/components/generate-content/content";

// marked ships as an ES module jest can't load; the editor's preview needs none of it here.
jest.mock("marked", () => ({
  marked: { parse: (text: string) => text, use: jest.fn() },
}));

// The editor's menus read the workspace; a plain one does here.
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

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/w/nextly/generate-content",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ workspaceSlug: "nextly" }),
}));

const editor = (props: Partial<React.ComponentProps<typeof ContentEditor>>) => (
  <QueryClientProvider client={new QueryClient()}>
    <ContentEditor
      allContent={null}
      readabilityScore={null}
      trustScore={null}
      seoScore={null}
      generatedContent=""
      isEditing={false}
      userKeyword="headless cms"
      outline={null}
      onEditToggle={jest.fn()}
      onContentChange={jest.fn()}
      {...props}
    />
  </QueryClientProvider>
);

describe("ContentEditor while the article is written", () => {
  it("shows the run's stages in its side panel", () => {
    render(editor({ runProgress: <p>The run's stages</p>, isEnhancing: true }));
    expect(screen.getAllByText("The run's stages").length).toBeGreaterThan(0);
  });

  it("shows no Pipeline box with the old names", () => {
    render(editor({ isEnhancing: true }));
    expect(screen.queryByText("Pipeline")).toBeNull();
    expect(
      screen.queryByText(/Humanizing|Generating Content|Reviewing Content/),
    ).toBeNull();
  });
});

describe("ContentEditor's toolbar", () => {
  it("names each of the article's actions (D23)", () => {
    render(editor({}));
    for (const name of ["Edit", "Save", "Copy", "Publish"]) {
      expect(screen.getAllByRole("button", { name }).length).toBeGreaterThan(0);
    }
  });
});
