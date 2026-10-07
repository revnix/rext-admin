import {
  containsKeyphrase,
  normalizeTitle,
  scoreTitle,
  titleFamily,
  titleMaxChars,
  titleRange,
  titleWidth,
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

// The backend matches a keyphrase in any script (G69b): NFC, lowercase, punctuation flattened,
// letters, marks and digits kept, and scripts without spaces matched as a run of characters.
describe("containsKeyphrase in any script, as the backend's", () => {
  const nfd = (text: string) => text.normalize("NFD");

  it.each([
    ["Recette de crème brûlée facile", "crème brûlée", true],
    ["Recette de crème brûlée facile", nfd("crème brûlée"), true],
    [nfd("Recette de crème brûlée facile"), "crème brûlée", true],
    ["Recette de creme brulee facile", "crème brûlée", false],
    ["ЛУЧШИЕ программы для небольших команд", "лучшие программы", true],
    ["أفضل برامج إدارة المشاريع للفرق الصغيرة", "برامج إدارة المشاريع", true],
    ["أفضل برامجنا لهذا العام", "برامج", false],
    ["हिन्दी में सबसे अच्छा सॉफ्टवेयर", "हिन्दी", true],
    ["2026年最佳项目管理软件推荐", "项目管理软件", true],
    ["2026年最佳项目管理推荐", "项目管理软件", false],
    [
      "小規模チーム向けのプロジェクト管理ツール比較",
      "プロジェクト管理ツール",
      true,
    ],
    ["ﾌﾟﾛｼﾞｪｸﾄﾂｰﾙ比較", "ﾌﾟﾛｼﾞｪｸﾄﾂｰﾙ", true],
    ["AIツール比較", "AIツール", true],
    ["XAIツール比較", "AIツール", false],
    ["项目管理 software 推荐", "项目管理 software", true],
    ["项目管理 softwarex", "项目管理 software", false],
    ["最佳seo工具推荐", "seo", true],
    ["Maße und Gewichte", "Masse", false],
    ["MASSE UND GEWICHTE", "masse", true],
    // Turkish: a capital dotted İ is an i; the dotless ı is a letter of its own.
    ["İstanbul'da En İyi SEO Ajansları", "istanbul", true],
    ["ISTANBUL İÇİN SEO REHBERİ", "İstanbul", true],
    ["ıstanbul için seo", "istanbul", false],
    // Greek: a capital Σ at a word's end lowercases to ς, which the user types as σ.
    ["ΟΔΗΓΟΣ SEO ΓΙΑ ΜΙΚΡΕΣ ΕΠΙΧΕΙΡΗΣΕΙΣ", "οδηγοσ seo", true],
    ["Οδηγός SEO για μικρές επιχειρήσεις", "οδηγός seo", true],
    // An invisible format character inside a word is no word break.
    ["How to cooperate effectively in small teams", "co\u00adoperate", true],
    ["हिन्दी में सबसे अच्छा सॉफ्टवेयर", "हिन्\u200dदी", true],
    // An emoji's variation selector goes with the emoji: one emoji doesn't match another.
    ["\u2600\ufe0f weather guide for travellers", "\u2764\ufe0f", false],
    // Punctuation between unspaced characters is no word break, either way round.
    ["生成AI・ツール比較", "生成AIツール", true],
    ["生成AIツール比較", "生成AI・ツール", true],
    // Armenian: the ligature և is եւ, as its capital ԵՒ lowercases.
    ["ՍՈՒՐՃ ԵՒ ԹԵՅ ԳՆԵԼՈՒ ՈՒՂԵՑՈՒՅՑ", "սուրճ և թեյ", true],
    // The iteration mark 々 is part of a Japanese word.
    ["人々2026年ガイド", "人々", true],
    // A letter and accent that lowercasing leaves apart are still the one letter.
    ["J\u030c guide for beginners", "\u01f0", true],
    // CJK ideographs beyond the first plane (Extension B on) are unspaced too.
    ["𠀀𠀁𠀂", "𠀁", true],
    ["2026年𠮷野家の店舗", "𠮷野家", true],
  ])("%s / %s → %s", (title, keyphrase, expected) => {
    expect(containsKeyphrase(title, keyphrase)).toBe(expected);
  });

  it("shows an Arabic keyword's title as having it", () => {
    const keyphrase = "برامج إدارة المشاريع";
    const title = "أفضل برامج إدارة المشاريع للفرق الصغيرة: دليل شامل للاختيار"; // 59
    const score = scoreTitle(title, keyphrase);

    expect(score.checks[0]).toEqual({
      id: "keyphrase",
      met: true,
      label: `Has “${keyphrase}”`,
    });
    expect(score.checks[1]).toMatchObject({ id: "length", met: true });
  });

  it("counts characters as the backend does, not UTF-16 units", () => {
    const deseret = "𐐷".repeat(40); // 40 characters outside the Basic Multilingual Plane
    expect(deseret.length).toBe(80);
    expect(titleMaxChars(deseret)).toBe(60);
  });

  it("measures an accented keyphrase the same however it was typed", () => {
    const keyphrase = "café crème brûlée recipes for beginners at home";
    expect(titleMaxChars(nfd(keyphrase))).toBe(titleMaxChars(keyphrase));
    expect(titleMaxChars(keyphrase)).toBe(67);
  });
});

// The backend's `title_width` (Python 3.11, Unicode 14.0.0) at the edges of every wide range
// in title-score.ts and just outside them, by width; regenerate with the table.
const PYTHON_WIDTHS: [number, string][] = [
  [
    2,
    `
1100 115f 231a 231b 2329 232a 23e9 23ec 23f0 23f3 25fd 25fe 2614 2615 2648 2653 267f 2693
26a1 26aa 26ab 26bd 26be 26c4 26c5 26ce 26d4 26ea 26f2 26f3 26f5 26fa 26fd 2705 270a 270b
2728 274c 274e 2753 2755 2757 2795 2797 27b0 27bf 2b1b 2b1c 2b50 2b55 2e80 303e 3041 3247
3250 4dbf 4e00 a4c6 a960 a97c ac00 d7a3 f900 fad9 fe10 fe19 fe30 fe6b ff01 ff60 ffe0 ffe6
16fe0 1b2fb 1f004 1f0cf 1f18e 1f191 1f19a 1f200 1f320 1f32d 1f335 1f337 1f37c 1f37e 1f393
1f3a0 1f3ca 1f3cf 1f3d3 1f3e0 1f3f0 1f3f4 1f3f8 1f43e 1f440 1f442 1f4fc 1f4ff 1f53d 1f54b
1f54e 1f550 1f567 1f57a 1f595 1f596 1f5a4 1f5fb 1f64f 1f680 1f6c5 1f6cc 1f6d0 1f6d2 1f6d5
1f6df 1f6eb 1f6ec 1f6f4 1f6fc 1f7e0 1f7f0 1f90c 1f93a 1f93c 1f945 1f947 1f9ff 1fa70 1faf6
20000 3134a
`,
  ],
  [
    1,
    `
10ff 1160 2319 231c 2328 232b 23e8 23ed 23ef 23f1 23f2 23f4 25fc 25ff 2613 2616 2647 2654
267e 2680 2692 2694 26a0 26a2 26a9 26ac 26bc 26bf 26c3 26c6 26cd 26cf 26d3 26d5 26e9 26eb
26f1 26f4 26f6 26f9 26fb 26fc 26fe 2704 2706 2709 270c 2727 2729 274b 274d 274f 2752 2756
2758 2794 2798 27af 27b1 27be 27c0 2b1a 2b1d 2b4f 2b51 2b54 2b56 303f 3248 324f 4dc0 4dff
a95f f8ff ff61 1f003 1f005 1f0ce 1f18d 1f18f 1f190 1f19b 1f1ff 1f321 1f32c 1f336 1f37d 1f394
1f39f 1f3cb 1f3ce 1f3d4 1f3df 1f3f1 1f3f3 1f3f5 1f3f7 1f43f 1f441 1f4fd 1f4fe 1f53e 1f54a
1f54f 1f568 1f579 1f57b 1f594 1f597 1f5a3 1f5a5 1f5fa 1f650 1f67f 1f6c6 1f6cb 1f6cd 1f6cf
1f6d3 1f6d4 1f6e0 1f6ea 1f6f3 1f90b 1f93b 1f946 1fa00
`,
  ],
  [
    0,
    `
fe0f fe2f
`,
  ],
];

describe("a title's width and its script's range, as the backend's (G69c)", () => {
  it("counts emoji and every other wide character as the backend's Python does", () => {
    expect(titleWidth("🚀")).toBe(2);
    expect(titleWidth("⌚")).toBe(2);
    expect(titleWidth("⚽")).toBe(2);
    expect(titleWidth(`${"a".repeat(58)}🚀`)).toBe(60);
    // CJK Extension H (Unicode 15), unassigned in the backend's Unicode 14, which reads it as F
    expect(titleWidth(String.fromCodePoint(0x31350))).toBe(2);
    for (const [width, codes] of PYTHON_WIDTHS) {
      for (const code of codes.trim().split(/\s+/)) {
        const char = String.fromCodePoint(Number.parseInt(code, 16));
        expect([code, titleWidth(char)]).toEqual([code, width]);
      }
    }
  });

  it("measures Latin by length, a wide character as two, a mark as none", () => {
    expect(titleWidth("SEO Agencies for Small Businesses")).toBe(33);
    expect(titleWidth("项目管理软件")).toBe(12);
    expect(titleWidth("プロジェクト")).toBe(12);
    expect(titleWidth("หิน")).toBe(2);
    expect(titleWidth("co\u00adoperate")).toBe(9);
  });

  it("reads each title's family from its own letters", () => {
    expect(titleFamily("最佳seo工具推荐")).toBe("cjk");
    expect(titleFamily("소규모 팀을 위한 프로젝트 관리 도구 추천")).toBe("cjk");
    expect(
      titleFamily("How to Make Onigiri (おにぎり) at Home for Beginners"),
    ).toBe("narrow");
    expect(titleFamily("โปรแกรมจัดการโครงการที่ดีที่สุด")).toBe("thai");
  });

  it("gives each family its range, with room for a long keyphrase", () => {
    expect(titleRange("", "项目管理软件")).toEqual([40, 60]);
    expect(titleRange("", "项".repeat(25))).toEqual([40, 64]);
    expect(titleRange("", "seo agencies")).toEqual([50, 59]);
    expect(titleMaxChars("seo agencies")).toBe(59);
  });

  it("scores a natural Chinese title's length in Chinese characters", () => {
    const score = scoreTitle(
      "2026年最佳项目管理软件推荐：小团队如何选择合适的工具",
      "项目管理软件",
    );
    const length = score.checks.find((check) => check.id === "length");
    expect(length?.met).toBe(true);
    expect(length?.label).toBe("26 characters");
  });

  it("says a short Chinese title is under 20 characters", () => {
    const length = scoreTitle("项目管理软件推荐", "项目管理软件").checks.find(
      (check) => check.id === "length",
    );
    expect(length?.met).toBe(false);
    expect(length?.label).toBe("8 characters, under 20");
  });
});
