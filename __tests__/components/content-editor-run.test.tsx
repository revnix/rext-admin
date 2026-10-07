import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
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
      userKeyword="headless cms"
      outline={null}
      {...props}
    />
  </QueryClientProvider>
);

describe("ContentEditor while the article is written", () => {
  it("shows the run's stages in its side panel", () => {
    render(editor({ runProgress: <p>The run's stages</p>, isEnhancing: true }));
    expect(screen.getAllByText("The run's stages").length).toBeGreaterThan(0);
  });

  it("keeps the flow's steps on the Article step, atop the article's column (FB2.12)", () => {
    render(editor({ steps: <nav aria-label="Article steps" /> }));
    // Once, and inside the article's column (each column scrolls on its own): right above the article.
    const steps = screen.getByRole("navigation", { name: "Article steps" });
    expect(steps.parentElement?.nextElementSibling?.tagName).toBe("ARTICLE");
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
    for (const name of ["Edit article", "Copy", "Publish"]) {
      expect(screen.getAllByRole("button", { name }).length).toBeGreaterThan(0);
    }
    // Editing is the full-screen editor's now (task 706): no Edit or Save in the page itself.
    for (const name of ["Edit", "Save", "Preview"]) {
      expect(screen.queryByRole("button", { name })).toBeNull();
    }
  });
});

describe("ContentEditor while the article is written, as the page shows it (task 703)", () => {
  const writingProps = {
    isEnhancing: true,
    enhancingMsg: "Draft",
    allContent: {
      title: "How to start a podcast",
      meta_description: "Pick a show you can keep up.",
    } as never,
    generatedContent:
      "Intro.\n\n## Pick a show idea\n\nText.\n\n## Choose a format\n\nA solo",
    outline: {
      sections: [
        { heading: "Pick a show idea" },
        { heading: "Choose one listener", heading_level: "H3" },
        { heading: "Choose a format" },
        { heading: "The gear you need" },
        { heading: "Microphones under $100", heading_level: "H3" },
      ],
    } as never,
  };

  it("shows the title and the intro whole, at once", () => {
    render(editor(writingProps));
    expect(
      screen.getByRole("heading", { level: 1, name: "How to start a podcast" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Pick a show you can keep up."),
    ).toBeInTheDocument();
  });

  it("says where the writing is, and keeps the actions for the end", () => {
    render(editor(writingProps));
    // In these words always: the stage's name alone ("Draft") read as the article's status.
    expect(
      screen.getByText("Writing the article").parentElement,
    ).toHaveTextContent("Writing the article · Draft · section 2 of 3");
    for (const name of ["Edit article", "Copy", "Publish"]) {
      expect(screen.queryByRole("button", { name })).toBeNull();
    }
  });

  it("lists the structure by level, with what is written, being written and to come", () => {
    render(editor(writingProps));
    const rows = within(
      screen.getByRole("navigation", { name: "Structure" }),
    ).getAllByRole("listitem");
    expect(rows.map((row) => row.textContent)).toEqual([
      "Written:H2Pick a show idea",
      "Being written:H2Choose a format",
      "Still to come:H2The gear you need",
      "Still to come:H3Microphones under $100",
    ]);
    expect(
      within(rows[2]).getByRole("button", { name: /The gear you need/ }),
    ).toBeDisabled();
  });

  it("shows the sections still to come in their place, and no overlay over the article", () => {
    render(editor(writingProps));
    const article = screen.getByRole("article");
    expect(within(article).getByText("The gear you need")).toBeInTheDocument();
    expect(within(article).getAllByText("Still to come")).toHaveLength(2);
    // What is being written is said in the bar only, not on a panel over the text.
    expect(screen.getAllByText("Writing the article")).toHaveLength(1);
    expect(within(article).queryByText("Writing the article")).toBeNull();
  });

  it("shows the title and the outline's sections before the first words arrive, not grey bars", () => {
    const { container } = render(
      editor({
        isEnhancing: true,
        enhancingMsg: "Research",
        generatedContent: "",
        // What streams in meanwhile is unfinished: the chosen title wins over it.
        allContent: { title: "Export and validate" } as never,
        // A blog's outline keeps its sections a level down.
        outline: {
          title: "How to start a podcast",
          structure: {
            sections: [
              { heading: "Pick a show idea", heading_level: "H2" },
              { heading: "Choose one listener", heading_level: "H3" },
            ],
          },
        } as never,
      }),
    );
    const article = screen.getByRole("article");
    expect(
      within(article).getByRole("heading", {
        level: 1,
        name: "How to start a podcast",
      }),
    ).toBeInTheDocument();
    expect(within(article).getAllByText("Still to come")).toHaveLength(2);
    expect(container.querySelector('[data-slot="skeleton"]')).toBeNull();
    expect(
      within(screen.getByRole("navigation", { name: "Structure" }))
        .getAllByRole("listitem")
        .map((row) => row.textContent),
    ).toEqual([
      "Still to come:H2Pick a show idea",
      "Still to come:H3Choose one listener",
    ]);
  });

  it("shows the actions once the article is done, and no states in the structure", () => {
    render(
      editor({
        ...writingProps,
        isEnhancing: false,
        readabilityScore: { flesch_reading_ease: 60 } as never,
        trustScore: { score: 70 } as never,
        seoScore: { seo_health_score: 90, issues: [] } as never,
      }),
    );
    for (const name of ["Edit article", "Copy", "Publish"]) {
      expect(screen.getAllByRole("button", { name }).length).toBeGreaterThan(0);
    }
    const nav = screen.getByRole("navigation", { name: "Structure" });
    expect(within(nav).getAllByRole("listitem")).toHaveLength(2);
    expect(within(nav).queryByText("Written:")).toBeNull();
    expect(screen.queryByText("Still to come")).toBeNull();
  });
});
