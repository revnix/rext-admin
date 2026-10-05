import { act, render, screen, waitFor } from "@testing-library/react";
import { SuggestionsSection } from "@/components/generate-content/suggestions";
import type { SEORESULT } from "@/types/generate-content";

jest.mock("@/components/ui/content/safe-chart-radial-stacked", () => ({
  SafeChartRadialStacked: () => null,
}));
jest.mock("@/components/ui/content/intent-card", () => ({
  SearchIntentCard: () => null,
}));

const seo = (
  volume: SEORESULT["volume"],
  volume_status?: SEORESULT["volume_status"],
) =>
  ({
    keyword_difficulty: 30,
    intent: ["informational"],
    volume,
    volume_status,
  }) as unknown as SEORESULT;

const renderSuggestions = (
  seoResult: SEORESULT | null,
  suggestedKeywords: string[] = ["seo tools for agencies"],
) =>
  render(
    <SuggestionsSection
      instruction=""
      primaryKeyword="seo tools"
      suggestedKeywords={suggestedKeywords}
      onSelect={jest.fn()}
      seoResult={seoResult}
      selectedIntent=""
      onIntentChange={jest.fn()}
    />,
  );

describe("SuggestionsSection monthly volume", () => {
  it("shows a measured volume", () => {
    const { container } = renderSuggestions(seo(1200, "ok"));
    expect(screen.getByText("1.2K")).toBeInTheDocument();
    expect(screen.getByText("Avg. searches per month")).toBeInTheDocument();
    expect(screen.queryByText("Fetching...")).not.toBeInTheDocument();
    // no invented trend line under the number
    expect(container.querySelector(".recharts-wrapper")).toBeNull();
  });

  it("shows a volume from a run that predates the status", () => {
    renderSuggestions(seo(1200));
    expect(screen.getByText("1.2K")).toBeInTheDocument();
  });

  it.each([
    [0, "ok"],
    [0, undefined],
    [null, undefined],
    [undefined, undefined],
    ["", undefined],
    [null, "no_data"],
  ])("reads %p (%p) as No search data, without a spinner", (volume, status) => {
    renderSuggestions(
      seo(volume as SEORESULT["volume"], status as SEORESULT["volume_status"]),
    );
    expect(screen.getByText("No search data")).toBeInTheDocument();
    expect(screen.queryByText("Fetching...")).not.toBeInTheDocument();
  });

  it.each([
    ["lookup_failed", "Lookup failed"],
    ["insufficient_credits", "Not enough credits"],
  ])("says why there is no volume: %s", (status, words) => {
    renderSuggestions(seo(null, status as SEORESULT["volume_status"]));
    expect(screen.getByText(words)).toBeInTheDocument();
  });

  it("spins while the analysis result has not arrived", () => {
    renderSuggestions(null);
    expect(screen.getByText("Fetching...")).toBeInTheDocument();
  });

  describe("no spinner outlives 30 seconds", () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it("says what is missing once the wait is over", async () => {
      renderSuggestions(null, []);
      expect(screen.getByText("Fetching...")).toBeInTheDocument();
      expect(screen.getByText("Analyzing...")).toBeInTheDocument();
      expect(screen.getByText("Generating suggestions...")).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(29_000);
      });
      expect(screen.getByText("Fetching...")).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(1_000);
      });
      // The spinners leave through framer-motion's exit animation, which runs on
      // real frames: let it finish.
      jest.useRealTimers();
      await waitFor(() => {
        expect(screen.getByText("Not available")).toBeInTheDocument();
        expect(
          screen.getByText("Intent not available for this keyword"),
        ).toBeInTheDocument();
        expect(
          screen.getByText("No suggestions for this keyword"),
        ).toBeInTheDocument();
      });
      expect(screen.queryByText("Fetching...")).not.toBeInTheDocument();
      expect(screen.queryByText("Analyzing...")).not.toBeInTheDocument();
      expect(
        screen.queryByText("Generating suggestions..."),
      ).not.toBeInTheDocument();
    });
  });
});
