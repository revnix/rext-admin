/**
 * The checklist beside an article: the on-page score, the rows the backend's
 * checklist carries, the issues, and the claims to verify.
 */

import { render, screen, within } from "@testing-library/react";
import { ArticleChecklist } from "@/components/generate-content/article-checklist";
import type {
  ContentChecklist,
  SEORESULT,
  TrustScore,
} from "@/types/generate-content";

const seoScore = {
  seo_health_score: 82.4,
  issues: [
    { type: "Title", level: "GOOD", message: "Optimal Title Length" },
    { type: "Links", level: "WARNING", message: "Add an internal link" },
  ],
} as unknown as SEORESULT;

const trustScore = { score: 78 } as unknown as TrustScore;

const checklist: ContentChecklist = {
  readability: {
    score: 51,
    band: "fairly_difficult",
    label: "Fairly difficult",
  },
  keyphrase_density: {
    value: 0.613,
    status: "ok",
    occurrences: 12,
    detail: "within target band",
  },
  validation: {
    passed: false,
    gave_up: true,
    stage: "post_humanize",
    issues: [
      {
        name: "word_count",
        severity: "error",
        detail: "1,120 words, under 1,500",
      },
    ],
    warnings: [],
  },
  claims_to_verify: [
    {
      category: "statistic",
      sentence: "Headless sites load 40% faster on average.",
      unsupported: "40% faster",
    },
  ],
};

describe("ArticleChecklist", () => {
  it("shows the score, the rows, the issues and the claims", () => {
    render(
      <ArticleChecklist
        seoScore={seoScore}
        checklist={checklist}
        trustScore={trustScore}
      />,
    );

    const card = screen.getByRole("region", { name: "Checklist" });
    expect(within(card).getByText("On-page score · Good")).toBeInTheDocument();
    expect(within(card).getByText("82")).toBeInTheDocument();
    expect(within(card).getByText("Fairly difficult")).toBeInTheDocument();
    expect(within(card).getByText("0.61%")).toBeInTheDocument();
    expect(within(card).getByText("In range")).toBeInTheDocument();
    expect(within(card).getByText("12 uses")).toBeInTheDocument();
    expect(within(card).getByText("78%")).toBeInTheDocument();
    expect(within(card).getByText("1 failing")).toBeInTheDocument();
    expect(
      within(card).getByText("1,120 words, under 1,500"),
    ).toBeInTheDocument();
    expect(within(card).getByText("Add an internal link")).toBeInTheDocument();
    expect(
      within(card).getByText("Headless sites load 40% faster on average."),
    ).toBeInTheDocument();
    expect(
      within(card).getByText("No source for “40% faster”"),
    ).toBeInTheDocument();
  });

  it("leaves out the checks and the claims for an article saved before they were kept", () => {
    render(
      <ArticleChecklist
        seoScore={seoScore}
        checklist={{ ...checklist, validation: null, claims_to_verify: [] }}
        trustScore={null}
      />,
    );

    expect(screen.getByText("Fairly difficult")).toBeInTheDocument();
    expect(screen.queryByText("Checks")).not.toBeInTheDocument();
    expect(screen.queryByText("Claims to verify")).not.toBeInTheDocument();
    expect(screen.queryByText("Trust")).not.toBeInTheDocument();
  });

  it("says so when every claim has a source", () => {
    render(
      <ArticleChecklist
        seoScore={null}
        checklist={{
          ...checklist,
          validation: {
            passed: true,
            gave_up: false,
            stage: "post_humanize",
            issues: [],
            warnings: [],
          },
          claims_to_verify: [],
        }}
        trustScore={null}
      />,
    );

    expect(screen.getByText("Passed")).toBeInTheDocument();
    expect(
      screen.getByText("Every factual claim has a source."),
    ).toBeInTheDocument();
  });

  it("renders nothing before the checks have come back", () => {
    const { container } = render(
      <ArticleChecklist seoScore={null} checklist={null} trustScore={null} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
