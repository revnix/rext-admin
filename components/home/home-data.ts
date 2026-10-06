import type { LibraryEntry } from "@/lib/generate-content/library-item";
import type { Content } from "@/types/content";

/**
 * What the home shows, worked out from data the dashboard already loads (plans/app/D-pages.md §2.1).
 * The backend has no "planned", "outline" or "drafting" content state: an article's row appears
 * when its run ends, as a draft. So the pipeline counts what exists (drafts, in review, scheduled,
 * published this month), and the runs still going are the Continue row's.
 */

/** A generated article waiting to be read: a draft, or one marked ready by hand. */
const DRAFT_STATES = new Set(["draft", "ready"]);

export type PipelineCounts = {
  drafts: number;
  review: number;
  scheduled: number;
  publishedThisMonth: number;
};

/** When an article went out: the site's publish date, else its last change. */
export function publishedAt(item: Content): Date | null {
  const raw =
    item.wordpress_published_at ??
    (item as { shopify_published_at?: string }).shopify_published_at ??
    item.updated_at;
  const time = raw ? Date.parse(raw) : Number.NaN;
  return Number.isNaN(time) ? null : new Date(time);
}

export function countPipeline(content: Content[], now: Date): PipelineCounts {
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
export function articlesToContinue(content: Content[], limit: number) {
  const changed = (item: Content) => Date.parse(item.updated_at ?? "") || 0;
  const rank = (item: Content) => (String(item.status) === "review" ? 0 : 1);
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
 * its title), the most searched first. The Library keeps no clusters, so these come from the
 * caller's own research.
 */
export function suggestKeywords(
  library: LibraryEntry[],
  content: Content[],
  limit: number,
): LibraryEntry[] {
  const written = new Set<string>();
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

export function checklistSteps(facts: ChecklistFacts): ChecklistStep[] {
  return STEPS.flatMap((step) =>
    facts[step.id] === undefined ? [] : [{ ...step, done: !!facts[step.id] }],
  );
}
