import {
  arrangeContentTypes,
  contentTypeLabel,
  evidenceParts,
  readSerpEvidence,
} from "@/lib/generate-content/content-type-step";

// The backend's candidates for each intent (src/flow/model/structure/intent_suggestion.py).
const COMMERCIAL = [
  "comparison",
  "best-tools",
  "alternatives",
  "in-depth-review",
  "pros-cons",
  "product-roundup",
  "buying-guide",
];
const INFORMATIONAL = [
  "blog",
  "how-to-guide",
  "explainer",
  "pillar-content",
  "checklist",
  "tutorial",
  "faq",
  "white-paper",
  "case-study",
  "glossary",
  "resource-list",
];

const LIST_POSTS = {
  results: 10,
  dominant_format: {
    format: "list",
    label: "list posts",
    count: 6,
    content_types: [
      "best-tools",
      "product-roundup",
      "resource-list",
      "checklist",
    ],
  },
  formats: { list: 6, review: 2 },
  paa_count: 4,
  ai_overview: true,
};

describe("readSerpEvidence", () => {
  it("reads the gate's evidence", () => {
    expect(readSerpEvidence(LIST_POSTS)).toEqual({
      results: 10,
      dominantFormat: {
        label: "list posts",
        count: 6,
        contentTypes: [
          "best-tools",
          "product-roundup",
          "resource-list",
          "checklist",
        ],
      },
      paaCount: 4,
      aiOverview: true,
    });
  });

  it("is null without a SERP", () => {
    expect(readSerpEvidence(null)).toBeNull();
    expect(readSerpEvidence(undefined)).toBeNull();
    expect(readSerpEvidence({ results: 0 })).toBeNull();
    expect(readSerpEvidence("10 results")).toBeNull();
  });

  it("drops what isn't the expected shape", () => {
    expect(
      readSerpEvidence({
        results: 8,
        dominant_format: { label: "list posts", count: "6" },
        paa_count: -1,
        ai_overview: "yes",
      }),
    ).toEqual({
      results: 8,
      dominantFormat: null,
      paaCount: 0,
      aiOverview: null,
    });
  });
});

describe("evidenceParts", () => {
  it("says what the SERP shows", () => {
    expect(evidenceParts(readSerpEvidence(LIST_POSTS))).toEqual([
      "6 of 10 results are list posts",
      "4 questions people also ask",
      "AI Overview present",
    ]);
  });

  it("states an absent AI Overview, and says nothing when it isn't known", () => {
    const none = readSerpEvidence({ ...LIST_POSTS, ai_overview: false });
    expect(evidenceParts(none)).toContain("No AI Overview");
    const unknown = readSerpEvidence({ ...LIST_POSTS, ai_overview: null });
    expect(evidenceParts(unknown).join(" ")).not.toMatch(/AI Overview/);
  });

  it("leaves out a format no result shares and a question count of zero", () => {
    const evidence = readSerpEvidence({
      results: 7,
      dominant_format: null,
      paa_count: 1,
      ai_overview: null,
    });
    expect(evidenceParts(evidence)).toEqual(["1 question people also ask"]);
    expect(
      evidenceParts(readSerpEvidence({ results: 10, paa_count: 0 })),
    ).toEqual([]);
    expect(evidenceParts(null)).toEqual([]);
  });
});

describe("arrangeContentTypes", () => {
  it("puts the recommended type first, then the SERP's, then the intent's common types", () => {
    expect(
      arrangeContentTypes(COMMERCIAL, {
        recommended: "comparison",
        intent: "commercial",
        serpTypes: [
          "best-tools",
          "product-roundup",
          "resource-list",
          "checklist",
        ],
      }),
    ).toEqual({
      shown: [
        "comparison",
        "best-tools",
        "product-roundup",
        "alternatives",
        "in-depth-review",
      ],
      more: ["pros-cons", "buying-guide"],
    });
  });

  it("shows the intent's common types without a recommendation or a SERP", () => {
    expect(
      arrangeContentTypes(INFORMATIONAL, { intent: "Informational" }),
    ).toEqual({
      shown: ["how-to-guide", "explainer", "blog", "faq"],
      more: [
        "pillar-content",
        "checklist",
        "tutorial",
        "white-paper",
        "case-study",
        "glossary",
        "resource-list",
      ],
    });
  });

  it("keeps at least three cards and the backend's order for an unknown intent", () => {
    expect(
      arrangeContentTypes(["a", "b", "c", "d", "e"], {
        recommended: "d",
        intent: "unknown",
      }),
    ).toEqual({ shown: ["d", "a", "b"], more: ["c", "e"] });
  });

  it("shows a single leftover instead of folding it away", () => {
    expect(
      arrangeContentTypes(["a", "b", "c", "d"], { intent: "unknown" }),
    ).toEqual({ shown: ["a", "b", "c", "d"], more: [] });
  });

  it("ignores a recommendation or a SERP type that isn't a candidate", () => {
    expect(
      arrangeContentTypes(["blog", "faq", "explainer"], {
        recommended: "white-paper",
        serpTypes: ["checklist"],
        intent: "informational",
      }),
    ).toEqual({ shown: ["explainer", "blog", "faq"], more: [] });
  });
});

describe("contentTypeLabel", () => {
  it("names a type in sentence case", () => {
    expect(contentTypeLabel("best-tools")).toBe("Best tools");
    expect(contentTypeLabel("service_page")).toBe("Service page");
    expect(contentTypeLabel("faq")).toBe("FAQ");
    expect(contentTypeLabel("how-to-guide")).toBe("How-to guide");
    expect(contentTypeLabel("pros-cons")).toBe("Pros and cons");
  });
});
