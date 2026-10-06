import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SuggestionsSection } from "@/components/generate-content/suggestions";
import type { KeywordCluster, SEORESULT } from "@/types/generate-content";

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
}: {
  seoResult?: SEORESULT | null;
  suggestedKeywords?: string[];
  keywordClusters?: KeywordCluster[];
  onSelect?: jest.Mock;
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
      within(card).getByRole("meter", {
        name: "Keyword difficulty, 42 of 100",
      }),
    ).toBeInTheDocument();
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
      screen.getByRole("button", { name: "Continue with this keyword" }),
    );
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
