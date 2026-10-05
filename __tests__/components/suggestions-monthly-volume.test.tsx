import { render, screen } from "@testing-library/react";
import { SuggestionsSection } from "@/components/generate-content/suggestions";
import type { SEORESULT } from "@/types/generate-content";

jest.mock("@/components/ui/content/monthly-volume-card", () => ({
  MonthlyVolumeCard: ({ volume }: { volume: string }) => (
    <div data-testid="volume-card">{volume}</div>
  ),
}));
jest.mock("@/components/ui/content/safe-chart-radial-stacked", () => ({
  SafeChartRadialStacked: () => null,
}));
jest.mock("@/components/ui/content/intent-card", () => ({
  SearchIntentCard: () => null,
}));

const seo = (volume: SEORESULT["volume"]) =>
  ({
    keyword_difficulty: 30,
    intent: ["informational"],
    volume,
  }) as unknown as SEORESULT;

const renderSuggestions = (seoResult: SEORESULT | null) =>
  render(
    <SuggestionsSection
      instruction=""
      primaryKeyword="seo tools"
      suggestedKeywords={[]}
      onSelect={jest.fn()}
      seoResult={seoResult}
      selectedIntent=""
      onIntentChange={jest.fn()}
    />,
  );

describe("SuggestionsSection monthly volume", () => {
  it("shows the volume card when volume is available", () => {
    renderSuggestions(seo(1200));
    expect(screen.getByTestId("volume-card")).toHaveTextContent("1200");
    expect(screen.queryByText("Fetching...")).not.toBeInTheDocument();
  });

  it("treats a volume of 0 as a valid completed result", () => {
    renderSuggestions(seo(0));
    expect(screen.getByTestId("volume-card")).toHaveTextContent("0");
    expect(screen.queryByText("Fetching...")).not.toBeInTheDocument();
  });

  it.each([
    null,
    undefined,
    "",
  ])("completes without a spinner when volume is %p", (volume) => {
    renderSuggestions(seo(volume));
    expect(screen.getByText("Volume not available")).toBeInTheDocument();
    expect(screen.queryByText("Fetching...")).not.toBeInTheDocument();
  });

  it("keeps the spinner only while the analysis result has not arrived", () => {
    renderSuggestions(null);
    expect(screen.getByText("Fetching...")).toBeInTheDocument();
  });
});
