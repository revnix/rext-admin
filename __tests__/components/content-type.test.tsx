import { fireEvent, render, screen } from "@testing-library/react";
import ContentType from "@/components/generate-content/content-type";

const COMMERCIAL = [
  "comparison",
  "best-tools",
  "alternatives",
  "in-depth-review",
  "pros-cons",
  "product-roundup",
  "buying-guide",
];

const gate = {
  type: "content_type",
  search_intent: "commercial",
  content_types: COMMERCIAL,
  recommended_content_type: "comparison",
  recommendation_reason: "People want to weigh their options before they buy.",
  serp_evidence: {
    results: 10,
    dominant_format: {
      format: "list",
      label: "list posts",
      count: 6,
      content_types: ["best-tools", "product-roundup"],
    },
    formats: { list: 6 },
    paa_count: 4,
    ai_overview: true,
  },
};

function renderStep(props: Partial<Parameters<typeof ContentType>[0]> = {}) {
  const onSelect = jest.fn();
  render(
    <ContentType
      recommendedContentType="comparison"
      gate={gate}
      instruction="Select a content type"
      contentTypes={COMMERCIAL}
      keyword="project management software"
      handleContentTypeSelect={onSelect}
      {...props}
    />,
  );
  return onSelect;
}

describe("ContentType", () => {
  it("shows the SERP's evidence above the cards", () => {
    renderStep();
    // The line's parts are spans of one paragraph.
    expect(
      screen.getByText("6 of 10 results are list posts").parentElement
        ?.textContent,
    ).toBe(
      "6 of 10 results are list posts · 4 questions people also ask · AI Overview present",
    );
  });

  it("puts the recommended type first with its reason, and the word band on each card", () => {
    renderStep();
    const first = screen.getByRole("button", { pressed: true });
    expect(first).toHaveAccessibleName("Comparison (recommended)");
    expect(first).toHaveAccessibleDescription(
      expect.stringContaining(
        "Why: People want to weigh their options before they buy.",
      ),
    );
    expect(first).toHaveAccessibleDescription(
      expect.stringContaining("1,500–3,000 words"),
    );
    expect(screen.getAllByText(/^Why:/)).toHaveLength(1);
  });

  it("folds the rarely used types under More types", () => {
    renderStep();
    expect(
      screen.queryByRole("button", { name: "Pros and cons" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "More types (2)" }));
    fireEvent.click(screen.getByRole("button", { name: "Pros and cons" }));
    expect(
      screen.getByRole("button", { name: "Pros and cons" }),
    ).toHaveAttribute("aria-pressed", "true");
    // Folded again, the chosen type stays in view.
    fireEvent.click(screen.getByRole("button", { name: "Fewer types" }));
    expect(
      screen.getByRole("button", { name: "Pros and cons" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.queryByRole("button", { name: "Buying guide" }),
    ).not.toBeInTheDocument();
  });

  it("continues with the chosen type", () => {
    const onSelect = renderStep();
    fireEvent.click(screen.getByRole("button", { name: "Best tools" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onSelect).toHaveBeenCalledWith("best-tools");
  });

  it("shows no evidence or reason from another gate's payload, or without a SERP", () => {
    renderStep({ gate: { ...gate, type: "topic_selection" } });
    expect(screen.queryByText(/results are/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Why:/)).not.toBeInTheDocument();
  });

  it("shows no evidence line for a library keyword", () => {
    renderStep({ gate: { ...gate, serp_evidence: null } });
    expect(screen.queryByText(/results are/)).not.toBeInTheDocument();
    expect(screen.getByText(/^Why:/)).toBeInTheDocument();
  });
});
