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

  it("has no steps row of the flow's above the article (FB3.1)", () => {
    render(editor({ isEnhancing: true }));
    expect(
      screen.queryByRole("navigation", { name: "Article steps" }),
    ).toBeNull();
    // The article is the first thing in its column.
    const article = document.querySelector("article");
    expect(article?.previousElementSibling).toBeNull();
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
    enhancingMsg: "Writing the first draft",
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
    // The stage by its own name, which says what is being done (task 838).
    expect(
      screen.getByText("Writing the first draft").parentElement,
    ).toHaveTextContent(/^Writing the first draft · section 2 of 3$/);
    expect(screen.queryByText("Writing the article")).toBeNull();
    for (const name of ["Edit article", "Copy", "Publish"]) {
      expect(screen.queryByRole("button", { name })).toBeNull();
    }
  });

  it("holds the run on one line in the bar, which then names the stage itself", () => {
    render(
      editor({
        ...writingProps,
        runStrip: <p>Draft 22 s</p>,
      }),
    );
    const bar = screen.getByText("Writing the article").parentElement;
    // The strip is the bar's next line and names the stage there, so the first line says the
    // whole ("Writing the article") where the strip shows and the stage where it doesn't
    // (both are shown or hidden by width, which jsdom doesn't lay out).
    expect(bar?.nextElementSibling).toContainElement(
      screen.getByText("Draft 22 s"),
    );
    expect(screen.getByText("Writing the first draft")).toHaveClass(
      "hidden",
      "xl:inline",
    );
    expect(screen.getByText("Writing the article")).toHaveClass("xl:hidden");
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
    expect(screen.getAllByText("Writing the first draft")).toHaveLength(1);
    expect(within(article).queryByText("Writing the first draft")).toBeNull();
  });

  it("shows the title and the outline's sections before the first words arrive, each over the lines its text will take", () => {
    const { container } = render(
      editor({
        isEnhancing: true,
        enhancingMsg: "Researching the topic",
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
    // Placeholders shaped like the article (task 838): the introduction's three lines, then
    // each planned section's heading over its own, a subsection's shorter. No anonymous
    // block of grey bars, and no row of tag pills.
    const sections = within(article).getAllByRole("listitem");
    expect(
      sections.map((section) => section.firstElementChild?.textContent),
    ).toEqual(["Pick a show idea", "Choose one listener"]);
    expect(
      sections.map(
        (section) => section.querySelectorAll('[data-slot="skeleton"]').length,
      ),
    ).toEqual([3, 2]);
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(
      8,
    );
    expect(
      container.querySelector('[data-slot="skeleton"].rounded-full'),
    ).toBeNull();
    expect(
      within(screen.getByRole("navigation", { name: "Structure" }))
        .getAllByRole("listitem")
        .map((row) => row.textContent),
    ).toEqual([
      "Still to come:H2Pick a show idea",
      "Still to come:H3Choose one listener",
    ]);
  });

  it("lists the newest search first in the Research box (task 838)", () => {
    render(
      editor({
        ...writingProps,
        toolCalls: [
          { id: "1", name: "search", query: "podcast formats", status: "done" },
          { id: "2", name: "search", query: "podcast gear", status: "done" },
          {
            id: "3",
            name: "search",
            query: "podcast hosting",
            status: "running",
          },
        ] as never,
      }),
    );
    const queries = screen
      .getAllByText(/^"?podcast (formats|gear|hosting)"?$/)
      .map((query) => query.textContent?.replace(/"/g, ""));
    expect(queries.slice(0, 3)).toEqual([
      "podcast hosting",
      "podcast gear",
      "podcast formats",
    ]);
  });

  describe("with the writer's whole first draft (task 773)", () => {
    const draftProps = {
      ...writingProps,
      draft: true,
      enhancingMsg: "Polishing the wording",
      generatedContent:
        "Intro.\n\n## Pick a show idea\n\nText.\n\n## Choose a format\n\nA solo show.\n\n## The gear you need\n\nA microphone.",
    };

    it("marks the text as a first draft, above the article and in the bar", () => {
      render(editor(draftProps));
      const article = screen.getByRole("article");
      const notice = within(article).getByRole("status");
      expect(notice).toHaveTextContent("First draft");
      expect(notice).toHaveTextContent(
        "We're still rewriting and checking the article. The final text replaces this one when it's ready.",
      );
      // Above the title: the first thing read.
      expect(
        notice.compareDocumentPosition(
          within(article).getByRole("heading", { level: 1 }),
        ) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      const bar = screen.getByText("Polishing the wording").parentElement
        ?.parentElement as HTMLElement;
      expect(within(bar).getByText("First draft")).toBeInTheDocument();
    });

    it("names no section as the one being written: they are all there", () => {
      render(editor(draftProps));
      expect(
        screen.getByText("Polishing the wording").parentElement,
      ).toHaveTextContent(/^Polishing the wording$/);
      const nav = screen.getByRole("navigation", { name: "Structure" });
      expect(
        within(nav)
          .getAllByRole("listitem")
          .map((row) => row.textContent),
      ).toEqual([
        "H2Pick a show idea",
        "H2Choose a format",
        "H2The gear you need",
      ]);
      for (const row of within(nav).getAllByRole("button")) {
        expect(row).toBeEnabled();
      }
      expect(screen.queryByText("Still to come")).toBeNull();
    });

    it("keeps the actions for the end", () => {
      render(editor(draftProps));
      for (const name of ["Edit article", "Copy", "Publish"]) {
        expect(screen.queryByRole("button", { name })).toBeNull();
      }
    });

    it("says nothing of a draft once the article is final", () => {
      render(
        editor({
          ...draftProps,
          isEnhancing: false,
          readabilityScore: { flesch_reading_ease: 60 } as never,
          trustScore: { score: 70 } as never,
          seoScore: { seo_health_score: 90, issues: [] } as never,
        }),
      );
      expect(screen.queryByText("First draft")).toBeNull();
      expect(
        screen.getAllByRole("button", { name: "Publish" }).length,
      ).toBeGreaterThan(0);
    });

    it("says nothing of a draft when the run is no longer going", () => {
      render(editor({ ...draftProps, isEnhancing: false }));
      expect(screen.queryByText("First draft")).toBeNull();
    });

    it("is not a draft while the text still arrives piece by piece", () => {
      render(editor({ ...draftProps, draft: false }));
      expect(screen.queryByText("First draft")).toBeNull();
      expect(
        screen.getByText("Polishing the wording").parentElement,
      ).toHaveTextContent(/^Polishing the wording · section 3 of 3$/);
    });
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
