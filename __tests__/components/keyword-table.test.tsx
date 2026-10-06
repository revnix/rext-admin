import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KeywordCard } from "@/components/keywords/keyword-card";
import {
  type KeywordRow,
  KeywordTable,
} from "@/components/keywords/keyword-table";
import { keywordMetrics } from "@/lib/keywords/keyword-metrics";

const row = (
  keyword: string,
  volume: number | null,
  difficulty: number,
  researchedAt = "2026-10-05T09:00:00Z",
): KeywordRow => ({
  id: `library_${keyword}`,
  keyword,
  metrics: keywordMetrics({
    keyword_difficulty: difficulty,
    intent: ["commercial"],
    volume,
    volume_status: volume === null ? "lookup_failed" : "ok",
  }),
  researchedAt,
});

describe("KeywordTable", () => {
  it("shows what the analysis measured, and Use on each row", async () => {
    const onUse = jest.fn();
    render(
      <KeywordTable
        caption="Researched keywords"
        rows={[row("seo tools", 1200, 42), row("crm for agencies", null, 8)]}
        onUse={onUse}
      />,
    );
    const table = screen.getByRole("table", { name: "Researched keywords" });
    for (const header of [
      "Keyword",
      "Volume",
      "Difficulty",
      "Intent",
      "Researched",
    ]) {
      expect(
        within(table).getByRole("columnheader", { name: new RegExp(header) }),
      ).toBeInTheDocument();
    }
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows[0]).toHaveTextContent("seo tools");
    expect(rows[0]).toHaveTextContent("1.2K");
    expect(rows[0]).toHaveTextContent("Hard");
    expect(rows[0]).toHaveTextContent("Commercial");
    expect(rows[0]).toHaveTextContent("Oct 5, 2026");
    // No volume: the dash, with the reason on hover.
    expect(within(rows[1]).getByTitle(/could not be loaded/)).toHaveTextContent(
      "—",
    );

    await userEvent.click(
      within(table).getByRole("button", { name: "Use: crm for agencies" }),
    );
    expect(onUse).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: "crm for agencies" }),
    );
  });

  it("leaves out the measured columns when no row was measured", () => {
    render(
      <KeywordTable
        caption="Related keywords"
        rows={[{ id: "a", keyword: "seo audit" }]}
      />,
    );
    const table = screen.getByRole("table", { name: "Related keywords" });
    expect(within(table).getAllByRole("columnheader")).toHaveLength(1);
    expect(within(table).queryByRole("button", { name: /^Use/ })).toBeNull();
  });
});

describe("KeywordCard", () => {
  it("compact: the keyword and one line of facts", () => {
    render(
      <KeywordCard
        size="compact"
        keyword="seo tools"
        metrics={keywordMetrics({
          keyword_difficulty: 75,
          intent: ["commercial"],
          volume: 1200,
          volume_status: "ok",
        })}
      />,
    );
    expect(screen.getByText("seo tools")).toBeInTheDocument();
    expect(screen.getByText("1.2K searches")).toBeInTheDocument();
    expect(screen.getByText("Very hard")).toBeInTheDocument();
    expect(screen.getByText("Commercial")).toBeInTheDocument();
    // The compact size has no backlinks; the expanded one does.
    expect(screen.queryByText("Backlinks")).toBeNull();
  });

  it("expanded without an override: the intent as a word", () => {
    render(
      <KeywordCard
        keyword="seo tools"
        metrics={keywordMetrics({ intent: ["informational"] })}
      />,
    );
    const card = screen.getByRole("region", { name: "seo tools" });
    expect(within(card).queryByRole("combobox")).toBeNull();
    expect(within(card).getByText("Informational")).toBeInTheDocument();
    // Nothing measured reads as the dash, never a zero.
    expect(within(card).getAllByText("—").length).toBeGreaterThanOrEqual(3);
  });
});
