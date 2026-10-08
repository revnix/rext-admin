import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SuggestionsSection } from "@/components/generate-content/suggestions";
import type { KeywordCluster, SEORESULT } from "@/types/generate-content";

// The stage's credits come from the plan catalogue (run-cost.test.tsx); here, which stage's
// tooltip the button sits in.
jest.mock("@/components/generate-content/run-cost", () => ({
  // As the real tooltip's trigger, no wrapper: the button itself is marked.
  StageCostTooltip: ({
    stage,
    children,
  }: {
    stage: string;
    children: React.ReactElement<Record<string, unknown>>;
  }) =>
    jest.requireActual("react").cloneElement(children, { "data-stage": stage }),
}));

const seo = (
  volume: SEORESULT["volume"],
  volume_status?: SEORESULT["volume_status"],
) =>
  ({
    keyword_difficulty: 42,
    intent: ["informational", "commercial"],
    volume,
    volume_status,
    backlinks: 1240,
    referring_domains: 312,
  }) as unknown as SEORESULT;

const cluster = (name: string, keywords: string[]): KeywordCluster =>
  ({
    cluster_name: name,
    main_intent: "commercial",
    total_score: 1,
    keywords: keywords.map((keyword) => ({ keyword })),
  }) as unknown as KeywordCluster;

const renderSuggestions = ({
  seoResult = seo(1200, "ok"),
  suggestedKeywords = ["seo tools", "seo tools for agencies"],
  keywordClusters = [],
  onSelect = jest.fn(),
  gate,
}: {
  seoResult?: SEORESULT | null;
  suggestedKeywords?: string[];
  keywordClusters?: KeywordCluster[];
  onSelect?: jest.Mock;
  gate?: unknown;
} = {}) =>
  render(
    <SuggestionsSection
      primaryKeyword="seo tools"
      suggestedKeywords={suggestedKeywords}
      onSelect={onSelect}
      seoResult={seoResult}
      selectedIntent=""
      onIntentChange={jest.fn()}
      keywordClusters={keywordClusters}
      gate={gate}
    />,
  );

describe("SuggestionsSection", () => {
  it("shows the analysed keyword on the keyword card", () => {
    renderSuggestions();
    const card = screen.getByRole("region", { name: "seo tools" });
    expect(within(card).getByText("Searched keyword")).toBeInTheDocument();
    expect(within(card).getByText("1.2K")).toBeInTheDocument();
    expect(within(card).getByText("Hard")).toBeInTheDocument();
    expect(
      within(card).getByRole("meter", { name: "Keyword difficulty" }),
    ).toHaveAttribute("aria-valuenow", "42");
    expect(
      within(card).getByText(
        "Search results: Informational · Suggested: Commercial",
      ),
    ).toBeInTheDocument();
    expect(within(card).getByText("1,240")).toBeInTheDocument();
    expect(within(card).getByText("312")).toBeInTheDocument();
  });

  it("continues with the analysed keyword, or analyzes a suggestion", async () => {
    const onSelect = jest.fn();
    renderSuggestions({ onSelect });
    await userEvent.click(
      // Keeping the keyword takes the titles' credits: its tooltip says so, not its label (E25,
      // FB2.11).
      screen.getByRole("button", { name: "Continue with this keyword" }),
    );
    expect(
      screen
        .getByRole("button", { name: "Continue with this keyword" })
        .closest("[data-stage]"),
    ).toHaveAttribute("data-stage", "title_generation");
    expect(onSelect).toHaveBeenLastCalledWith("seo tools");

    // The analysed keyword isn't offered again among the suggestions.
    const table = screen.getByRole("table", { name: "Suggested keywords" });
    expect(within(table).queryByText("seo tools")).toBeNull();
    await userEvent.click(
      within(table).getByRole("button", {
        name: "Analyze: seo tools for agencies",
      }),
    );
    expect(onSelect).toHaveBeenLastCalledWith("seo tools for agencies");
  });

  it("puts the clusters in groups beneath the table, closed until opened", async () => {
    const onSelect = jest.fn();
    renderSuggestions({
      onSelect,
      keywordClusters: [cluster("seo agencies", ["white label seo"])],
    });
    const group = screen.getByRole("button", { name: /seo agencies/i });
    expect(group).toHaveTextContent("1 keyword · Commercial");
    expect(screen.queryByText("white label seo")).toBeNull();
    await userEvent.click(group);
    const table = screen.getByRole("table", {
      name: "Keyword group: seo agencies",
    });
    await userEvent.click(
      within(table).getByRole("button", { name: "Analyze: white label seo" }),
    );
    expect(onSelect).toHaveBeenLastCalledWith("white label seo");
  });

  it("puts the gate's top ten in the side pane, and leaves it out without one", () => {
    const { unmount } = renderSuggestions({
      gate: {
        type: "keyword Selection",
        serp_titles: [
          {
            position: 1,
            title: "Best SEO tools for 2026",
            domain: "example.com",
            url: "https://example.com/best",
            format: "list",
          },
          { position: 2, title: 42 },
        ],
      },
    });
    const pane = screen.getAllByRole("complementary", {
      name: "Top search results",
    })[0];
    expect(
      within(pane).getByRole("link", { name: "Best SEO tools for 2026" }),
    ).toBeInTheDocument();
    // Each result at a glance: its position, its site, the kind of page it is.
    const result = within(pane).getByRole("listitem");
    expect(within(result).getByText("Position")).toBeInTheDocument();
    expect(within(result).getByText("example.com")).toBeInTheDocument();
    expect(within(result).getByText("List post")).toBeInTheDocument();
    // What the list is, in the customer's words, and the kinds of pages in it.
    expect(
      within(pane).getByText(
        "The pages Google shows first for this keyword. Your article will compete with them.",
      ),
    ).toBeInTheDocument();
    expect(
      within(pane).getByText("Among these 1: 1 list post."),
    ).toBeInTheDocument();
    // A malformed result is left out.
    expect(within(pane).getAllByRole("listitem")).toHaveLength(1);
    unmount();

    renderSuggestions({ gate: { type: "keyword Selection" } });
    expect(screen.queryByRole("complementary")).toBeNull();
  });

  describe("the search results under 1024 px", () => {
    const gate = {
      type: "keyword Selection",
      serp_titles: [
        {
          position: 1,
          title: "Best SEO tools for 2026",
          domain: "example.com",
          url: "https://example.com/best",
          format: "list",
        },
      ],
    };

    it("open from the Other keywords heading, not a button floating over Analyze", async () => {
      const user = userEvent.setup();
      renderSuggestions({ gate });

      const buttons = screen.getAllByRole("button", {
        name: "Top search results",
      });
      expect(buttons).toHaveLength(1);
      expect(buttons[0]).not.toHaveClass("fixed");
      expect(
        screen.getByRole("heading", { name: "Other keywords" }).parentElement,
      ).toContainElement(buttons[0]);

      await user.click(buttons[0]);
      const sheet = await screen.findByRole("dialog", {
        name: "Top search results",
      });
      expect(
        within(sheet).getByRole("link", { name: "Best SEO tools for 2026" }),
      ).toBeInTheDocument();
    });

    it("sit on the keyword card while the keyword's data is missing", () => {
      renderSuggestions({ gate, seoResult: null, suggestedKeywords: [] });

      const card = screen.getByRole("region", { name: "seo tools" });
      expect(
        within(card).getByRole("button", { name: "Top search results" }),
      ).toBeInTheDocument();
    });

    it("have no button without results", () => {
      renderSuggestions({ gate: { type: "keyword Selection" } });
      expect(
        screen.queryByRole("button", { name: "Top search results" }),
      ).toBeNull();
    });
  });

  it("shows the card and the keyword table as placeholders while the data is missing", () => {
    const { container } = renderSuggestions({
      seoResult: null,
      suggestedKeywords: [],
    });

    // The card stands with the keyword, each figure a placeholder of its own shape.
    const card = screen.getByRole("region", { name: "seo tools" });
    expect(within(card).getByText("Searched keyword")).toBeInTheDocument();
    expect(
      card.querySelectorAll('[data-slot="keyword-fact-pending"]'),
    ).toHaveLength(5);
    expect(within(card).queryByText("—")).toBeNull();
    // "Other keywords" is there as its heading and rows to come; nothing acts yet.
    const others = screen.getByRole("region", { name: "Other keywords" });
    expect(others).toHaveAttribute("aria-busy", "true");
    expect(
      within(others).getByRole("heading", { name: "Other keywords" }),
    ).toBeInTheDocument();
    expect(within(others).queryByRole("button")).toBeNull();
    expect(container.querySelector("table")).toBeNull();
    // Said once for a screen reader.
    expect(
      screen.getByText("Fetching the keyword's data..."),
    ).toBeInTheDocument();
  });

  it("says so when there is nothing to suggest", () => {
    renderSuggestions({ suggestedKeywords: ["seo tools"] });
    expect(
      screen.getByRole("heading", { name: "No suggestions for this keyword" }),
    ).toBeInTheDocument();
  });

  it("shows a volume from a run that predates the status", () => {
    renderSuggestions({ seoResult: seo(1200) });
    expect(screen.getByText("1.2K")).toBeInTheDocument();
  });

  it.each([
    [0, "ok"],
    [0, undefined],
    [null, undefined],
    [undefined, undefined],
    ["", undefined],
    [null, "no_data"],
  ])("reads %p (%p) as No search data", (volume, status) => {
    renderSuggestions({
      seoResult: seo(
        volume as SEORESULT["volume"],
        status as SEORESULT["volume_status"],
      ),
    });
    expect(screen.getByText("No search data")).toBeInTheDocument();
  });

  it.each([
    ["lookup_failed", "Lookup failed"],
    ["insufficient_credits", "Not enough credits"],
  ])("says why there is no volume: %s", (status, words) => {
    renderSuggestions({
      seoResult: seo(null, status as SEORESULT["volume_status"]),
    });
    expect(screen.getByText(words)).toBeInTheDocument();
  });

  describe("no spinner outlives 30 seconds", () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it("says what is missing once the wait is over", () => {
      renderSuggestions({ seoResult: null, suggestedKeywords: [] });
      expect(
        screen.getByText("Fetching the keyword's data..."),
      ).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(29_000);
      });
      expect(
        screen.getByText("Fetching the keyword's data..."),
      ).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(1_000);
      });
      expect(
        screen.getByText("The keyword analysis didn't return its data."),
      ).toBeInTheDocument();
      expect(
        screen.queryByText("Fetching the keyword's data..."),
      ).not.toBeInTheDocument();
    });
  });
});
