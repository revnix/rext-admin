/**
 * The home (D1) counts what the backend has, lists what to pick up again, suggests researched
 * keywords no article covers, and leaves out a checklist step it can't know.
 */

import {
  articlesToContinue,
  checklistSteps,
  countPipeline,
  hasWrittenArticle,
  suggestKeywords,
  contentHealth,
  recentPublishes,
  siteLabels,
} from "@/components/home/home-data";
import type { LibraryEntry } from "@/lib/generate-content/library-item";
import type { ContentItem } from "@/types/content";

/** An article as the list returns it; a status the type doesn't list yet (ready) is allowed. */
type Fields = Omit<Partial<ContentItem>, "status" | "seo_data"> & {
  status: string;
  seo_data?: { focus_keyphrase?: string };
};

const article = (fields: Fields): ContentItem =>
  ({
    id: Math.random().toString(36).slice(2),
    workspace_id: "w",
    created_by_user_id: "u",
    title: "An article",
    updated_at: "2026-10-01T10:00:00Z",
    ...fields,
  }) as unknown as ContentItem;

const entry = (
  query: string,
  volume: number | string | null,
  timestamp = "2026-10-01T00:00:00Z",
): LibraryEntry => ({
  key: `library_${query}`,
  value: {
    original_query: query,
    recommendations: [],
    seo_state: {
      keyword_difficulty: 20,
      intent: "informational",
      volume,
      backlinks: null,
      referring_domains: null,
    },
    timestamp,
  },
});

describe("countPipeline", () => {
  const now = new Date("2026-10-20T12:00:00Z");

  it("counts drafts (ready included), review, scheduled and this month's published", () => {
    const counts = countPipeline(
      [
        article({ status: "draft" }),
        article({ status: "ready" }),
        article({ status: "review" }),
        article({ status: "scheduled" }),
        article({
          status: "published",
          wordpress_published_at: "2026-10-05T09:00:00Z",
        }),
        article({
          status: "published",
          wordpress_published_at: "2026-09-28T09:00:00Z",
        }),
        article({ status: "failed" }),
      ],
      now,
    );
    expect(counts).toEqual({
      drafts: 2,
      review: 1,
      scheduled: 1,
      publishedThisMonth: 1,
    });
  });

  it("falls back to the last change when a published article has no site date", () => {
    const counts = countPipeline(
      [article({ status: "published", updated_at: "2026-10-02T00:00:00Z" })],
      now,
    );
    expect(counts.publishedThisMonth).toBe(1);
  });
});

describe("articlesToContinue", () => {
  it("puts review first, then drafts, each newest first, up to the limit", () => {
    const items = articlesToContinue(
      [
        article({
          status: "draft",
          title: "Old draft",
          updated_at: "2026-10-01T00:00:00Z",
        }),
        article({
          status: "draft",
          title: "New draft",
          updated_at: "2026-10-03T00:00:00Z",
        }),
        article({
          status: "review",
          title: "Review",
          updated_at: "2026-09-01T00:00:00Z",
        }),
        article({ status: "published", title: "Out" }),
      ],
      2,
    );
    expect(items.map((item) => item.title)).toEqual(["Review", "New draft"]);
  });
});

describe("suggestKeywords", () => {
  it("leaves out keywords an article is written on, the most searched first", () => {
    const suggestions = suggestKeywords(
      [
        entry("seo audit", 900),
        entry("content brief", "2400"),
        entry("Keyword Research", 5000),
        entry("link building", null),
      ],
      [
        article({
          status: "published",
          seo_data: { focus_keyphrase: "keyword research" },
        }),
      ],
      3,
    );
    expect(suggestions.map((item) => item.value.original_query)).toEqual([
      "content brief",
      "seo audit",
      "link building",
    ]);
  });

  it("treats an article's title as written on its keyword too", () => {
    const suggestions = suggestKeywords(
      [entry("content brief", 10)],
      [article({ status: "draft", title: "Content Brief" })],
      5,
    );
    expect(suggestions).toEqual([]);
  });
  it("leaves out a keyword an open run is working on", () => {
    const suggestions = suggestKeywords(
      [entry("content calendar template", 2900), entry("seo audit", 10)],
      [],
      5,
      ["Content calendar template"],
    );
    expect(suggestions.map((item) => item.value.original_query)).toEqual([
      "seo audit",
    ]);
  });
});

describe("hasWrittenArticle", () => {
  it("doesn't count a failed or cancelled generation as a written article", () => {
    expect(
      hasWrittenArticle([
        article({ status: "failed" }),
        article({ status: "cancelled" }),
      ]),
    ).toBe(false);
    expect(hasWrittenArticle([article({ status: "draft" })])).toBe(true);
  });
});

describe("checklistSteps", () => {
  it("keeps the order, marks what's done, and leaves out what isn't known", () => {
    const steps = checklistSteps({
      site: true,
      keyword: false,
      content: false,
      publish: false,
    });
    expect(steps.map((step) => [step.id, step.done])).toEqual([
      ["site", true],
      ["keyword", false],
      ["content", false],
      ["publish", false],
    ]);
  });
});

describe("content health and publishing on the home (FB2.27 #708)", () => {
  const NOW = new Date("2026-10-07T12:00:00Z");
  const article = (over: Partial<ContentItem>): ContentItem =>
    ({
      id: over.id ?? "a",
      workspace_id: "w",
      created_by_user_id: "u",
      title: over.title ?? "An article",
      slug: "",
      status: "published",
      content_language: "en",
      created_at: "2026-10-01T00:00:00Z",
      updated_at: "2026-10-06T00:00:00Z",
      ...over,
    }) as ContentItem;

  it("averages the published articles' scores and counts those under 70 and the stale drafts", () => {
    const health = contentHealth(
      [
        article({
          id: "1",
          seo_data: { seo_score: 90 } as ContentItem["seo_data"],
        }),
        article({
          id: "2",
          seo_data: { seo_score: 60 } as ContentItem["seo_data"],
        }),
        article({
          id: "3",
          seo_data: { content_seo_score: 66 } as ContentItem["seo_data"],
        }),
        article({
          id: "4",
          status: "draft",
          seo_data: { seo_score: 10 } as ContentItem["seo_data"],
        }),
        article({
          id: "5",
          status: "draft",
          updated_at: "2026-09-20T00:00:00Z",
        }),
        article({
          id: "6",
          status: "ready",
          updated_at: "2026-09-23T12:00:00Z",
        }),
      ],
      NOW,
    );
    expect(health).toEqual({
      scored: 3,
      average: 72,
      underHealthy: 2,
      staleDrafts: 2,
    });
  });

  it("has no average without a scored published article", () => {
    expect(
      contentHealth([article({ status: "draft" })], NOW).average,
    ).toBeNull();
  });

  it("lists the latest publishes newest first and counts every failure", () => {
    const { items, failed } = recentPublishes(
      [
        article({
          id: "1",
          title: "Old",
          publishing_results: [
            {
              site_id: "s",
              status: "published",
              last_synced_at: "2026-10-01T00:00:00Z",
            },
          ],
        }),
        article({
          id: "2",
          title: "New",
          publishing_results: [
            {
              site_id: "s",
              status: "failed",
              last_synced_at: "2026-10-06T00:00:00Z",
            },
            {
              site_id: "t",
              status: "success",
              last_synced_at: "2026-10-05T00:00:00Z",
            },
          ],
        }),
      ],
      new Map([["s", "Blog"]]),
      2,
    );
    expect(items.map((item) => [item.title, item.site, item.state])).toEqual([
      ["New", "Blog", "failed"],
      ["New", "Your site", "published"],
    ]);
    expect(failed).toBe(1);
  });

  it("names each site by its address, as the content list sends none", () => {
    const { items } = recentPublishes(
      [
        article({
          id: "1",
          title: "First",
          publishing_results: [
            {
              site_id: "wp",
              status: "published",
              external_url: "https://www.example.com/first",
              last_synced_at: "2026-10-02T00:00:00+00:00",
            },
          ],
        }),
        article({
          id: "2",
          title: "Second",
          publishing_results: [
            {
              site_id: "gone",
              status: "scheduled",
              last_synced_at: "2026-10-04T00:00:00+00:00",
            },
          ],
        }),
      ],
      siteLabels([
        { id: "wp", site_url: "https://www.example.com/" },
        { id: "bad", site_url: "not a url" },
        { id: "none", site_url: null },
      ]),
    );

    expect(items.map((item) => [item.title, item.site, item.state])).toEqual([
      ["Second", "Your site", "scheduled"],
      ["First", "example.com", "published"],
    ]);
  });

  it("places a result with no time of its own by its article's last change", () => {
    const { items } = recentPublishes(
      [
        article({
          id: "1",
          title: "Older, dated",
          updated_at: "2026-10-01T00:00:00Z",
          publishing_results: [
            { site_id: "a", status: "published", last_synced_at: "2026-10-03" },
          ],
        }),
        article({
          id: "2",
          title: "Just failed",
          updated_at: "2026-10-06T00:00:00Z",
          publishing_results: [{ site_id: "a", status: "failed" }],
        }),
      ],
      new Map(),
      1,
    );

    expect(items.map((item) => [item.title, item.state])).toEqual([
      ["Just failed", "failed"],
    ]);
  });

  it("leaves out a result that is no publish any more, and calls a draft a draft", () => {
    const { items, failed } = recentPublishes([
      article({
        id: "1",
        title: "Mixed",
        publishing_results: [
          { site_id: "a", status: "trashed", last_synced_at: "2026-10-05" },
          { site_id: "b", status: "deleted", last_synced_at: "2026-10-05" },
          { site_id: "c", status: "unknown", last_synced_at: "2026-10-05" },
          { site_id: "d", status: "draft", last_synced_at: "2026-10-03" },
          { site_id: "e", status: "pending", last_synced_at: "2026-10-02" },
        ],
      }),
    ]);

    expect(items.map((item) => item.state)).toEqual(["draft", "draft"]);
    expect(failed).toBe(0);
  });
});
