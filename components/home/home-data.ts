import type { LibraryEntry } from "@/lib/generate-content/library-item";
import type { ContentItem } from "@/types/content";

/**
 * What the home shows, worked out from data the dashboard already loads (plans/app/D-pages.md §2.1).
 * The backend has no "planned", "outline" or "drafting" content state: an article's row appears
 * when its run ends, as a draft. So the pipeline counts what exists (drafts, in review, scheduled,
 * published this month), and the runs still going are the Continue row's.
 */

/** A generated article waiting to be read: a draft, or one marked ready by hand. */
const DRAFT_STATES = new Set(["draft", "ready"]);
/** An article that was written: not a failed, cancelled or running generation, nor one in the trash. */
const WRITTEN_STATES = new Set([
  ...DRAFT_STATES,
  "review",
  "scheduled",
  "published",
  "archived",
]);

/** Whether any article was written, as opposed to a run that failed or never finished. */
export function hasWrittenArticle(content: ContentItem[]): boolean {
  return content.some((item) => WRITTEN_STATES.has(String(item.status)));
}

export type PipelineCounts = {
  drafts: number;
  review: number;
  scheduled: number;
  publishedThisMonth: number;
};

/** When an article went out: the site's publish date, else its last change. */
export function publishedAt(item: ContentItem): Date | null {
  const raw =
    item.wordpress_published_at ??
    (item as ContentItem & { shopify_published_at?: string })
      .shopify_published_at ??
    item.updated_at;
  const time = raw ? Date.parse(raw) : Number.NaN;
  return Number.isNaN(time) ? null : new Date(time);
}

export function countPipeline(
  content: ContentItem[],
  now: Date,
): PipelineCounts {
  const counts: PipelineCounts = {
    drafts: 0,
    review: 0,
    scheduled: 0,
    publishedThisMonth: 0,
  };
  for (const item of content) {
    const status = String(item.status);
    if (DRAFT_STATES.has(status)) counts.drafts += 1;
    else if (status === "review") counts.review += 1;
    else if (status === "scheduled") counts.scheduled += 1;
    else if (status === "published") {
      const at = publishedAt(item);
      if (
        at &&
        at.getFullYear() === now.getFullYear() &&
        at.getMonth() === now.getMonth()
      ) {
        counts.publishedThisMonth += 1;
      }
    }
  }
  return counts;
}

/** The articles to pick up again: in review first, then drafts, each newest first. */
export function articlesToContinue(content: ContentItem[], limit: number) {
  const changed = (item: ContentItem) => Date.parse(item.updated_at ?? "") || 0;
  const rank = (item: ContentItem) =>
    String(item.status) === "review" ? 0 : 1;
  return content
    .filter((item) => {
      const status = String(item.status);
      return status === "review" || DRAFT_STATES.has(status);
    })
    .sort((a, b) => rank(a) - rank(b) || changed(b) - changed(a))
    .slice(0, limit);
}

const normalise = (text: string) => text.trim().toLowerCase();

/** A keyword's monthly searches when the research found a number. */
export function searchVolume(entry: LibraryEntry): number | null {
  const volume = entry.value.seo_state?.volume;
  const number = typeof volume === "string" ? Number(volume) : volume;
  return typeof number === "number" && Number.isFinite(number) ? number : null;
}

/**
 * Researched keywords no article is written on yet (no article has it as its focus keyphrase or
 * its title) and no open run is working on, the most searched first. The Library keeps no
 * clusters, so these come from the caller's own research.
 */
export function suggestKeywords(
  library: LibraryEntry[],
  content: ContentItem[],
  limit: number,
  inProgress: string[] = [],
): LibraryEntry[] {
  const written = new Set<string>(inProgress.map(normalise));
  for (const item of content) {
    if (item.seo_data?.focus_keyphrase)
      written.add(normalise(item.seo_data.focus_keyphrase));
    if (item.title) written.add(normalise(item.title));
  }
  return library
    .filter((entry) => !written.has(normalise(entry.value.original_query)))
    .sort((a, b) => (searchVolume(b) ?? -1) - (searchVolume(a) ?? -1))
    .slice(0, limit);
}

export type ChecklistStepId =
  | "site"
  | "brand-voice"
  | "keyword"
  | "content"
  | "publish";

export type ChecklistStep = {
  id: ChecklistStepId;
  label: string;
  description: string;
  done: boolean;
};

/**
 * What each step needs, `undefined` while it isn't known (still loading, or hidden from the
 * person's role): an unknown step is left out rather than shown as undone.
 */
export type ChecklistFacts = Partial<Record<ChecklistStepId, boolean>>;

const STEPS: Omit<ChecklistStep, "done">[] = [
  {
    id: "site",
    label: "Connect your site",
    description: "Install the Rext AI plugin on WordPress and connect it.",
  },
  {
    id: "brand-voice",
    label: "Set up your brand voice",
    description: "What you sell, to whom, and how you sound.",
  },
  {
    id: "keyword",
    label: "Research a keyword",
    description: "See its searches, difficulty and what ranks for it.",
  },
  {
    id: "content",
    label: "Write your first article",
    description: "From a keyword to a draft, step by step.",
  },
  {
    id: "publish",
    label: "Publish an article",
    description: "Send a draft to your site, live or as a draft there.",
  },
];

/** Every step, known or not: completion means all of them are done. */
export const CHECKLIST_STEP_COUNT = STEPS.length;

export function checklistSteps(facts: ChecklistFacts): ChecklistStep[] {
  return STEPS.flatMap((step) =>
    facts[step.id] === undefined ? [] : [{ ...step, done: !!facts[step.id] }],
  );
}

/** An article's on-page score, when it has one. */
function seoScore(item: ContentItem): number | null {
  const score = item.seo_data?.seo_score ?? item.seo_data?.content_seo_score;
  return typeof score === "number" && Number.isFinite(score) ? score : null;
}

/** Under this on-page score an article is worth another look. */
export const HEALTHY_SCORE = 70;
/** A draft left this long without a change is going stale. */
export const STALE_DRAFT_DAYS = 14;

export type ContentHealth = {
  /** Published articles with a score. */
  scored: number;
  /** Their average on-page score, rounded; null with none. */
  average: number | null;
  /** How many of them score under HEALTHY_SCORE. */
  underHealthy: number;
  /** Drafts not changed for STALE_DRAFT_DAYS or more. */
  staleDrafts: number;
};

/** The home's content health (FB2.27 #708): the published articles' on-page scores, and the drafts
 * left untouched, from the content list the home already loads. */
export function contentHealth(
  content: ContentItem[],
  now: Date,
): ContentHealth {
  const scores = content
    .filter((item) => String(item.status) === "published")
    .map(seoScore)
    .filter((score): score is number => score !== null);
  const staleBefore = now.getTime() - STALE_DRAFT_DAYS * 24 * 60 * 60 * 1000;
  const staleDrafts = content.filter((item) => {
    if (!DRAFT_STATES.has(String(item.status))) return false;
    const changed = Date.parse(item.updated_at ?? item.created_at);
    return Number.isFinite(changed) && changed <= staleBefore;
  }).length;
  return {
    scored: scores.length,
    average: scores.length
      ? Math.round(
          scores.reduce((sum, score) => sum + score, 0) / scores.length,
        )
      : null,
    underHealthy: scores.filter((score) => score < HEALTHY_SCORE).length,
    staleDrafts,
  };
}

/** How sending an article to a site went. */
export type PublishState = "published" | "scheduled" | "draft" | "failed";

export type RecentPublish = {
  articleId: string;
  siteId: string;
  title: string;
  site: string;
  state: PublishState;
  at: number | null;
};

/** A publishing result's state for the home; null for one that is no publish any more (a post
 * trashed or deleted on the site, a state the site didn't tell). */
function publishState(status: string): PublishState | null {
  if (/fail|error/i.test(status)) return "failed";
  if (status === "scheduled") return "scheduled";
  if (status === "draft" || status === "pending") return "draft";
  if (["published", "synced", "success"].includes(status)) return "published";
  return null;
}

/** Each connected site's name for the home: its address without "www.". */
export function siteLabels(
  sites: { id: string; site_url?: string | null }[],
): Map<string, string> {
  const labels = new Map<string, string>();
  for (const site of sites) {
    if (!site.site_url) continue;
    try {
      labels.set(
        site.id,
        new URL(site.site_url).hostname.replace(/^www\./, ""),
      );
    } catch {
      // An address that isn't a URL names nothing.
    }
  }
  return labels;
}

/** The latest publishes to the workspace's sites, newest first (FB2.27 #708), and how many of all
 * of them failed. The content list names a result's address and time `url` and `last_synced`, and
 * no site: `sites` names it (siteLabels). */
export function recentPublishes(
  content: ContentItem[],
  sites: Map<string, string> = new Map(),
  limit = 5,
): { items: RecentPublish[]; failed: number } {
  const all: RecentPublish[] = content.flatMap((item) =>
    (item.publishing_results ?? []).flatMap((result) => {
      const state = publishState(String(result.status));
      if (!state) return [];
      // A result the site hasn't been asked about yet (a publish that just failed) has no time of
      // its own: the article's last change stands in, so it isn't sorted behind every dated one.
      const at = Date.parse(
        result.last_synced_at ??
          result.last_synced ??
          item.updated_at ??
          item.created_at ??
          "",
      );
      return [
        {
          articleId: item.id,
          siteId: result.site_id,
          title: item.title,
          site: result.site_name || sites.get(result.site_id) || "Your site",
          state,
          at: Number.isFinite(at) ? at : null,
        },
      ];
    }),
  );
  all.sort((a, b) => (b.at ?? 0) - (a.at ?? 0));
  return {
    items: all.slice(0, limit),
    failed: all.filter((entry) => entry.state === "failed").length,
  };
}
