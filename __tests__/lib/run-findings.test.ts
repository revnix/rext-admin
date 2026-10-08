/**
 * What a run found, read from its stream (rext-control#694): the reducer over the backend's updates
 * (the shapes are rext-backend's: fetch_serp, normalize_serp, extract_competitor, the keyword metrics,
 * the content subgraph), the title model's text as it is written, a thread's saved state, and the
 * lines each stage shows. Only what was sent shows: a part whose count is zero is left out, and a
 * line whose data never came is not written.
 */

import {
  countryName,
  describeRun,
  EMPTY_FINDINGS,
  type FindingsEvent,
  type RunFindings,
  type RunView,
  readTitleDrafts,
  reduceFindings,
} from "@/lib/generate-content/run-findings";
import {
  type RunPhase,
  type RunStage,
  type RunStageState,
  type RunTitleRow,
  RUN_PHASES,
} from "@/lib/generate-content/run-stages";

const KEYWORD = "vegetable garden planner";

/** The findings after these events, in order. */
const reduced = (
  events: FindingsEvent[],
  from: RunFindings = EMPTY_FINDINGS,
): RunFindings => events.reduce(reduceFindings, from);

const update = (node: string, data: unknown): FindingsEvent => ({
  type: "update",
  node,
  data,
});

/** A phase's stages in the given states, in order. */
const stagesIn = (phase: RunPhase, states: RunStageState[]): RunStage[] =>
  RUN_PHASES[phase].map((def, index) => ({
    id: def.id,
    label: def.label,
    state: states[index] ?? "pending",
  }));

const view = (
  phase: RunPhase,
  states: RunStageState[],
  findings: RunFindings,
  context: Parameters<typeof describeRun>[2] = {
    keyword: KEYWORD,
    country: "us",
  },
): RunView =>
  describeRun({ phase, stages: stagesIn(phase, states) }, findings, context);

// ── The backend's updates ────────────────────────────────────────────────────

const SITES = [
  "almanac.com",
  "gardeners.com",
  "growveg.com",
  "smartgardener.com",
  "reddit.com",
  "burpee.com",
  "seedtime.us",
  "thespruce.com",
];

/** Ten results from eight sites: the first two sites hold two places each. */
const ORGANIC = [
  "almanac.com",
  "gardeners.com",
  "growveg.com",
  "almanac.com",
  "smartgardener.com",
  "reddit.com",
  "gardeners.com",
  "burpee.com",
  "seedtime.us",
  "thespruce.com",
].map((site, index) => ({
  position: index + 1,
  title: `Result ${index + 1} on ${site}`,
  link: `https://www.${site}/page-${index + 1}`,
  domain: `www.${site}`,
  snippet: "…",
}));

const QUESTIONS = [
  "How do I plan a vegetable garden layout?",
  "What vegetables grow well together?",
  "When should I start planting?",
  "How big should a first garden be?",
  "Is there a free garden planner?",
  "How far apart should rows be?",
];

const FETCH_SERP = {
  serp_result: {
    search_params: { location_name: "United States" },
    organic_results: ORGANIC,
    // One entry per answer: the first question has two answers.
    people_ask: [QUESTIONS[0], ...QUESTIONS].map((question) => ({
      question,
      snippet: "…",
    })),
    related_searches: Array.from(
      { length: 8 },
      (_, index) => `related search ${index + 1}`,
    ),
    total_results: 10,
    serp_status: "ok",
  },
};

const NORMALIZED = {
  query: KEYWORD,
  normalize_results: ORGANIC.map((result) => ({
    position: result.position,
    title: result.title,
    url: result.link,
    domain: result.domain.replace("www.", ""),
  })),
  related_topics: FETCH_SERP.serp_result.related_searches,
  questions: FETCH_SERP.serp_result.people_ask.map((entry) => entry.question),
  // A Python set: in no order.
  domains: [...SITES].reverse(),
  domain_stats: { unique_domains: 8, top_domains: SITES.slice(0, 5) },
};

const NORMALIZE_SERP = { serp_normalized: NORMALIZED };

const competitor = (site: string, positions: number[], intent: string) => ({
  domain: site,
  top_positions: positions,
  total_occurrences: positions.length,
  intent_distribution: {
    INFORMATIONAL: 0,
    COMMERCIAL: 0,
    NAVIGATIONAL: 0,
    TRANSACTIONAL: 0,
    [intent]: 1,
  },
  is_brand: false,
});

const EXTRACT_COMPETITOR = {
  competitors: [
    competitor("almanac.com", [1, 4], "INFORMATIONAL"),
    competitor("gardeners.com", [2, 7], "TRANSACTIONAL"),
    competitor("growveg.com", [3], "INFORMATIONAL"),
    competitor("smartgardener.com", [5], "COMMERCIAL"),
    competitor("reddit.com", [6], "INFORMATIONAL"),
    competitor("burpee.com", [8], "TRANSACTIONAL"),
    competitor("seedtime.us", [9], "INFORMATIONAL"),
    competitor("thespruce.com", [10], "INFORMATIONAL"),
  ],
  final_intent_type: "INFORMATIONAL",
  serp_normalized: {
    ...NORMALIZED,
    intent_matched_signals: {
      primary_intent: "INFORMATIONAL",
      matched_domains: [
        "almanac.com",
        "growveg.com",
        "reddit.com",
        "seedtime.us",
        "thespruce.com",
      ],
    },
  },
  seo_result: { intent_type: "INFORMATIONAL" },
};

const backlinks = (numbers: Record<string, unknown>) => ({
  seo_result: {
    serp_backlinks: {
      keyword: KEYWORD,
      search_volume: 1900,
      volume_status: "ok",
      keyword_difficulty: 28,
      backlinks: 412,
      referring_domains: 96,
      main_intent: "informational",
      ...numbers,
    },
  },
});

const SAVED = { seo_result: { keyword_research_key: "library_x_2026" } };

/** The analysis as the stream sends it, node by node. */
const ANALYSIS: FindingsEvent[] = [
  update("fetch_serp", FETCH_SERP),
  update("normalize_serp", NORMALIZE_SERP),
  update("extract_competitor", EXTRACT_COMPETITOR),
  update("fetch_dataforseo_backlinks", backlinks({})),
  update("save_keyword_research", SAVED),
];

const ANALYSED = reduced(ANALYSIS);

describe("reduceFindings: the keyword analysis", () => {
  it("keeps the first page as the results pane takes it, in rank order", () => {
    const { results } = reduced([update("fetch_serp", FETCH_SERP)]);
    expect(results).toHaveLength(10);
    expect(results?.[0]).toEqual({
      position: 1,
      title: "Result 1 on almanac.com",
      domain: "almanac.com",
      url: "https://www.almanac.com/page-1",
    });
  });

  it("counts a question once however many answers it has, and what the title step will read", () => {
    const found = reduced([update("fetch_serp", FETCH_SERP)]);
    expect(found.questions).toEqual(QUESTIONS);
    expect(found.relatedSearches).toHaveLength(8);
    // The title prompt reads the first eight entries of each list: seven answers hold six questions.
    expect(found.titleSources).toEqual({ relatedSearches: 8, questions: 6 });
  });

  it("caps what the title step reads at eight of each", () => {
    const found = reduced([
      update("fetch_serp", {
        serp_result: {
          organic_results: ORGANIC,
          people_ask: Array.from({ length: 12 }, (_, index) => ({
            question: `Question ${index + 1}?`,
          })),
          related_searches: Array.from(
            { length: 11 },
            (_, index) => `related ${index + 1}`,
          ),
        },
      }),
    ]);
    expect(found.questions).toHaveLength(12);
    expect(found.relatedSearches).toHaveLength(11);
    expect(found.titleSources).toEqual({ relatedSearches: 8, questions: 8 });
  });

  it("names the sites in rank order, once each, with the backend's count", () => {
    const found = reduced(ANALYSIS.slice(0, 2));
    expect(found.sites).toEqual(SITES);
    expect(found.siteCount).toBe(8);
  });

  it("has the sites from the results' addresses until the normalised search arrives", () => {
    expect(reduced([update("fetch_serp", FETCH_SERP)]).sites).toEqual(SITES);
  });

  it("keeps each competing site with its best place, what its page is for and whether that matches", () => {
    expect(ANALYSED.intent).toBe("informational");
    expect(ANALYSED.competitors).toHaveLength(8);
    expect(ANALYSED.competitors?.[0]).toEqual({
      site: "almanac.com",
      position: 1,
      intent: "informational",
      matchesIntent: true,
    });
    expect(ANALYSED.competitors?.[1]).toEqual({
      site: "gardeners.com",
      position: 2,
      intent: "transactional",
      matchesIntent: false,
    });
  });

  it("gives no intent when the classification failed, and doesn't say which sites match", () => {
    const found = reduced([
      update("extract_competitor", {
        competitors: [
          {
            domain: "almanac.com",
            top_positions: [1],
            intent_distribution: {
              INFORMATIONAL: 0,
              COMMERCIAL: 0,
              NAVIGATIONAL: 0,
              TRANSACTIONAL: 0,
            },
          },
        ],
        final_intent_type: "UNKNOWN",
        serp_normalized: NORMALIZED,
      }),
    ]);
    expect(found.intent).toBeUndefined();
    expect(found.competitors).toEqual([
      { site: "almanac.com", position: 1, intent: null, matchesIntent: null },
    ]);
  });

  it("keeps the keyword's numbers as the keyword card takes them", () => {
    expect(ANALYSED.metrics).toEqual({
      difficulty: 28,
      volume: 1900,
      volumeStatus: "ok",
      backlinks: 412,
      referringDomains: 96,
    });
    expect(ANALYSED.saved).toBe(true);
  });

  it("says the research was not saved when the backend kept no key", () => {
    const found = reduced([
      update("save_keyword_research", {
        seo_result: { keyword_research_key: null },
      }),
    ]);
    expect(found.saved).toBe(false);
  });

  it("reads a subgraph's own update for its own steps only", () => {
    // serp_engine's update repeats its whole state: on a second analysis that still holds the
    // first keyword's numbers, which only the metrics step replaces.
    const found = reduced([
      update("serp_engine", {
        ...FETCH_SERP,
        ...EXTRACT_COMPETITOR,
        seo_result: {
          ...backlinks({ search_volume: 5 }).seo_result,
          ...SAVED.seo_result,
        },
      }),
    ]);
    expect(found.results).toHaveLength(10);
    expect(found.competitors).toHaveLength(8);
    expect(found.metrics).toBeUndefined();
    expect(found.saved).toBeUndefined();
  });

  it("reads the keyword numbers from the seo subgraph's own update", () => {
    const found = reduced([
      update("seo_engine", {
        ...FETCH_SERP,
        seo_result: { ...backlinks({}).seo_result, ...SAVED.seo_result },
      }),
    ]);
    expect(found.metrics?.volume).toBe(1900);
    expect(found.saved).toBe(true);
    expect(found.results).toBeUndefined();
  });

  it.each([
    ["a node it doesn't read", update("keyword_recommendation", FETCH_SERP)],
    ["an update that is no object", update("fetch_serp", null)],
    ["a list", update("fetch_serp", [FETCH_SERP])],
  ])("changes nothing for %s", (_name, event) => {
    expect(reduceFindings(ANALYSED, event)).toBe(ANALYSED);
  });

  it("keeps what it has when an update lacks the field", () => {
    const found = reduceFindings(ANALYSED, update("fetch_serp", {}));
    expect(found).toEqual(ANALYSED);
  });

  it("drops results without a title and reads partial rows", () => {
    const found = reduced([
      update("fetch_serp", {
        serp_result: {
          organic_results: [
            { title: "", link: "https://a.example/" },
            { title: "Only a title" },
            "not a result",
            { position: "3", title: "A string place", domain: "www.b.example" },
          ],
          people_ask: null,
        },
      }),
    ]);
    expect(found.results).toEqual([
      { position: 2, title: "Only a title", domain: "" },
      { position: 3, title: "A string place", domain: "b.example" },
    ]);
    expect(found.questions).toEqual([]);
    expect(found.relatedSearches).toEqual([]);
    expect(found.sites).toEqual(["b.example"]);
  });
});

describe("reduceFindings: the content steps", () => {
  it("reads the suggested content type and the one chosen", () => {
    const found = reduced([
      update("recommend_content_type", {
        content: {
          content_type_pick: {
            recommended_content_type: "how-to-guide",
            recommendation_reason: "People want steps.",
          },
        },
      }),
      update("content_type", { content: { content_type: "checklist" } }),
    ]);
    expect(found.suggestedContentType).toBe("how-to-guide");
    expect(found.contentType).toBe("checklist");
  });

  it("has no suggestion when the backend made none", () => {
    const found = reduced([
      update("recommend_content_type", {
        content: {
          content_type_pick: {
            recommended_content_type: null,
            recommendation_reason: null,
          },
        },
      }),
    ]);
    expect(found.suggestedContentType).toBeUndefined();
  });

  it("reads a request for new titles with its note, and one without", () => {
    const noted = reduced([
      update("topic_generation", {
        content: { topic_regenerate: "  shorter, with numbers " },
      }),
    ]);
    expect(noted.regenerationNote).toBe("shorter, with numbers");
    const plain = reduced([
      update("topic_generation", { content: { topic_regenerate: "" } }),
    ]);
    expect(plain.regenerationNote).toBe("");
    // The model step clears the request in the state: that is not a new one.
    expect(
      reduceFindings(
        noted,
        update("generate_topics", { content: { topic_regenerate: null } }),
      ).regenerationNote,
    ).toBe("shorter, with numbers");
  });

  it("reads the checked titles and the keyphrase they were held to", () => {
    const found = reduced([
      update("generate_topics", {
        content: {
          topic_set: {
            topics: ["One title", "Another title"],
            recommended_topic: "One title",
            focus_keyphrase: KEYWORD,
          },
        },
      }),
    ]);
    expect(found.finalTitles).toEqual(["One title", "Another title"]);
    expect(found.focusKeyphrase).toBe(KEYWORD);
  });

  it("reads the title chosen, the keyword groups and the outline", () => {
    const found = reduced([
      update("topic_generation", {
        content: { topics: ["A"], selected_topic: "The chosen title" },
      }),
      update("keyword_clustering", {
        seo_result: {
          keyword_clusters: [
            {
              cluster_name: "garden bed layout",
              topic_theme: "bed layout",
              keywords: [{ keyword: "a" }, { keyword: "b" }, { keyword: "c" }],
            },
            // No theme: the head keyword names the group.
            { cluster_name: "planting dates", keywords: [{ keyword: "d" }] },
          ],
        },
      }),
      update("generate_outline", {
        content: {
          outline: {
            title: "The chosen title",
            structure: { sections: [{}, {}, {}, {}, {}, {}, {}] },
            target_word_count: 1800,
          },
        },
      }),
    ]);
    expect(found.selectedTitle).toBe("The chosen title");
    expect(found.groups).toEqual([
      { name: "bed layout", phrases: 3 },
      { name: "planting dates", phrases: 1 },
    ]);
    expect(found.outline).toEqual({ sections: 7, words: 1800 });
  });

  it("counts an outline's sections where its type keeps them, or not at all", () => {
    const outline = (data: unknown) =>
      reduced([update("generate_outline", { content: { outline: data } })])
        .outline;
    expect(outline({ sections: [{}, {}] })).toEqual({
      sections: 2,
      words: null,
    });
    expect(outline({ content_structure: { sections: [{}] } })?.sections).toBe(
      1,
    );
    expect(outline({ questions: [{}, {}] })).toEqual({
      sections: null,
      words: null,
    });
  });

  it("keeps the article's searches, each started once and ended with its count", () => {
    const found = reduced([
      {
        type: "custom",
        data: { type: "tool_start", id: "a", query: "bed spacing" },
      },
      {
        type: "custom",
        data: { type: "tool_start", id: "a", query: "bed spacing" },
      },
      { type: "custom", data: { type: "tool_start", id: "b", query: "frost" } },
      { type: "custom", data: { type: "tool_end", id: "a", count: 8 } },
    ]);
    expect(found.searches).toEqual([
      { id: "a", query: "bed spacing", done: true, results: 8 },
      { id: "b", query: "frost", done: false },
    ]);
  });

  it.each([
    ["an article token", { type: "token", content: "The" }],
    ["an end without its start", { type: "tool_end", id: "z", count: 1 }],
    ["an event with no id", { type: "tool_start", query: "x" }],
    ["no object", "tool_start"],
  ])("changes nothing for %s", (_name, data) => {
    expect(reduceFindings(ANALYSED, { type: "custom", data })).toBe(ANALYSED);
  });
});

// ── The title model's text ───────────────────────────────────────────────────

const draft = (
  title: string,
  recommended = false,
  reason: string | null = null,
) =>
  `{"title":${JSON.stringify(title)},"recommended":${recommended},"recommendation_reason":${JSON.stringify(reason)}}`;

const TITLES = [
  "Vegetable Garden Planner: Map Your Beds in One Afternoon",
  "How to Use a Vegetable Garden Planner in Your First Season",
  "Vegetable Garden Planner Ideas for Small Yards and Patios",
  "Free Vegetable Garden Planner Templates for Raised Beds",
  "Vegetable Garden Planner Mistakes Every Beginner Can Avoid",
];

const TITLE_JSON = `{"topics":[${[
  draft(TITLES[0]),
  draft(TITLES[1], true, "It answers what most searchers ask first."),
  draft(TITLES[2]),
  draft(TITLES[3]),
  draft(TITLES[4]),
].join(",")}]}`;

describe("readTitleDrafts", () => {
  it("has nothing before the first title begins", () => {
    expect(readTitleDrafts("")).toEqual({ drafts: [], closed: false });
    expect(readTitleDrafts('{"topics":[')).toEqual({
      drafts: [],
      closed: false,
    });
  });

  it("has a title being written, cut where the text ends", () => {
    const cut = TITLE_JSON.indexOf("Templates") + "Templates".length;
    const { drafts, closed } = readTitleDrafts(TITLE_JSON.slice(0, cut));
    expect(closed).toBe(false);
    expect(drafts).toHaveLength(4);
    expect(drafts.slice(0, 3).every((item) => item.complete)).toBe(true);
    expect(drafts[3]).toEqual({
      title: "Free Vegetable Garden Planner Templates",
      complete: false,
      recommended: false,
      reason: null,
    });
  });

  it("has a title's object once it opens, before its text", () => {
    const { drafts } = readTitleDrafts('{"topics":[{"tit');
    expect(drafts).toEqual([
      { title: "", complete: false, recommended: false, reason: null },
    ]);
  });

  it("reads the recommended title and its reason once they are written", () => {
    const upToFlag = TITLE_JSON.slice(
      0,
      TITLE_JSON.indexOf('"recommended":true') + '"recommended":tr'.length,
    );
    expect(readTitleDrafts(upToFlag).drafts[1].recommended).toBe(false);
    const { drafts, closed } = readTitleDrafts(TITLE_JSON);
    expect(closed).toBe(true);
    expect(drafts.map((item) => item.title)).toEqual(TITLES);
    expect(drafts.map((item) => item.recommended)).toEqual([
      false,
      true,
      false,
      false,
      false,
    ]);
    expect(drafts[1].reason).toBe("It answers what most searchers ask first.");
    expect(drafts[0].reason).toBeNull();
  });

  it("is the same at every cut of the text: titles only ever grow", () => {
    let written = 0;
    for (let end = 1; end <= TITLE_JSON.length; end += 1) {
      const { drafts, closed } = readTitleDrafts(TITLE_JSON.slice(0, end));
      const complete = drafts.filter((item) => item.complete).length;
      expect(complete).toBeGreaterThanOrEqual(written);
      written = complete;
      expect(closed).toBe(end === TITLE_JSON.length);
    }
    expect(written).toBe(5);
  });

  it("reads only the first document: a repair is a second call to the same model", () => {
    const repair = `{"topics":[${draft("A rewritten title that the checks asked for, 52 chars")}]}`;
    const { drafts, closed } = readTitleDrafts(TITLE_JSON + repair);
    expect(closed).toBe(true);
    expect(drafts.map((item) => item.title)).toEqual(TITLES);
  });

  it("reads quotes, escapes and a cut escape inside a title", () => {
    const { drafts } = readTitleDrafts(
      '{"topics":[{"title":"The \\"Best\\" Planner: caf\\u00e9 & more"},{"title":"Cut \\u00e',
    );
    expect(drafts[0].title).toBe('The "Best" Planner: café & more');
    expect(drafts[0].complete).toBe(true);
    expect(drafts[1]).toMatchObject({ title: "Cut", complete: false });
  });

  it("reads braces and commas inside a title as text", () => {
    const { drafts, closed } = readTitleDrafts(
      '{"topics":[{"title":"Plan {beds}, rows], and paths","recommended":false}]}',
    );
    expect(closed).toBe(true);
    expect(drafts).toEqual([
      {
        title: "Plan {beds}, rows], and paths",
        complete: true,
        recommended: false,
        reason: null,
      },
    ]);
  });

  it("skips what comes before the JSON, and spaces inside it", () => {
    const { drafts, closed } = readTitleDrafts(
      '```json\n{ "topics" : [ { "title" : "A title" , "recommended" : true } ] }',
    );
    expect(closed).toBe(true);
    expect(drafts).toEqual([
      { title: "A title", complete: true, recommended: true, reason: null },
    ]);
  });

  it("tidies a title as the backend does: spaces and quotes around it", () => {
    const { drafts } = readTitleDrafts(
      '{"topics":[{"title":"  \\"Spaced   out title\\"  "}]}',
    );
    expect(drafts[0].title).toBe("Spaced out title");
  });

  it("has no titles for a document of another shape", () => {
    expect(readTitleDrafts('{"error":"none"}')).toEqual({
      drafts: [],
      closed: true,
    });
  });
});

describe("reduceFindings: streamed text", () => {
  const text = (node: string, streamed: string): FindingsEvent => ({
    type: "text",
    node,
    text: streamed,
  });

  it("keeps the same findings while a token changes nothing on screen", () => {
    const opened = reduceFindings(
      EMPTY_FINDINGS,
      text("generate_topics", '{"topics":[{"title":"Vegetable'),
    );
    expect(opened.drafts).toHaveLength(1);
    // The space a title ends on is trimmed: nothing to draw.
    expect(
      reduceFindings(
        opened,
        text("generate_topics", '{"topics":[{"title":"Vegetable '),
      ),
    ).toBe(opened);
    // The repair's text, after the first document closed.
    const closed = reduceFindings(
      EMPTY_FINDINGS,
      text("generate_topics", TITLE_JSON),
    );
    expect(closed.draftsDone).toBe(true);
    expect(
      reduceFindings(closed, text("generate_topics", `${TITLE_JSON}{"top`)),
    ).toBe(closed);
  });

  it("reads the outline's headings as they are written", () => {
    const first = reduceFindings(
      EMPTY_FINDINGS,
      text(
        "generate_outline",
        '{"structure":{"sections":[{"heading":"Pick your beds","description":"Why',
      ),
    );
    expect(first.headings).toEqual(["Pick your beds"]);
    expect(
      reduceFindings(
        first,
        text(
          "generate_outline",
          '{"structure":{"sections":[{"heading":"Pick your beds","description":"Why it',
        ),
      ),
    ).toBe(first);
    expect(
      reduceFindings(
        first,
        text(
          "generate_outline",
          '{"structure":{"sections":[{"heading":"Pick your beds"},{"heading":"Map the rows"},{"heading":"Half a head',
        ),
      ).headings,
    ).toEqual(["Pick your beds", "Map the rows"]);
  });

  it("reads no other model's text", () => {
    expect(
      reduceFindings(ANALYSED, text("extract_competitor", TITLE_JSON)),
    ).toBe(ANALYSED);
  });
});

// ── A phase's start, and a saved state ───────────────────────────────────────

describe("reduceFindings: a phase starting", () => {
  const all = reduced(
    [
      update("recommend_content_type", {
        content: {
          content_type_pick: { recommended_content_type: "how-to-guide" },
        },
      }),
      update("content_type", { content: { content_type: "how-to-guide" } }),
      { type: "text", node: "generate_topics", text: TITLE_JSON },
      update("generate_topics", {
        content: { topic_set: { topics: TITLES, focus_keyphrase: KEYWORD } },
      }),
      update("topic_generation", { content: { selected_topic: TITLES[0] } }),
      update("keyword_clustering", {
        seo_result: {
          keyword_clusters: [{ cluster_name: "a", keywords: [{}] }],
        },
      }),
      {
        type: "text",
        node: "generate_outline",
        text: '{"sections":[{"heading":"One"}]}',
      },
    ],
    ANALYSED,
  );

  it("clears everything for a new analysis", () => {
    expect(reduceFindings(all, { type: "phase", phase: "analysis" })).toEqual(
      {},
    );
  });

  it("clears the titles for new ones, and keeps what they are written from", () => {
    const next = reduceFindings(all, { type: "phase", phase: "titles" });
    expect(next.drafts).toBeUndefined();
    expect(next.draftsDone).toBeUndefined();
    expect(next.finalTitles).toBeUndefined();
    expect(next.regenerationNote).toBeUndefined();
    expect(next.results).toHaveLength(10);
    expect(next.titleSources).toEqual({ relatedSearches: 8, questions: 6 });
    expect(next.contentType).toBe("how-to-guide");
    expect(next.focusKeyphrase).toBe(KEYWORD);
  });

  it("clears the outline's own findings, and the suggestion for a new content type", () => {
    const outline = reduceFindings(all, { type: "phase", phase: "outline" });
    expect(outline.selectedTitle).toBeUndefined();
    expect(outline.groups).toBeUndefined();
    expect(outline.headings).toBeUndefined();
    expect(outline.finalTitles).toEqual(TITLES);
    expect(
      reduceFindings(all, { type: "phase", phase: "content-type" })
        .suggestedContentType,
    ).toBeUndefined();
  });

  it("leaves the caller's findings as they were", () => {
    const before = JSON.stringify(all);
    reduceFindings(all, { type: "phase", phase: "titles" });
    reduceFindings(all, update("fetch_serp", FETCH_SERP));
    expect(JSON.stringify(all)).toBe(before);
    expect(EMPTY_FINDINGS).toEqual({});
  });
});

describe("reduceFindings: a thread's saved state", () => {
  /** The state a first analysis left, with a later pass's content. */
  const VALUES = {
    serp_payload: { query: KEYWORD, country: "us" },
    ...FETCH_SERP,
    ...EXTRACT_COMPETITOR,
    seo_result: {
      ...backlinks({}).seo_result,
      ...SAVED.seo_result,
      keyword_clusters: [{ topic_theme: "bed layout", keywords: [{}, {}] }],
    },
    content: {
      content_type_pick: { recommended_content_type: "how-to-guide" },
      content_type: "how-to-guide",
      topic_set: { topics: TITLES, focus_keyphrase: KEYWORD },
      topic_regenerate: null,
      selected_topic: TITLES[1],
      outline: { sections: [{}, {}], target_word_count: 900 },
    },
  };

  const seed = (
    state: unknown,
    at?: { phase: RunPhase; id: string },
  ): RunFindings => reduceFindings(ANALYSED, { type: "seed", state, at });

  it("reads everything for a run paused at a gate", () => {
    const found = seed({ values: VALUES, next: ["content_engine"] });
    expect(found.results).toHaveLength(10);
    expect(found.competitors).toHaveLength(8);
    expect(found.metrics?.volume).toBe(1900);
    expect(found.saved).toBe(true);
    expect(found.suggestedContentType).toBe("how-to-guide");
    expect(found.finalTitles).toEqual(TITLES);
    expect(found.selectedTitle).toBe(TITLES[1]);
    expect(found.groups).toEqual([{ name: "bed layout", phrases: 2 }]);
    expect(found.outline).toEqual({ sections: 2, words: 900 });
    expect(found.regenerationNote).toBeUndefined();
  });

  it("reads only what the stages before the running one wrote", () => {
    // A second analysis: the state still holds the first one's competitors and numbers.
    const found = seed(
      { values: VALUES },
      { phase: "analysis", id: "competitors" },
    );
    expect(found.results).toHaveLength(10);
    expect(found.sites).toEqual(SITES);
    expect(found.competitors).toBeUndefined();
    expect(found.intent).toBeUndefined();
    expect(found.metrics).toBeUndefined();
    expect(found.saved).toBeUndefined();
    expect(found.finalTitles).toBeUndefined();
  });

  it("reads only the keyword and country of an analysis that has just begun", () => {
    expect(
      seed({ values: VALUES }, { phase: "analysis", id: "search-results" }),
    ).toEqual({ searched: { keyword: KEYWORD, country: "us" } });
  });

  it("reads the keyword being analysed, then the one chosen at the keyword step", () => {
    const values = {
      ...VALUES,
      serp_payload: { query: "garden planner", country: "fr" },
      "Primary Keyword": KEYWORD,
    };
    // A second analysis, of a new keyword: the one chosen before is not it.
    expect(
      seed({ values }, { phase: "analysis", id: "competitors" }).searched,
    ).toEqual({ keyword: "garden planner", country: "fr" });
    expect(
      seed({ values }, { phase: "titles", id: "titles" }).searched,
    ).toEqual({ keyword: KEYWORD, country: "fr" });
    expect(seed({ values }).searched).toEqual({
      keyword: KEYWORD,
      country: "fr",
    });
    expect(
      seed({ values: { serp_payload: { query: "tea" } } }).searched,
    ).toEqual({ keyword: "tea", country: null });
  });

  it("reads the earlier steps and a request for new titles, not the titles being replaced", () => {
    const found = seed(
      {
        values: {
          ...VALUES,
          content: { ...VALUES.content, topic_regenerate: "more specific" },
        },
      },
      { phase: "titles", id: "titles" },
    );
    expect(found.metrics?.difficulty).toBe(28);
    expect(found.contentType).toBe("how-to-guide");
    expect(found.regenerationNote).toBe("more specific");
    expect(found.finalTitles).toBeUndefined();
    expect(found.selectedTitle).toBeUndefined();
  });

  it("reads the groups once they are made, and not the outline being written", () => {
    const found = seed({ values: VALUES }, { phase: "outline", id: "outline" });
    expect(found.selectedTitle).toBe(TITLES[1]);
    expect(found.groups).toHaveLength(1);
    expect(found.outline).toBeUndefined();
    expect(
      seed({ values: VALUES }, { phase: "outline", id: "keyword-groups" })
        .groups,
    ).toBeUndefined();
  });

  it("reads a running subgraph's own values over its parent's", () => {
    // The parent has not yet been handed the search the subgraph has just made.
    const found = seed(
      {
        values: { serp_payload: VALUES.serp_payload },
        tasks: [
          {
            name: "serp_engine",
            state: {
              values: { ...FETCH_SERP, ...NORMALIZE_SERP },
              tasks: [{ name: "extract_competitor" }],
            },
          },
        ],
      },
      { phase: "analysis", id: "competitors" },
    );
    expect(found.results).toHaveLength(10);
    expect(found.siteCount).toBe(8);
  });

  it("drops what the page held for another thread", () => {
    expect(seed({ values: {} })).toEqual({});
    expect(seed(undefined)).toEqual({});
  });
});

// ── The lines on screen ──────────────────────────────────────────────────────

describe("describeRun: the keyword analysis", () => {
  it("says what it is analysing, where, and that the page can be left", () => {
    const shown = view("analysis", ["active"], EMPTY_FINDINGS);
    expect(shown.header).toEqual({
      title: "Analysing “vegetable garden planner”",
      subtitle: "Google · United States",
      startedAt: undefined,
    });
    expect(shown.footer).toBe(
      "You can leave this page. The analysis keeps going, and we’ll tell you when it’s ready.",
    );
  });

  it("says what each stage does while it waits and while it runs", () => {
    const { details } = view("analysis", ["active"], EMPTY_FINDINGS);
    expect(details["search-results"].live).toBe(
      "Looking up Google’s first page for “vegetable garden planner” in the United States.",
    );
    // One request: nothing is found until it returns.
    expect(details["search-results"].result).toBeUndefined();
    expect(details["search-results"].items).toBeUndefined();
    expect(details.competitors.waiting).toBe(
      "What each site on the first page offers.",
    );
    expect(details.measure.waiting).toBe(
      "Monthly searches, how hard it is to rank, and the links behind the top pages.",
    );
    expect(details.measure.live).toBe(
      "Looking up monthly searches, difficulty and links for the United States.",
    );
  });

  it("says what the search found, and keeps the results under it", () => {
    const { details } = view(
      "analysis",
      ["complete", "active"],
      reduced(ANALYSIS.slice(0, 2)),
    );
    expect(details["search-results"].result).toBe(
      "10 results from 8 sites · 6 questions people ask · 8 related searches",
    );
    expect(details["search-results"].items).toEqual({
      kind: "results",
      preview: 3,
      items: ORGANIC.map((result) => ({
        position: result.position,
        title: result.title,
        site: result.domain.replace("www.", ""),
      })),
    });
  });

  it("names the sites while the one call works them all out, and not after", () => {
    const found = reduced(ANALYSIS.slice(0, 2));
    const running = view("analysis", ["complete", "active"], found).details
      .competitors;
    expect(running.live).toBe(
      "Working out what each of the 8 sites offers: a guide to learn from, a tool, or a shop.",
    );
    expect(running.items).toEqual({ kind: "chips", items: SITES });
    expect(
      view("analysis", ["complete", "complete", "active"], ANALYSED).details
        .competitors.items,
    ).toBeUndefined();
    expect(
      view("analysis", ["active"], found).details.competitors.items,
    ).toBeUndefined();
  });

  it("says what searchers want and how many sites match it", () => {
    expect(
      view("analysis", ["complete", "complete", "active"], ANALYSED).details
        .competitors.result,
    ).toBe(
      "8 competing sites · searchers want to learn · 5 of the 8 match that",
    );
  });

  it("says the keyword's numbers and that it was saved, without the links", () => {
    const line = view(
      "analysis",
      ["complete", "complete", "complete"],
      ANALYSED,
    ).details.measure.result;
    expect(line).toBe(
      "1,900 searches a month · difficulty 28 of 100 (Medium) · saved to Keywords",
    );
    expect(line).not.toMatch(/412|96|link|domain/i);
  });

  it.each([
    [
      "one of each",
      {
        results: [{ position: 1, title: "One", domain: "a.example" }],
        siteCount: 1,
        questions: ["Why?"],
        relatedSearches: ["one more"],
      },
      "1 result from 1 site · 1 question people ask · 1 related search",
    ],
    [
      "no questions and no related searches",
      {
        results: ORGANIC.slice(0, 2).map((result) => ({
          position: result.position,
          title: result.title,
          domain: "a.example",
        })),
        siteCount: 1,
        questions: [],
        relatedSearches: [],
      },
      "2 results from 1 site",
    ],
    [
      "no count of sites yet",
      {
        results: [{ position: 1, title: "One", domain: "a.example" }],
        relatedSearches: ["a", "b"],
      },
      "1 result · 2 related searches",
    ],
    [
      "no results",
      { results: [], questions: [], relatedSearches: [] },
      undefined,
    ],
  ] as [string, RunFindings, string | undefined][])(
    "writes the search's line for %s",
    (_name, findings, line) => {
      expect(
        view("analysis", ["complete"], findings).details["search-results"]
          .result,
      ).toBe(line);
    },
  );

  const site = (
    name: string,
    matchesIntent: boolean | null,
  ): NonNullable<RunFindings["competitors"]>[number] => ({
    site: name,
    position: 1,
    intent: "commercial",
    matchesIntent,
  });

  it.each([
    [
      "every site matching",
      {
        competitors: [site("a", true), site("b", true)],
        intent: "commercial",
      },
      "2 competing sites · searchers want to compare options · all 2 match that",
    ],
    [
      "one site, which matches",
      { competitors: [site("a", true)], intent: "transactional" },
      "1 competing site · searchers want to buy · it matches that",
    ],
    [
      "no site matching",
      {
        competitors: [site("a", false), site("b", false)],
        intent: "navigational",
      },
      "2 competing sites · searchers want to find a brand",
    ],
    [
      "no word on which match",
      {
        competitors: [site("a", null), site("b", null)],
        intent: "informational",
      },
      "2 competing sites · searchers want to learn",
    ],
    [
      "no intent",
      { competitors: [site("a", null), site("b", null), site("c", null)] },
      "3 competing sites",
    ],
    ["no sites", { competitors: [], intent: "informational" }, undefined],
    ["nothing yet", {}, undefined],
  ] as [string, RunFindings, string | undefined][])(
    "writes the competitors' line for %s",
    (_name, findings, line) => {
      expect(
        view("analysis", ["complete", "complete"], findings).details.competitors
          .result,
      ).toBe(line);
    },
  );

  const measured = (numbers: Record<string, unknown>, saved?: unknown) =>
    view(
      "analysis",
      ["complete", "complete", "complete"],
      reduced([
        update("fetch_dataforseo_backlinks", backlinks(numbers)),
        ...(saved === undefined
          ? []
          : [
              update("save_keyword_research", {
                seo_result: { keyword_research_key: saved },
              }),
            ]),
      ]),
    ).details.measure.result;

  it.each([
    [
      "a keyword nobody has a figure for",
      { search_volume: null, volume_status: "no_data" },
      "No monthly search figure for this keyword · difficulty 28 of 100 (Medium)",
    ],
    [
      "a missing volume with no status (an older backend)",
      { search_volume: undefined, volume_status: undefined },
      "No monthly search figure for this keyword · difficulty 28 of 100 (Medium)",
    ],
    [
      "a volume of zero",
      { search_volume: 0 },
      "No monthly search figure for this keyword · difficulty 28 of 100 (Medium)",
    ],
    [
      "one search a month",
      { search_volume: 1, keyword_difficulty: 4 },
      "1 search a month · difficulty 4 of 100 (Easy)",
    ],
    [
      "a hard keyword",
      { search_volume: 12400, keyword_difficulty: 71 },
      "12,400 searches a month · difficulty 71 of 100 (Very hard)",
    ],
    [
      "a measured difficulty of zero",
      { keyword_difficulty: 0 },
      "1,900 searches a month · difficulty 0 of 100 (Easy)",
    ],
    [
      "an empty lookup, whose zero difficulty was never measured",
      { search_volume: null, volume_status: "no_data", keyword_difficulty: 0 },
      "No monthly search figure for this keyword",
    ],
    [
      "a failed lookup",
      {
        search_volume: null,
        volume_status: "lookup_failed",
        keyword_difficulty: 0,
      },
      "Monthly searches couldn’t be looked up",
    ],
    [
      "a lookup the credits didn't cover",
      {
        search_volume: null,
        volume_status: "insufficient_credits",
        keyword_difficulty: 0,
      },
      "Not enough credits to measure the keyword",
    ],
  ])("writes the numbers' line for %s", (_name, numbers, line) => {
    expect(measured(numbers)).toBe(line);
  });

  it("says saved only when it was", () => {
    expect(measured({}, "library_key")).toBe(
      "1,900 searches a month · difficulty 28 of 100 (Medium) · saved to Keywords",
    );
    expect(measured({}, null)).toBe(
      "1,900 searches a month · difficulty 28 of 100 (Medium)",
    );
    expect(
      view("analysis", ["complete", "complete", "complete"], { saved: true })
        .details.measure.result,
    ).toBe("saved to Keywords");
    expect(
      view("analysis", ["complete", "complete", "complete"], {}).details.measure
        .result,
    ).toBeUndefined();
  });

  it("counts the sites it is working out in words that fit one, some or an unknown number", () => {
    const live = (findings: RunFindings) =>
      view("analysis", ["complete", "active"], findings).details.competitors
        .live;
    expect(live({ siteCount: 1, sites: ["a.example"] })).toBe(
      "Working out what the one site on the first page offers: a guide to learn from, a tool, or a shop.",
    );
    expect(live({})).toBe(
      "Working out what each site on the first page offers: a guide to learn from, a tool, or a shop.",
    );
    expect(live({ sites: ["a.example", "b.example"] })).toBe(
      "Working out what each of the 2 sites offers: a guide to learn from, a tool, or a shop.",
    );
  });

  it("names the country the search runs in", () => {
    const shown = (country: string | null) =>
      view("analysis", ["active"], EMPTY_FINDINGS, { keyword: "tea", country });
    expect(shown("fr").header?.subtitle).toBe("Google · France");
    expect(shown("fr").details["search-results"].live).toBe(
      "Looking up Google’s first page for “tea” in France.",
    );
    expect(shown("GB").header?.subtitle).toBe("Google · United Kingdom");
    expect(shown("gb").details.measure.live).toBe(
      "Looking up monthly searches, difficulty and links for the United Kingdom.",
    );
    // The backend looks a global search up in the United States.
    expect(shown("global").header?.subtitle).toBe("Google · United States");
    expect(shown(null).header?.subtitle).toBe("Google · United States");
    expect(countryName("nl")).toBe("Netherlands");
    expect(countryName("not a code")).toBe("not a code");
  });

  it("says the thread's own keyword and country for a run picked up mid-way", () => {
    // After a reload the form holds no keyword, and the country it starts with.
    const shown = view(
      "analysis",
      ["active"],
      { searched: { keyword: "thé vert", country: "fr" } },
      { keyword: "", country: "us" },
    );
    expect(shown.header?.title).toBe("Analysing “thé vert”");
    expect(shown.header?.subtitle).toBe("Google · France");
    // A thread that kept no country: the form's.
    expect(
      view(
        "analysis",
        ["active"],
        { searched: { keyword: "tea", country: null } },
        { country: "gb" },
      ).header?.subtitle,
    ).toBe("Google · United Kingdom");
  });

  it("does without a keyword it was not given", () => {
    const shown = view("analysis", ["active"], EMPTY_FINDINGS, {});
    expect(shown.header?.title).toBe("Analysing the keyword");
    expect(shown.details["search-results"].live).toBe(
      "Looking up Google’s first page in the United States.",
    );
  });

  it("runs the clock from the start of a run it watched, not of one picked up mid-way", () => {
    const stages = stagesIn("analysis", ["active"]);
    stages[0].startedAt = 5000;
    expect(
      describeRun({ phase: "analysis", stages, learn: true }, EMPTY_FINDINGS)
        .header?.startedAt,
    ).toBe(5000);
    expect(
      describeRun({ phase: "analysis", stages, learn: false }, EMPTY_FINDINGS)
        .header?.startedAt,
    ).toBeUndefined();
  });
});

describe("describeRun: the content type", () => {
  it("says what it compares, then what it suggests, in the type's name", () => {
    const running = view("content-type", ["active"], ANALYSED);
    expect(running.header?.title).toBe(
      "Choosing a content type for “vegetable garden planner”",
    );
    expect(running.header?.subtitle).toBe("For readers who want to learn");
    expect(running.details["content-type"].live).toBe(
      "Comparing what kind of pages rank for “vegetable garden planner”.",
    );
    expect(running.details["content-type"].result).toBeUndefined();
    expect(
      view("content-type", ["complete"], {
        suggestedContentType: "how-to-guide",
      }).details["content-type"].result,
    ).toBe("Suggested: How-to guide");
  });

  it("uses the intent the user picked over the analysis's", () => {
    expect(
      view("content-type", ["active"], ANALYSED, {
        keyword: KEYWORD,
        intent: ["commercial", "informational"],
      }).header?.subtitle,
    ).toBe("For readers who want to compare options");
    expect(
      view("content-type", ["active"], EMPTY_FINDINGS).header?.subtitle,
    ).toBeUndefined();
  });
});

describe("describeRun: the titles", () => {
  const typed = (streamed: string, from: RunFindings = ANALYSED) =>
    reduceFindings(from, {
      type: "text",
      node: "generate_topics",
      text: streamed,
    });
  const CONTEXT = {
    keyword: KEYWORD,
    country: "us",
    contentType: "how-to-guide",
  };
  const cutAfter = (words: string) =>
    TITLE_JSON.slice(0, TITLE_JSON.indexOf(words) + words.length);

  it("says what it writes titles for, and for whom", () => {
    const shown = view("titles", ["active"], ANALYSED, CONTEXT);
    expect(shown.header?.title).toBe(
      "Writing titles for “vegetable garden planner”",
    );
    expect(shown.header?.subtitle).toBe(
      "How-to guide · for readers who want to learn",
    );
    expect(shown.footer).toBe(
      "You can leave this page. The titles keep coming, and we’ll tell you when they’re ready.",
    );
  });

  it("says a regeneration is one, with the user's note when they left one", () => {
    const noted = view(
      "titles",
      ["active"],
      { ...ANALYSED, regenerationNote: "shorter, with numbers" },
      CONTEXT,
    );
    expect(noted.header?.title).toBe("Writing five new titles");
    expect(noted.header?.subtitle).toBe(
      "Using your note: “shorter, with numbers”",
    );
    expect(
      view("titles", ["active"], { ...ANALYSED, regenerationNote: "" }, CONTEXT)
        .header?.subtitle,
    ).toBe("How-to guide · for readers who want to learn");
  });

  it("counts the titles written and says what they are written from", () => {
    const { titles } = view(
      "titles",
      ["active"],
      typed(cutAfter("Templates")),
      CONTEXT,
    ).details;
    expect(titles.live).toBe(
      "3 of 5 written, from 8 related searches and 6 questions people ask.",
    );
    expect(titles.progress).toEqual({
      done: 3,
      total: 5,
      label: "titles written",
    });
  });

  it("leaves out a source the search didn't have", () => {
    const live = (findings: RunFindings) =>
      view("titles", ["active"], findings, CONTEXT).details.titles.live;
    expect(live({})).toBe("0 of 5 written.");
    expect(live({ titleSources: { relatedSearches: 0, questions: 1 } })).toBe(
      "0 of 5 written, from 1 question people ask.",
    );
    expect(live({ titleSources: { relatedSearches: 1, questions: 0 } })).toBe(
      "0 of 5 written, from 1 related search.",
    );
  });

  it("has a row per title: its checks once written, the one being written, the ones to come", () => {
    const { items } = view(
      "titles",
      ["active"],
      typed(cutAfter("Templates")),
      CONTEXT,
    ).details.titles;
    expect(items?.kind).toBe("titles");
    const rows: RunTitleRow[] = items?.kind === "titles" ? items.rows : [];
    expect(rows.map((row) => row.state)).toEqual([
      "written",
      "written",
      "written",
      "writing",
      "next",
    ]);
    expect(rows[0]).toEqual({
      title: TITLES[0],
      state: "written",
      checks: [
        { label: "Has the keyword", met: true },
        { label: "56 characters", met: true },
      ],
    });
    expect(rows[1]).toMatchObject({
      recommended: true,
      reason: "It answers what most searchers ask first.",
    });
    expect(rows[3]).toEqual({
      title: "Free Vegetable Garden Planner Templates",
      state: "writing",
      checks: [],
    });
    expect(rows[4]).toEqual({
      title: "Fifth title",
      state: "next",
      checks: [],
    });
  });

  it("has no rows before the first title begins", () => {
    expect(
      view("titles", ["active"], ANALYSED, CONTEXT).details.titles.items,
    ).toBeUndefined();
  });

  it("says a title's failed check in words, and that it is being rewritten", () => {
    const long =
      "Vegetable Garden Planner Tips for a Bigger Harvest All Year Round";
    const found = typed(
      `{"topics":[${draft(TITLES[0])},${draft(long)},${draft(TITLES[2])}]}`,
    );
    const { details } = view("titles", ["complete", "active"], found, CONTEXT);
    const rows: RunTitleRow[] =
      details.titles.items?.kind === "titles" ? details.titles.items.rows : [];
    expect(rows[1].checks).toEqual([
      { label: "Has the keyword", met: true },
      { label: "65 characters, over 59", met: false },
    ]);
    expect(details["title-checks"].live).toBe(
      "Checking each title holds “vegetable garden planner” and runs 50 to 59 characters. Rewriting 1 title that ran to 65 characters.",
    );
    // The model wrote three and closed: no rows are still to come.
    expect(rows).toHaveLength(3);
    expect(details.titles.result).toBe("3 titles written");
  });

  it("says which check failed when it is the keyword, and counts several", () => {
    const checking = (titles: string[]) =>
      view(
        "titles",
        ["complete", "active"],
        typed(`{"topics":[${titles.map((title) => draft(title)).join(",")}]}`),
        CONTEXT,
      ).details["title-checks"].live;
    const noKeyword = "A Garden Planner for Vegetables That Maps Every Bed";
    expect(checking([TITLES[0], noKeyword])).toBe(
      "Checking each title holds “vegetable garden planner” and runs 50 to 59 characters. Rewriting 1 title that left out “vegetable garden planner”.",
    );
    expect(checking([noKeyword, "Too short", TITLES[0]])).toBe(
      "Checking each title holds “vegetable garden planner” and runs 50 to 59 characters. Rewriting 2 titles that don’t pass.",
    );
    expect(checking(TITLES)).toBe(
      "Checking each title holds “vegetable garden planner” and runs 50 to 59 characters.",
    );
  });

  it("says what the checks will do while they wait, with the room a long keyword gets", () => {
    expect(
      view("titles", ["active"], ANALYSED, CONTEXT).details["title-checks"]
        .waiting,
    ).toBe(
      "Each one must contain “vegetable garden planner” and run 50 to 59 characters. Any that don’t are rewritten.",
    );
    const long = "how to plan a raised bed vegetable garden for beginners";
    expect(
      view("titles", ["active"], EMPTY_FINDINGS, { keyword: long }).details[
        "title-checks"
      ].waiting,
    ).toBe(
      `Each one must contain “${long}” and run 50 to 75 characters. Any that don’t are rewritten.`,
    );
    expect(
      view("titles", ["active"], EMPTY_FINDINGS, {}).details["title-checks"]
        .waiting,
    ).toBe(
      "Each one must run 50 to 59 characters. Any that don’t are rewritten.",
    );
  });

  const checked = (finals: string[], drafts: string[] | null = TITLES) =>
    view(
      "titles",
      ["complete", "complete"],
      reduceFindings(
        drafts
          ? typed(
              `{"topics":[${drafts.map((title) => draft(title)).join(",")}]}`,
            )
          : ANALYSED,
        update("generate_topics", {
          content: { topic_set: { topics: finals, focus_keyphrase: KEYWORD } },
        }),
      ),
      CONTEXT,
    ).details;

  it.each([
    ["every title as written", TITLES, TITLES, "All 5 pass"],
    [
      "one rewritten",
      [
        ...TITLES.slice(0, 4),
        "Vegetable Garden Planner Mistakes Beginners Can Avoid",
      ],
      TITLES,
      "All 5 pass · 1 rewritten to fit",
    ],
    [
      "one that could not be fixed",
      TITLES.slice(0, 4),
      TITLES,
      "4 pass · 1 left out",
    ],
    [
      "one rewritten and one left out",
      [
        ...TITLES.slice(0, 3),
        "Vegetable Garden Planner Templates for Raised Beds, Free",
      ],
      TITLES,
      "4 pass · 1 rewritten to fit · 1 left out",
    ],
    [
      "only the keyword left as a title",
      ["Vegetable Garden Planner"],
      TITLES,
      "1 passes · 1 rewritten to fit · 4 left out",
    ],
    [
      "one title written and kept",
      [TITLES[0]],
      [TITLES[0]],
      "The title passes",
    ],
    ["titles whose text never streamed", TITLES, null, "All 5 pass"],
  ] as [string, string[], string[] | null, string][])(
    "writes the checks' line for %s",
    (_name, finals, drafts, line) => {
      expect(checked(finals, drafts)["title-checks"].result).toBe(line);
    },
  );

  it("has no checks' line when no checked set came (a regeneration that failed)", () => {
    expect(
      view("titles", ["complete", "complete"], typed(TITLE_JSON), CONTEXT)
        .details["title-checks"].result,
    ).toBeUndefined();
  });

  it("shows the checked titles together when their text never streamed", () => {
    const { titles } = checked(TITLES, null);
    const rows: RunTitleRow[] =
      titles.items?.kind === "titles" ? titles.items.rows : [];
    expect(rows.map((row) => row.title)).toEqual(TITLES);
    expect(rows.every((row) => row.state === "written")).toBe(true);
    expect(titles.result).toBe("5 titles written");
    expect(titles.progress).toEqual({
      done: 5,
      total: 5,
      label: "titles written",
    });
  });

  it("holds the titles to the keyphrase the backend names, once it has", () => {
    const { details } = view(
      "titles",
      ["complete", "active"],
      {
        ...typed(TITLE_JSON, EMPTY_FINDINGS),
        focusKeyphrase: "garden planner",
      },
      { keyword: "the planner" },
    );
    expect(details["title-checks"].live).toBe(
      "Checking each title holds “garden planner” and runs 50 to 59 characters.",
    );
  });
});

describe("describeRun: the outline", () => {
  const CONTEXT = { keyword: KEYWORD, contentType: "how-to-guide" };

  it("says what it outlines, by the title chosen", () => {
    const shown = view(
      "outline",
      ["active"],
      { selectedTitle: TITLES[1] },
      CONTEXT,
    );
    expect(shown.header?.title).toBe(`Outlining “${TITLES[1]}”`);
    expect(shown.header?.subtitle).toBe("How-to guide");
    expect(view("outline", ["active"], {}, {}).header).toEqual({
      title: "Outlining the article",
      subtitle: undefined,
      startedAt: undefined,
    });
  });

  it.each([
    [
      "several groups",
      [
        { name: "bed layout", phrases: 8 },
        { name: "planting dates", phrases: 6 },
        { name: "spacing", phrases: 5 },
        { name: "small spaces", phrases: 4 },
        { name: "planner tools", phrases: 3 },
      ],
      "26 phrases in 5 groups: bed layout, planting dates, spacing, small spaces, planner tools.",
    ],
    [
      "one group of one phrase",
      [{ name: "bed layout", phrases: 1 }],
      "1 phrase in 1 group: bed layout.",
    ],
    [
      "more groups than it names",
      Array.from({ length: 7 }, (_, index) => ({
        name: `group ${index + 1}`,
        phrases: 200,
      })),
      "1,400 phrases in 7 groups: group 1, group 2, group 3, group 4, group 5 and 2 more.",
    ],
    [
      "groups with no names",
      [
        { name: "", phrases: 2 },
        { name: "", phrases: 2 },
      ],
      "4 phrases in 2 groups.",
    ],
    [
      "groups with no phrases counted",
      [{ name: "bed layout", phrases: 0 }],
      "1 group: bed layout.",
    ],
    ["no groups", [], undefined],
  ] as [string, RunFindings["groups"], string | undefined][])(
    "writes the groups' line for %s",
    (_name, groups, line) => {
      expect(
        view("outline", ["complete", "active"], { groups }, CONTEXT).details[
          "keyword-groups"
        ].result,
      ).toBe(line);
    },
  );

  it("lists the headings as they are written, and counts them", () => {
    const { details } = view(
      "outline",
      ["complete", "active"],
      { headings: ["Pick your beds", "Map the rows"] },
      CONTEXT,
    );
    expect(details["keyword-groups"].live).toBe(
      "Pulling phrases from the pages that match your reader, then grouping them by topic.",
    );
    expect(details.outline.live).toBe("Writing the sections: 2 so far.");
    expect(details.outline.items).toEqual({
      kind: "lines",
      items: ["Pick your beds", "Map the rows"],
    });
    const waiting = view("outline", ["active"], {}, CONTEXT).details.outline;
    expect(waiting.waiting).toBe("The sections, written one by one.");
    expect(waiting.live).toBe("Writing the sections.");
    expect(waiting.items).toBeUndefined();
  });

  it.each([
    [
      "the written outline",
      { outline: { sections: 7, words: 1800 } },
      "7 sections · about 1,800 words",
    ],
    [
      "one section",
      { outline: { sections: 1, words: 300 } },
      "1 section · about 300 words",
    ],
    [
      "an outline whose type counts no sections: the headings it wrote",
      { outline: { sections: null, words: 1200 }, headings: ["a", "b", "c"] },
      "3 sections · about 1,200 words",
    ],
    ["no word count", { outline: { sections: 4, words: null } }, "4 sections"],
    ["nothing", {}, undefined],
  ] as [string, RunFindings, string | undefined][])(
    "writes the outline's line for %s",
    (_name, findings, line) => {
      expect(
        view("outline", ["complete", "complete"], findings, CONTEXT).details
          .outline.result,
      ).toBe(line);
    },
  );
});

describe("describeRun: the article", () => {
  const searching: RunFindings = {
    ...ANALYSED,
    searches: [
      { id: "a", query: "podcast intro statistics", done: true, results: 3 },
      { id: "b", query: "podcast intro examples", done: true, results: 1 },
      { id: "c", query: "podcast hook length", done: false },
    ],
  };

  it("has no header: the page's own bar says the article is being written", () => {
    expect(view("article", ["active"], ANALYSED).header).toBeUndefined();
  });

  it("says how many of the searches are done while Research runs", () => {
    expect(view("article", ["active"], searching).details.research.live).toBe(
      "Searching the web for facts and sources: 2 of 3 searches done.",
    );
    expect(view("article", ["active"], ANALYSED).details.research.live).toBe(
      "Searching the web for facts and sources to cite.",
    );
  });

  it("says what Research read once it is done", () => {
    expect(
      view("article", ["complete", "active"], searching).details.research
        .result,
    ).toBe("3 searches · 4 results read");
    expect(
      view("article", ["complete", "active"], {
        ...ANALYSED,
        searches: [{ id: "a", query: "one", done: true }],
      }).details.research.result,
    ).toBe("1 search");
    expect(
      view("article", ["complete", "active"], ANALYSED).details.research.result,
    ).toBeUndefined();
  });

  it("counts the Draft's sections from the outline as approved, not as first written", () => {
    const edited = view(
      "article",
      ["complete", "active"],
      { ...ANALYSED, outline: { sections: 6, words: 1800 } },
      { keyword: KEYWORD, country: "us", outlineSections: 4 },
    );
    expect(edited.details.draft.live).toBe(
      "Writing the article's 4 sections, in the outline's order.",
    );
    expect(
      view("article", ["complete", "active"], ANALYSED).details.draft.live,
    ).toBe("Writing the article, in the outline's order.");
  });

  it("says in grey what each later stage will do, and what it is doing once it runs", () => {
    const { details, footer } = view("article", ["active"], ANALYSED);
    expect(details.draft.waiting).toBe(
      "The article, written from the outline you approved.",
    );
    expect(details.style.waiting).toBe("A pass over the wording and the flow.");
    expect(details.style.live).toMatch(/smoothing the wording and the flow/);
    expect(details.checks.waiting).toBe("Readability, on-page SEO and trust.");
    expect(details.checks.live).toMatch(/then saving the article/);
    expect(footer).toMatch(/^You can leave this page\./);
  });
});
