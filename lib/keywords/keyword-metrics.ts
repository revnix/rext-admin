import type { MonthlyVolumeInput } from "@/lib/generate-content/monthly-volume";

/** The four search intents the backend classifies a keyword into. */
export const SEARCH_INTENTS = [
  "informational",
  "commercial",
  "transactional",
  "navigational",
] as const;

export type SearchIntent = (typeof SEARCH_INTENTS)[number];

export function isSearchIntent(value: unknown): value is SearchIntent {
  return (
    typeof value === "string" &&
    (SEARCH_INTENTS as readonly string[]).includes(value)
  );
}

/** "informational" → "Informational". */
export function intentLabel(intent: SearchIntent): string {
  return intent.charAt(0).toUpperCase() + intent.slice(1);
}

/**
 * The intents the analysis gave, valid and once each, in its order: the search results' consensus
 * first, then the one the model recommends (the keyword gate's `seo_state.intent`, kept in the
 * Library). A single string is the older shape.
 */
export function parseIntents(intent: unknown): SearchIntent[] {
  const raw = Array.isArray(intent) ? intent : [intent];
  const intents: SearchIntent[] = [];
  for (const value of raw) {
    const norm = typeof value === "string" ? value.trim().toLowerCase() : "";
    if (isSearchIntent(norm) && !intents.includes(norm)) intents.push(norm);
  }
  return intents;
}

/**
 * A keyword's difficulty from 0 to 100, or null when the analysis has none. Older runs sent an
 * object with `difficulty_score`.
 */
export function difficultyScore(value: unknown): number | null {
  const raw =
    value && typeof value === "object" && "difficulty_score" in value
      ? (value as { difficulty_score: unknown }).difficulty_score
      : value;
  if (raw === null || raw === undefined || raw === "") return null;
  const score = Number(raw);
  return Number.isFinite(score)
    ? Math.min(Math.max(Math.round(score), 0), 100)
    : null;
}

export type DifficultyBand = "Easy" | "Medium" | "Hard" | "Very hard";

/** The band a difficulty falls in: up to 10 easy, 30 medium, 70 hard, above that very hard. */
export function difficultyBand(score: number | null): DifficultyBand | null {
  if (score === null) return null;
  if (score <= 10) return "Easy";
  if (score <= 30) return "Medium";
  if (score <= 70) return "Hard";
  return "Very hard";
}

/** A count the analysis measured, or null when it has none. */
function count(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** What the analysis measured about one keyword, as the keyword card and table show it. */
export type KeywordMetrics = {
  difficulty: number | null;
  volume: MonthlyVolumeInput;
  volumeStatus: string | null;
  /** The search results' consensus first, then the model's recommendation. */
  intents: SearchIntent[];
  backlinks: number | null;
  referringDomains: number | null;
};

/** The keyword gate's `seo_state`, and the same object kept with a Library item. */
export type SeoStateInput = {
  keyword_difficulty?: unknown;
  intent?: unknown;
  volume?: MonthlyVolumeInput;
  volume_status?: string | null;
  backlinks?: unknown;
  referring_domains?: unknown;
};

export function keywordMetrics(
  seoState: SeoStateInput | null | undefined,
): KeywordMetrics {
  return {
    difficulty: difficultyScore(seoState?.keyword_difficulty),
    volume: seoState?.volume,
    volumeStatus: seoState?.volume_status ?? null,
    intents: parseIntents(seoState?.intent),
    backlinks: count(seoState?.backlinks),
    referringDomains: count(seoState?.referring_domains),
  };
}

/** 12,400: a count in full, for the expanded card. */
export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
