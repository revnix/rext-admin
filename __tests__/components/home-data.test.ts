/**
 * The home (D1) counts what the backend has, lists what to pick up again, suggests researched
 * keywords no article covers, and leaves out a checklist step it can't know.
 */

import {
  articlesToContinue,
  checklistSteps,
  countPipeline,
  suggestKeywords,
} from "@/components/home/home-data";
import type { LibraryEntry } from "@/lib/generate-content/library-item";
import type { Content } from "@/types/content";

const article = (fields: Partial<Content> & { status: string }): Content =>
  ({
    id: Math.random().toString(36).slice(2),
    workspace_id: "w",
    created_by_user_id: "u",
    title: "An article",
    updated_at: "2026-10-01T10:00:00Z",
    ...fields,
  }) as unknown as Content;

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
        } as Partial<Content> & { status: string }),
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
