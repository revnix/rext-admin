import {
  containsKeyphrase,
  normalizeTitle,
  scoreTitle,
  titleMaxChars,
} from "@/lib/generate-content/title-score";

// The Title step's score: the backend's title contract (seo_title_rules.py) plus a clarity check.
const KEYPHRASE = "seo agency";

describe("containsKeyphrase, as the backend's contains_keyphrase", () => {
  it.each([
    ["How to Choose an SEO Agency for a Small Business", true],
    ["SEO-agency pricing, explained", true],
    ["The agency for SEO you can trust", false],
    ["An SEO agencyx review", false],
  ])("%s → %s", (title, expected) => {
    expect(containsKeyphrase(title, KEYPHRASE)).toBe(expected);
  });

  it("never matches an empty keyphrase", () => {
    expect(containsKeyphrase("Anything at all", "  ")).toBe(false);
  });
});

describe("scoreTitle", () => {
  it("meets all three for a title in the backend's contract", () => {
    const title = "How to Choose an SEO Agency: A Guide for Owners"; // 47
    const fixed = `${title} 2026`; // 52
    const score = scoreTitle(fixed, KEYPHRASE);

    expect(score).toMatchObject({ met: 3, total: 3 });
    expect(score.checks.map((check) => check.label)).toEqual([
      "Has “seo agency”",
      "52 characters",
      "Reads clearly",
    ]);
  });

  it("measures the length after the backend's normalisation", () => {
    expect(normalizeTitle('  "SEO   agency tips"  ')).toBe("SEO agency tips");
    const short = scoreTitle("SEO agency tips", KEYPHRASE);
    expect(short.checks[1]).toEqual({
      id: "length",
      met: false,
      label: "15 characters, under 50",
    });
  });

  it("says what is missing", () => {
    const score = scoreTitle(
      "The Complete, Practical Guide to Choosing a Marketing Partner Today",
      KEYPHRASE,
    );

    expect(score.met).toBe(1);
    expect(score.checks[0].label).toBe("Missing “seo agency”");
    expect(score.checks[1].label).toBe("67 characters, over 59");
  });

  it.each([
    [
      "The BEST SEO Agency Picks for Small Businesses in 2026",
      "Has a word in capitals",
    ],
    [
      "Is an SEO Agency Worth It?! What Owners Should Know Now",
      "Stacked punctuation",
    ],
    [
      "SEO Agency: Costs: What Owners Pay and Why It Varies",
      "More than one separator",
    ],
  ])("flags %s", (title, problem) => {
    const clarity = scoreTitle(title, KEYPHRASE).checks[2];
    expect(clarity).toEqual({ id: "clarity", met: false, label: problem });
  });

  it("lets acronyms through", () => {
    const clarity = scoreTitle(
      "SEO Agency vs HTML Basics: What a Small Firm Needs",
      KEYPHRASE,
    ).checks[2];
    expect(clarity.met).toBe(true);
  });

  it("has no keyphrase check without a keyphrase", () => {
    const score = scoreTitle(
      "A Title With No Focus Keyphrase To Check At All Here",
      "",
    );
    expect(score.total).toBe(2);
    expect(score.checks.map((check) => check.id)).toEqual([
      "length",
      "clarity",
    ]);
  });
});

// A long keyphrase leaves 59 characters little room beside it: the backend lets its titles run to
// the keyphrase plus 20, never over 75 (seo_title_rules.title_max_chars, G69).
describe("the length limit for a long keyphrase", () => {
  const LONG = "best project management software for small teams"; // 48

  it("is 59 for a short keyphrase, the keyphrase plus 20 for a long one, at most 75", () => {
    expect(titleMaxChars(KEYPHRASE)).toBe(59);
    expect(titleMaxChars("")).toBe(59);
    expect(titleMaxChars(null)).toBe(59);
    expect(titleMaxChars(LONG)).toBe(68);
    expect(titleMaxChars("x".repeat(60))).toBe(75);
  });

  it("measures the keyphrase with its punctuation flattened, as the backend does", () => {
    // 76 as typed, 70 flattened: 70 + 20, capped at 75.
    expect(
      titleMaxChars(
        "c++ and c# developers for hire: best project management software for teams!!",
      ),
    ).toBe(75);
  });

  it("meets the length check for a long keyphrase's title within its limit", () => {
    const title =
      "Best Project Management Software for Small Teams: How to Choose"; // 63
    const score = scoreTitle(title, LONG);

    expect(score.checks[1]).toEqual({
      id: "length",
      met: true,
      label: "63 characters",
    });
    expect(score).toMatchObject({ met: 3, total: 3 });
  });

  it("says over the keyphrase's limit, not over 59", () => {
    const title =
      "Best Project Management Software for Small Teams: A Buyer's Guide for 2026"; // 74
    expect(scoreTitle(title, LONG).checks[1]).toEqual({
      id: "length",
      met: false,
      label: "74 characters, over 68",
    });
  });

  it("keeps 59 for a short keyphrase", () => {
    const title =
      "How to Choose an SEO Agency: A Guide for Small Business Owner"; // 61
    expect(scoreTitle(title, KEYPHRASE).checks[1].label).toBe(
      "61 characters, over 59",
    );
  });
});
