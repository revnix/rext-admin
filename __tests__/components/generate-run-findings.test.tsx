/**
 * The Generate page's progress box says what the run found (rext-control#694, option A): the page
 * hands each update and each model token of the run's stream to the run's stages, and the box shows
 * the keyword, the results, the sites, the numbers and the titles as they are written. The stream
 * here is the test's own; the page, the stages and the box are the real ones.
 */

import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { FreshGenerationView } from "@/components/generate-content/fresh-generation-view";

type Chunk = { event: string; data: unknown };
type Run = { url: string; send: (chunk: Chunk) => void; end: () => void };

/** The runs the page has opened, each one a stream the test feeds. */
const mockRuns: Run[] = [];

function mockOpenStream(url: string): AsyncGenerator<Chunk> {
  const queue: Chunk[] = [];
  let wake: (() => void) | undefined;
  let ended = false;
  mockRuns.push({
    url,
    send: (chunk) => {
      queue.push(chunk);
      wake?.();
    },
    end: () => {
      ended = true;
      wake?.();
    },
  });
  return (async function* stream() {
    while (true) {
      const next = queue.shift();
      if (next) {
        yield next;
        continue;
      }
      if (ended) return;
      await new Promise<void>((resolve) => {
        wake = resolve;
      });
    }
  })();
}

jest.mock("@/lib/generate-content/stream-utils", () => ({
  ...jest.requireActual("@/lib/generate-content/stream-utils"),
  createThread: jest.fn(async () => "thread-1"),
  streamFromSSE: (url: string) => mockOpenStream(url),
}));
/** What the status route answers; nothing, until a test says. */
const mockStatus = jest.fn(async (_url: string) => ({
  ok: false,
  status: 500,
  json: async (): Promise<unknown> => ({}),
}));
jest.mock("@/lib/auth-utils", () => ({
  authenticatedFetch: (url: string) => mockStatus(url),
}));
jest.mock("@/hooks/use-auth-session", () => ({
  useAuthSession: () => ({ user: { id: "u1" } }),
}));
jest.mock("@/hooks/use-credit-gate", () => ({
  useCreditGate: () => ({
    ensureCredits: () => true,
    ensureCreditsToContinue: () => true,
    openCreditsModal: jest.fn(),
    creditsModal: null,
  }),
}));
jest.mock("@/stores/workspace/use-workspace-context-store", () => ({
  useCurrentWorkspaceId: () => "w1",
}));
jest.mock("@/providers/workspace-provider", () => ({
  useWorkspace: () => ({ workspaceSlug: "acme" }),
}));
jest.mock("@/stores/subscription-store", () => ({
  useSubscriptionStore: () => ({ patchCredits: jest.fn() }),
}));
jest.mock("@/stores/background-generation-store", () => {
  const state = {
    jobs: [],
    upsertJob: jest.fn(),
    updateJob: jest.fn(),
    removeJob: jest.fn(),
  };
  return {
    useBackgroundGenerationStore: Object.assign(
      (select: (store: typeof state) => unknown) => select(state),
      { getState: () => state },
    ),
  };
});
jest.mock("@/lib/analytics", () => ({ analytics: { track: jest.fn() } }));
jest.mock("sonner", () => ({
  toast: { info: jest.fn(), error: jest.fn(), warning: jest.fn() },
}));
jest.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  motion: {
    div: ({
      children,
      className,
    }: {
      children?: React.ReactNode;
      className?: string;
    }) => <div className={className}>{children}</div>,
  },
}));
jest.mock("@/components/layouts", () => ({
  StepColumn: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// The steps around the waits: each a stand-in with the one control the run needs.
jest.mock("@/components/generate-content/hero", () => ({
  HeroSection: () => null,
}));
jest.mock("@/components/generate-content/recent-keywords", () => ({
  RecentKeywords: () => null,
}));
jest.mock("@/components/generate-content/workflow-step-indicator", () => ({
  WorkflowStepIndicator: () => null,
}));
jest.mock("@/components/generate-content/run-notice", () => ({
  RunNotice: ({ message }: { message: string }) => <p>{message}</p>,
}));
jest.mock("@/components/generate-content/content", () => ({
  ContentEditor: () => null,
}));
jest.mock("@/components/generate-content/outline-review", () => ({
  OutlineReview: () => null,
  OutlineRejectSection: () => null,
}));
jest.mock("@/components/generate-content/keyword", () => ({
  KeywordForm: ({
    userKeyword,
    onKeywordChange,
    onSubmit,
  }: {
    userKeyword: string;
    onKeywordChange: (value: string) => void;
    onSubmit: () => void;
  }) => (
    <>
      <input
        aria-label="Keyword"
        value={userKeyword}
        onChange={(event) => onKeywordChange(event.target.value)}
      />
      <button type="button" onClick={onSubmit}>
        Analyse
      </button>
    </>
  ),
}));
jest.mock("@/components/generate-content/suggestions", () => ({
  SuggestionsSection: ({
    primaryKeyword,
    onSelect,
  }: {
    primaryKeyword: string;
    onSelect: (keyword: string) => void;
  }) => (
    <button type="button" onClick={() => onSelect(primaryKeyword)}>
      Keep the keyword
    </button>
  ),
}));
jest.mock("@/components/generate-content/content-type", () => ({
  __esModule: true,
  default: ({
    contentTypes,
    handleContentTypeSelect,
  }: {
    contentTypes: string[];
    handleContentTypeSelect: (type: string) => void;
  }) => (
    <>
      {contentTypes.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => handleContentTypeSelect(type)}
        >
          Choose {type}
        </button>
      ))}
    </>
  ),
}));
jest.mock("@/components/generate-content/title-step", () => ({
  TitleStep: ({
    titles,
    onContinue,
  }: {
    titles: string[];
    onContinue: (title: string) => void;
  }) => (
    <>
      <ul aria-label="Titles to choose from">
        {titles.map((title) => (
          <li key={title}>{title}</li>
        ))}
      </ul>
      <button type="button" onClick={() => onContinue(titles[0])}>
        Continue with the first title
      </button>
    </>
  ),
}));

const KEYWORD = "vegetable garden planner";

const TITLES = [
  "Vegetable Garden Planner: Map Your Beds in One Afternoon",
  "How to Use a Vegetable Garden Planner in Your First Season",
  "Vegetable Garden Planner Ideas for Small Yards and Patios",
  "Free Vegetable Garden Planner Templates for Raised Beds",
  "Vegetable Garden Planner Mistakes Every Beginner Can Avoid",
];
const TITLE_JSON = JSON.stringify({
  topics: TITLES.map((title, index) => ({
    title,
    recommended: index === 1,
    recommendation_reason:
      index === 1 ? "It answers what most searchers ask first." : null,
  })),
});

/** An `updates` event from inside a subgraph, as the stream names it. */
const update = (data: Record<string, unknown>): Chunk => ({
  event: "updates|content_engine:8f2c",
  data,
});
/** One model token in messages-tuple mode, as the routes pass it on (lean-stream-chunk.ts). */
const token = (text: string, node: string): Chunk => ({
  event: "messages|content_engine:8f2c",
  data: [
    { content: text, id: "m1", type: "AIMessageChunk" },
    { langgraph_node: node },
  ],
});
const gate = (value: Record<string, unknown>): Chunk =>
  update({ __interrupt__: [{ id: "gate", value }] });

/** Feeds the run's stream, and lets the page read it. */
async function send(run: Run, ...chunks: Chunk[]) {
  for (const chunk of chunks) {
    await act(async () => {
      run.send(chunk);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
}

/** The stream closes; the page shows the finished stages for a moment, then the step. */
async function end(run: Run) {
  await act(async () => {
    run.end();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

/** The run the page opened last, once it has. */
async function nextRun(count: number): Promise<Run> {
  await act(async () => {
    for (let tries = 0; tries < 50 && mockRuns.length < count; tries += 1) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  });
  expect(mockRuns).toHaveLength(count);
  return mockRuns[count - 1];
}

/** A stage's row, by its name (the live region says the name too). */
const stage = (name: string): HTMLElement => {
  const row = screen
    .getAllByText(name)
    .map((element) => element.closest<HTMLElement>("li[data-state]"))
    .find((found) => found !== null);
  if (!row) throw new Error(`No stage named ${name}`);
  return row;
};

beforeEach(() => {
  mockRuns.length = 0;
  mockStatus.mockClear();
  window.localStorage.clear();
});

describe("the Generate page's progress box", () => {
  it("says what each wait found, from the run's stream", async () => {
    render(<FreshGenerationView onBack={jest.fn()} />);
    fireEvent.change(screen.getByLabelText("Keyword"), {
      target: { value: KEYWORD },
    });
    fireEvent.click(screen.getByRole("button", { name: "Analyse" }));

    // ── Step 1: the keyword analysis ─────────────────────────────────────────
    const analysis = await nextRun(1);
    expect(analysis.url).toBe("/api/generate/thread-1/stream");
    expect(
      await screen.findByRole("heading", {
        name: "Analysing “vegetable garden planner”",
      }),
    ).toBeVisible();
    expect(screen.getByText("Google · United States")).toBeVisible();
    expect(screen.getByText("usually about 30 s")).toBeVisible();
    expect(stage("Reading the search results")).toHaveTextContent(
      "Looking up Google’s first page for “vegetable garden planner” in the United States.",
    );
    expect(stage("Finding competitors")).toHaveTextContent(
      "What each site on the first page offers.",
    );
    expect(
      screen.getByText(
        "You can leave this page. The analysis keeps going, and we’ll tell you when it’s ready.",
      ),
    ).toBeVisible();

    const organic = [
      "almanac.com",
      "gardeners.com",
      "growveg.com",
      "almanac.com",
    ].map((site, index) => ({
      position: index + 1,
      title: `Result ${index + 1}`,
      link: `https://www.${site}/p${index + 1}`,
    }));
    const normalized = {
      normalize_results: organic.map((result) => ({
        position: result.position,
        domain: new URL(result.link).hostname.replace("www.", ""),
      })),
      domain_stats: { unique_domains: 3 },
    };
    await send(
      analysis,
      {
        event: "run/created",
        data: { run_id: "run-1", thread_id: "thread-1" },
      },
      update({
        fetch_serp: {
          serp_result: {
            organic_results: organic,
            people_ask: [{ question: "How do I plan a garden?" }],
            related_searches: ["garden layout app", "raised bed planner"],
          },
        },
      }),
      update({ normalize_serp: { serp_normalized: normalized } }),
    );
    const read = stage("Reading the search results");
    expect(read).toHaveAttribute("data-state", "complete");
    expect(read).toHaveTextContent(
      "4 results from 3 sites · 1 question people ask · 2 related searches",
    );
    expect(read).toHaveTextContent("Result 3");
    expect(read).not.toHaveTextContent("Result 4");
    fireEvent.click(
      within(read).getByRole("button", { name: "Show all 4 results" }),
    );
    expect(read).toHaveTextContent("Result 4");

    // The one call that works out every site: their names, together.
    const finding = stage("Finding competitors");
    expect(finding).toHaveAttribute("data-state", "active");
    expect(finding).toHaveTextContent(
      "Working out what each of the 3 sites offers: a guide to learn from, a tool, or a shop.",
    );
    expect(
      within(finding)
        .getAllByRole("listitem")
        .map((chip) => chip.textContent),
    ).toEqual(["almanac.com", "gardeners.com", "growveg.com"]);

    await send(
      analysis,
      update({
        extract_competitor: {
          competitors: ["almanac.com", "gardeners.com", "growveg.com"].map(
            (domain, index) => ({ domain, top_positions: [index + 1] }),
          ),
          final_intent_type: "INFORMATIONAL",
          serp_normalized: {
            ...normalized,
            intent_matched_signals: {
              matched_domains: ["almanac.com", "growveg.com"],
            },
          },
        },
      }),
    );
    expect(stage("Finding competitors")).toHaveTextContent(
      "3 competing sites · searchers want to learn · 2 of the 3 match that",
    );
    expect(
      within(stage("Finding competitors")).queryAllByRole("listitem"),
    ).toEqual([]);
    expect(stage("Measuring the keyword")).toHaveTextContent(
      "Looking up monthly searches, difficulty and links for the United States.",
    );

    await send(
      analysis,
      update({
        fetch_dataforseo_backlinks: {
          seo_result: {
            serp_backlinks: {
              search_volume: 1900,
              volume_status: "ok",
              keyword_difficulty: 28,
              backlinks: 412,
              referring_domains: 96,
            },
          },
        },
      }),
      update({
        save_keyword_research: {
          seo_result: { keyword_research_key: "library_1" },
        },
      }),
      gate({
        type: "keyword Selection",
        instruction: "Select a keyword",
        Recommendations: ["garden layout app"],
        "Primary Keyword": KEYWORD,
        Country: "us",
        seo_state: {
          keyword_difficulty: 28,
          intent: ["informational"],
          volume: 1900,
          volume_status: "ok",
        },
      }),
    );
    await end(analysis);
    // The gate ends the last stage: its numbers, without the links.
    const measured = stage("Measuring the keyword");
    expect(measured).toHaveAttribute("data-state", "complete");
    expect(measured).toHaveTextContent(
      "1,900 searches a month · difficulty 28 of 100 (Medium) · saved to Keywords",
    );
    expect(measured).not.toHaveTextContent("412");

    // ── Step 3: the content type ─────────────────────────────────────────────
    fireEvent.click(
      await screen.findByRole(
        "button",
        { name: "Keep the keyword" },
        { timeout: 4000 },
      ),
    );
    const choosing = await nextRun(2);
    expect(choosing.url).toBe("/api/generate/thread-1/resume");
    expect(
      await screen.findByRole("heading", {
        name: "Choosing a content type for “vegetable garden planner”",
      }),
    ).toBeVisible();
    expect(screen.getByText("For readers who want to learn")).toBeVisible();
    expect(stage("Choosing a content type")).toHaveTextContent(
      "Comparing what kind of pages rank for “vegetable garden planner”.",
    );
    await send(
      choosing,
      update({
        recommend_content_type: {
          content: {
            content_type_pick: { recommended_content_type: "how-to-guide" },
          },
        },
      }),
      gate({
        type: "content_type",
        instruction: "Select a content type",
        content_types: ["how-to-guide", "blog"],
        recommended_content_type: "how-to-guide",
      }),
    );
    await end(choosing);
    expect(stage("Choosing a content type")).toHaveTextContent(
      "Suggested: How-to guide",
    );

    // ── Step 4: the titles, as they are written ──────────────────────────────
    fireEvent.click(
      await screen.findByRole(
        "button",
        { name: "Choose how-to-guide" },
        { timeout: 4000 },
      ),
    );
    const writing = await nextRun(3);
    expect(
      await screen.findByRole("heading", {
        name: "Writing titles for “vegetable garden planner”",
      }),
    ).toBeVisible();
    expect(
      screen.getByText("How-to guide · for readers who want to learn"),
    ).toBeVisible();
    expect(screen.getByText("usually about 12 s")).toBeVisible();
    expect(stage("Checking each title")).toHaveTextContent(
      "Each one must contain “vegetable garden planner” and run 50 to 59 characters. Any that don’t are rewritten.",
    );

    const cut = TITLE_JSON.indexOf("Templates") + "Templates".length;
    const pieces = (text: string): string[] => text.match(/[\s\S]{1,9}/g) ?? [];
    await send(
      writing,
      update({ content_type: { content: { content_type: "how-to-guide" } } }),
      ...pieces(TITLE_JSON.slice(0, cut)).map((piece) =>
        token(piece, "generate_topics"),
      ),
    );
    const titles = stage("Writing five titles");
    expect(titles).toHaveAttribute("data-state", "active");
    expect(titles).toHaveTextContent(
      "3 of 5 written, from 2 related searches and 1 question people ask.",
    );
    const rows = within(titles)
      .getAllByRole("listitem")
      .map((row) => row.textContent);
    expect(rows).toEqual([
      `1${TITLES[0]}Has the keyword56 characters`,
      `2${TITLES[1]}Has the keyword58 charactersRecommendedIt answers what most searchers ask first.`,
      `3${TITLES[2]}Has the keyword57 characters`,
      "4Free Vegetable Garden Planner Templates…Being written",
      "5Fifth titleNext",
    ]);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuetext",
      "3 of 5 titles written",
    );

    // The model's text closes: the writing is done, the checks begin.
    await send(
      writing,
      ...pieces(TITLE_JSON.slice(cut)).map((piece) =>
        token(piece, "generate_topics"),
      ),
    );
    expect(stage("Writing five titles")).toHaveAttribute(
      "data-state",
      "complete",
    );
    expect(stage("Writing five titles")).toHaveTextContent("5 titles written");
    expect(stage("Checking each title")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(stage("Checking each title")).toHaveTextContent(
      "Checking each title holds “vegetable garden planner” and runs 50 to 59 characters.",
    );

    const checked = [
      ...TITLES.slice(0, 4),
      "Vegetable Garden Planner Mistakes Beginners Can Avoid",
    ];
    await send(
      writing,
      update({
        generate_topics: {
          content: {
            topic_set: { topics: checked, focus_keyphrase: KEYWORD },
          },
        },
      }),
      gate({
        type: "topic",
        instruction: "Select a title",
        topics: checked,
        recommended_topic: checked[1],
      }),
    );
    await end(writing);
    expect(stage("Checking each title")).toHaveTextContent(
      "All 5 pass · 1 rewritten to fit",
    );
    expect(
      screen.getByText(
        "You can leave this page. The titles keep coming, and we’ll tell you when they’re ready.",
      ),
    ).toBeVisible();

    // The step itself takes over, with the checked set.
    const offered = await screen.findByRole(
      "list",
      { name: "Titles to choose from" },
      { timeout: 4000 },
    );
    expect(offered).toHaveTextContent(checked[4]);
    expect(screen.queryByRole("progressbar")).toBeNull();

    // ── Step 5: the outline, heading by heading ──────────────────────────────
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with the first title" }),
    );
    const outlining = await nextRun(4);
    await send(
      outlining,
      update({
        topic_generation: {
          content: { topics: checked, selected_topic: TITLES[0] },
        },
      }),
    );
    expect(
      await screen.findByRole("heading", {
        name: `Outlining “${TITLES[0]}”`,
      }),
    ).toBeVisible();
    expect(screen.getByText("How-to guide")).toBeVisible();
    expect(stage("Grouping the keywords")).toHaveTextContent(
      "Pulling phrases from the pages that match your reader, then grouping them by topic.",
    );
    expect(stage("Outlining")).toHaveTextContent(
      "The sections, written one by one.",
    );

    await send(
      outlining,
      update({
        keyword_clustering: {
          seo_result: {
            keyword_clusters: [
              {
                cluster_name: "garden bed layout",
                topic_theme: "bed layout",
                keywords: [{ keyword: "a" }, { keyword: "b" }],
              },
              {
                cluster_name: "planting dates",
                topic_theme: "planting dates",
                keywords: [{ keyword: "c" }],
              },
            ],
          },
        },
      }),
      update({
        map_keyword_clusters: { content: { cluster_heading_map: {} } },
      }),
    );
    expect(stage("Grouping the keywords")).toHaveAttribute(
      "data-state",
      "complete",
    );
    expect(stage("Grouping the keywords")).toHaveTextContent(
      "3 phrases in 2 groups: bed layout, planting dates.",
    );
    expect(stage("Outlining")).toHaveTextContent("Writing the sections.");

    // The first outline's text, which the page used to drop.
    await send(
      outlining,
      ...pieces(
        '{"structure":{"sections":[{"heading":"Pick your beds","description":"Where they go."},{"heading":"Map the rows","description":"Row by',
      ).map((piece) => token(piece, "generate_outline")),
    );
    const sections = stage("Outlining");
    expect(sections).toHaveTextContent("Writing the sections: 2 so far.");
    expect(
      within(sections)
        .getAllByRole("listitem")
        .map((row) => row.textContent),
    ).toEqual(["1Pick your beds", "2Map the rows"]);
    expect(
      screen.getByText(
        "You can leave this page. The outline keeps coming, and we’ll tell you when it’s ready.",
      ),
    ).toBeVisible();

    // The written outline: the outline step takes over from the box, as before.
    await send(
      outlining,
      update({
        generate_outline: {
          content: {
            outline: {
              title: TITLES[0],
              sections: [{ heading: "Pick your beds" }],
              target_word_count: 1800,
            },
          },
        },
      }),
    );
    expect(screen.queryByRole("progressbar")).toBeNull();
  }, 40_000);

  it("says what a run picked up after a reload had already found, from the thread's state", async () => {
    const serp = {
      serp_result: {
        organic_results: [
          {
            position: 1,
            title: "Thé vert : le guide",
            link: "https://the.example/",
          },
          {
            position: 2,
            title: "Bien choisir son thé",
            link: "https://www.palais.example/",
          },
        ],
        people_ask: [],
        related_searches: ["thé vert bio"],
      },
      serp_normalized: {
        normalize_results: [
          { domain: "the.example" },
          { domain: "palais.example" },
        ],
        domain_stats: { unique_domains: 2 },
      },
    };
    mockStatus.mockImplementation(async (url: string) => ({
      ok: true,
      status: 200,
      json: async () =>
        url.includes("includeState=true")
          ? {
              run: { id: "run-9", status: "running" },
              progress: 5,
              stage: "Analyzing search results",
              runStage: { phase: "analysis", id: "competitors" },
              state: {
                // The search is the subgraph's so far: its parent holds only what was asked.
                values: { serp_payload: { query: "thé vert", country: "fr" } },
                next: ["serp_engine"],
                tasks: [
                  {
                    name: "serp_engine",
                    state: {
                      values: serp,
                      tasks: [{ name: "extract_competitor" }],
                    },
                  },
                ],
              },
            }
          : { run: { id: "run-9", status: "running" } },
    }));

    render(
      <FreshGenerationView onBack={jest.fn()} backgroundThreadId="thread-9" />,
    );
    const joined = await nextRun(1);
    expect(joined.url).toBe("/api/generate/thread-9/join");

    // The thread's keyword and country: the form holds neither after a reload.
    expect(
      await screen.findByRole("heading", { name: "Analysing “thé vert”" }),
    ).toBeVisible();
    expect(screen.getByText("Google · France")).toBeVisible();
    // Its start was never seen: no clock, only the usual time.
    expect(screen.queryByRole("timer")).toBeNull();
    expect(screen.getByText("usually about 30 s")).toBeVisible();

    const read = stage("Reading the search results");
    expect(read).toHaveAttribute("data-state", "complete");
    expect(read).toHaveTextContent("2 results from 2 sites · 1 related search");
    expect(read).toHaveTextContent("Thé vert : le guide");
    const finding = stage("Finding competitors");
    expect(finding).toHaveAttribute("data-state", "active");
    expect(
      within(finding)
        .getAllByRole("listitem")
        .map((chip) => chip.textContent),
    ).toEqual(["the.example", "palais.example"]);

    // The joined stream carries the subgraph's own update when it ends.
    await send(joined, {
      event: "updates",
      data: {
        serp_engine: {
          ...serp,
          competitors: [
            { domain: "the.example", top_positions: [1] },
            { domain: "palais.example", top_positions: [2] },
          ],
          final_intent_type: "COMMERCIAL",
        },
      },
    });
    expect(stage("Finding competitors")).toHaveTextContent(
      "2 competing sites · searchers want to compare options",
    );
    expect(stage("Measuring the keyword")).toHaveTextContent(
      "Looking up monthly searches, difficulty and links for France.",
    );
  }, 20_000);
});
