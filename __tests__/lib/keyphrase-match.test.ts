import {
  leadsWithKeyphrase,
  splitByKeyphrase,
} from "@/lib/generate-content/keyphrase-match";

// Where the keyphrase sits in a title, by the title score's own matching (containsKeyphrase).
const KEYPHRASE = "vegetable garden planner";

const bold = (title: string, keyphrase: string | null = KEYPHRASE) =>
  splitByKeyphrase(title, keyphrase).map((part) =>
    part.keyphrase ? `[${part.text}]` : part.text,
  );

describe("splitByKeyphrase", () => {
  it("cuts the keyphrase out of the title, its own letters and case kept", () => {
    expect(
      bold("Free Vegetable Garden Planner With Printable Bed Layouts"),
    ).toEqual([
      "Free ",
      "[Vegetable Garden Planner]",
      " With Printable Bed Layouts",
    ]);
    expect(bold("Vegetable Garden Planner: Plan Beds")).toEqual([
      "[Vegetable Garden Planner]",
      ": Plan Beds",
    ]);
  });

  it("matches across punctuation, as the score does, but never inside a word", () => {
    expect(bold("SEO-agency pricing, explained", "seo agency")).toEqual([
      "[SEO-agency]",
      " pricing, explained",
    ]);
    expect(bold("An SEO agencyx review", "seo agency")).toEqual([
      "An SEO agencyx review",
    ]);
    expect(bold("Plan Your Vegetable Garden: Beds and Timing")).toEqual([
      "Plan Your Vegetable Garden: Beds and Timing",
    ]);
  });

  it("finds every occurrence", () => {
    expect(bold("SEO agency or SEO Agency?", "seo agency")).toEqual([
      "[SEO agency]",
      " or ",
      "[SEO Agency]",
      "?",
    ]);
  });

  it("cuts anywhere in a script written without spaces", () => {
    expect(bold("おすすめの家庭菜園アプリ10選", "家庭菜園")).toEqual([
      "おすすめの",
      "[家庭菜園]",
      "アプリ10選",
    ]);
    expect(bold("วิธีปลูกผักในบ้านสำหรับมือใหม่", "ปลูกผัก")).toEqual([
      "วิธี",
      "[ปลูกผัก]",
      "ในบ้านสำหรับมือใหม่",
    ]);
  });

  it("leaves the title whole without a keyphrase", () => {
    expect(bold("Vegetable Garden Planner", null)).toEqual([
      "Vegetable Garden Planner",
    ]);
    expect(bold("Vegetable Garden Planner", "  ")).toEqual([
      "Vegetable Garden Planner",
    ]);
    expect(splitByKeyphrase("", KEYPHRASE)).toEqual([]);
  });
});

describe("leadsWithKeyphrase", () => {
  it.each([
    ["Vegetable Garden Planner: Free Online Planning Tool", true],
    ["“Vegetable garden planner” for small plots", true],
    ["🌱 Vegetable Garden Planner, free", true],
    ["Smart Gardener: Free Vegetable Garden Planner", false],
    ["The vegetable garden planner we use", false],
    ["Plan Your Vegetable Garden", false],
  ])("%s → %s", (title, expected) => {
    expect(leadsWithKeyphrase(title, KEYPHRASE)).toBe(expected);
  });

  it("reads a script without spaces too", () => {
    expect(leadsWithKeyphrase("家庭菜園の始め方", "家庭菜園")).toBe(true);
    expect(leadsWithKeyphrase("初心者の家庭菜園", "家庭菜園")).toBe(false);
  });
});
