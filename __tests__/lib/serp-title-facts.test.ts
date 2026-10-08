import {
  comparePick,
  measureTitle,
  positionsInWords,
  serpTitleFacts,
} from "@/lib/generate-content/serp-title-facts";
import { scoreTitle } from "@/lib/generate-content/title-score";
import type { SerpResult } from "@/lib/keywords/serp-results";

const KEYPHRASE = "vegetable garden planner";

const results = (rows: [string, string][]): SerpResult[] =>
  rows.map(([title, domain], index) => ({
    position: index + 1,
    title,
    domain,
  }));

// The lengths, in characters, beside each title.
const TOP_TEN = results([
  [
    "Vegetable Garden Planner: Free Online Planning Tool | Almanac",
    "almanac.com",
  ], // 61
  [
    "Vegetable Garden Planner – Plan Your Garden Online | GrowVeg",
    "growveg.com",
  ], // 60
  ["Smart Gardener: Free Vegetable Garden Planner", "smartgardener.com"], // 45
  [
    "Kitchen Garden Planner: Design Your Garden | Gardener’s Supply",
    "gardeners.com",
  ], // 62
  ["How to Plan a Vegetable Garden | The Spruce", "thespruce.com"], // 43
  ["Seedtime: Free Garden Planner and Planting Calendar", "seedtime.us"], // 51
  [
    "Best free vegetable garden planner app? : r/vegetablegardening",
    "reddit.com",
  ], // 62
  [
    "10 Vegetable Garden Layouts to Plan Your Best Harvest | Better Homes & Gardens",
    "bhg.com",
  ], // 78
  ["Vegetable Garden Planner | Burpee", "burpee.com"], // 33
  ["Planning a vegetable garden | UMN Extension", "extension.umn.edu"], // 43
]);

describe("serpTitleFacts", () => {
  const facts = serpTitleFacts(TOP_TEN, KEYPHRASE);

  it("counts the titles that use the keyphrase and those that lead with it", () => {
    expect(facts?.total).toBe(10);
    expect(facts?.keyphrase).toEqual({
      uses: [1, 2, 3, 7, 9],
      leads: [1, 2, 9],
    });
  });

  it("takes the median length and counts the titles past the score's limit", () => {
    // 51 and 60 in the middle; 60, 61, 62, 62 and 78 run past 59.
    expect(facts?.length).toEqual({ typical: 56, limit: 59, over: 5 });
  });

  it("finds the words three titles share, without stop words, the keyphrase or each site's name", () => {
    // "online" and "planning" are in two titles only. Almanac, GrowVeg, Smart Gardener, Gardener's
    // Supply, The Spruce, Seedtime, Better Homes & Gardens (bhg.com), Burpee and UMN Extension are
    // each the result's own site.
    expect(facts?.sharedWords).toEqual([
      { word: "free", count: 4 },
      { word: "plan", count: 3 },
    ]);
  });

  it("leaves out the site name a site's own titles repeat", () => {
    const same = results([
      ["How to Start a Seed Bed | The Spruce", "thespruce.com"],
      ["What to Plant in Spring | The Spruce", "thespruce.com"],
      ["Spring Planting Guide for Your Garden | The Spruce", "thespruce.com"],
      ["The Spruce vs Almanac: Which Spring Guide?", "reddit.com"],
    ]);
    expect(serpTitleFacts(same, "seed bed")?.sharedWords).toEqual([
      { word: "spring", count: 3 },
    ]);
  });

  it("keeps a year three titles share, but no other number", () => {
    const years = results([
      ["10 Best Garden Planners for 2026", "a.com"],
      ["Garden Planner Reviews 2026: How to Choose", "b.com"],
      ["10 Free Garden Planner Apps (2026)", "c.com"],
      ["10 Garden Planner Tips for Your Plot", "d.com"],
    ]);
    expect(serpTitleFacts(years, "garden planner")?.sharedWords).toEqual([
      { word: "2026", count: 3 },
    ]);
  });

  it("reads the keyphrase in Japanese and Thai, but says no shared word", () => {
    const japanese = serpTitleFacts(
      results([
        ["家庭菜園の始め方：初心者向けガイド", "a.jp"],
        ["初心者でも簡単な家庭菜園アプリ", "b.jp"],
        ["プランターで野菜を育てる方法", "c.jp"],
      ]),
      "家庭菜園",
    );
    expect(japanese?.keyphrase).toEqual({ uses: [1, 2], leads: [1] });
    expect(japanese?.sharedWords).toBeNull();

    const thai = serpTitleFacts(
      results([
        ["ปลูกผักในบ้าน ง่ายๆ สำหรับมือใหม่", "a.co.th"],
        ["วิธีปลูกผักสวนครัว", "b.co.th"],
        ["ผักสวนครัว 10 ชนิด", "c.co.th"],
      ]),
      "ปลูกผัก",
    );
    expect(thai?.keyphrase).toEqual({ uses: [1, 2], leads: [1] });
    expect(thai?.sharedWords).toBeNull();
  });

  it("says no shared word for a language without the English stop-word list", () => {
    const spanish = results([
      ["Planificador de huerto gratis: cómo organizar tu huerto", "a.es"],
      ["Cómo planificar un huerto en casa, paso a paso", "b.es"],
      ["Planificador de huerto online y gratis", "c.es"],
    ]);
    expect(
      serpTitleFacts(spanish, "planificador de huerto")?.sharedWords,
    ).toBeNull();
  });

  it("reads a result the gate sent without a position or a domain", () => {
    const bare = serpTitleFacts(
      [
        { title: "Garden Layouts for Small Plots" },
        { title: "Vegetable Garden Planner for Your Beds" },
      ] as SerpResult[],
      KEYPHRASE,
    );
    expect(bare?.keyphrase).toEqual({ uses: [2], leads: [2] });
    expect(bare?.sharedWords).toEqual([]);
  });

  it("has nothing to say about an empty top ten, and no keyword fact without a keyphrase", () => {
    expect(serpTitleFacts([], KEYPHRASE)).toBeNull();
    const none = serpTitleFacts(TOP_TEN, null);
    expect(none?.keyphrase).toBeNull();
    expect(none?.length.limit).toBe(59);
  });
});

describe("measureTitle", () => {
  it("measures a title as the score does, with the score's limit", () => {
    // The score measures by width (task 637): an emoji is two, and a Chinese, Japanese or Korean
    // title is counted in its own characters against its own range.
    const cases: [string, string][] = [
      ...TOP_TEN.map((result): [string, string] => [result.title, KEYPHRASE]),
      ["🌱 Vegetable Garden Planner: Plan Beds, Spacing and Dates", KEYPHRASE],
      ["家庭菜園の始め方：初心者向けガイド", "家庭菜園"],
      [
        "家庭菜園の始め方：初心者向けガイドと育てやすい野菜の選び方をくわしく解説します",
        "家庭菜園",
      ],
      ["ปลูกผักในบ้าน ง่ายๆ สำหรับมือใหม่", "ปลูกผัก"],
    ];
    for (const [title, keyphrase] of cases) {
      const { length, cutOff } = measureTitle(title, keyphrase);
      const check = scoreTitle(title, keyphrase).checks.find(
        (c) => c.id === "length",
      );
      expect(check?.label).toMatch(new RegExp(`^${length} characters`));
      expect(cutOff).toBe(check?.label.includes("over") ?? false);
    }
  });

  it("counts a wide character as the score does, and past the limit of the title's own script", () => {
    expect(
      measureTitle(
        "🌱 Vegetable Garden Planner: Plan Beds, Spacing and Dates",
        KEYPHRASE,
      ).length,
    ).toBe(57);
    // 39 Japanese characters: 78 widths, past the 60 a results page shows.
    expect(
      measureTitle(
        "家庭菜園の始め方：初心者向けガイドと育てやすい野菜の選び方をくわしく解説します",
        "家庭菜園",
      ),
    ).toEqual({ length: 39, cutOff: true });
  });

  it("gives the limit in the reader's characters, as the score's own check says it", () => {
    const japanese = serpTitleFacts(
      [{ title: "家庭菜園の始め方：初心者向けガイド" }] as SerpResult[],
      "家庭菜園",
    );
    expect(japanese?.length).toEqual({ typical: 17, limit: 30, over: 0 });
  });

  it("takes the limit from the titles' own script when no keyphrase says which", () => {
    const japanese = serpTitleFacts(
      [
        { title: "家庭菜園の始め方：初心者向けガイド" },
        {
          title:
            "家庭菜園の始め方：初心者向けガイドと育てやすい野菜の選び方をくわしく解説します",
        },
      ] as SerpResult[],
      null,
    );
    // The long one is past 30 of its own characters, and the panel says 30, not the Latin 59.
    expect(japanese?.length).toMatchObject({ limit: 30, over: 1 });

    const thai = serpTitleFacts(
      [{ title: "ปลูกผักในบ้าน ง่ายๆ สำหรับมือใหม่" }] as SerpResult[],
      null,
    );
    expect(thai?.length.limit).toBe(55);
  });
});

describe("comparePick", () => {
  const facts = serpTitleFacts(TOP_TEN, KEYPHRASE);
  if (!facts) throw new Error("the top ten has facts");

  it.each([
    [
      "Vegetable Garden Planner: Plan Beds, Spacing and Dates",
      "Leads with the keyword, like positions 1, 2 and 9",
    ],
    [
      "Free Vegetable Garden Planner With Printable Bed Layouts",
      "Has the keyword after other words, like positions 3 and 7",
    ],
    [
      "Plan Your Vegetable Garden: Beds, Spacing and Timing",
      "Leaves out the keyword, which positions 1, 2, 3, 7 and 9 use",
    ],
  ])("%s", (title, sentence) => {
    expect(comparePick(title, facts, KEYPHRASE)).toBe(sentence);
  });

  it("says when none of the top ten do it, and nothing without a keyphrase", () => {
    const plain = serpTitleFacts(
      results([["Garden Layouts for Small Plots", "a.com"]]),
      KEYPHRASE,
    );
    if (!plain) throw new Error("one result has facts");
    expect(
      comparePick("Vegetable Garden Planner for Beds", plain, KEYPHRASE),
    ).toBe("Leads with the keyword, which none of the top ten do");
    expect(comparePick("A Simple Planner", plain, KEYPHRASE)).toBe(
      "Leaves out the keyword, like all of the top ten",
    );
    expect(comparePick("Anything", facts, null)).toBeNull();
  });

  it("names positions in words", () => {
    expect(positionsInWords([3])).toBe("position 3");
    expect(positionsInWords([1, 2, 9])).toBe("positions 1, 2 and 9");
  });
});
