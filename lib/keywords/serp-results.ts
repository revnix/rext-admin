/**
 * One of the search results' top ten, as the SERP snapshot shows it. The title gate sends these as
 * `serp_titles` (rext-backend `build_serp_titles`); a Library item keeps its `top_organic_results`,
 * which `serpResultsFromOrganic` turns into the same shape.
 */
export type SerpResult = {
  position: number;
  title: string;
  domain: string;
  url?: string;
  /** The backend's format key, read from the title (`classify_result_format`), or none. */
  format?: string | null;
};

/** The backend's format keys, in words, for one result. */
const FORMAT_LABELS: Record<string, string> = {
  alternatives: "Alternatives page",
  comparison: "Comparison",
  "how-to": "How-to guide",
  review: "Review",
  list: "List post",
  explainer: "Explainer",
  guide: "In-depth guide",
  "home-page": "Home page",
};

/** A result's format in words, or null for none or a key this list doesn't know. */
export function formatLabel(format: string | null | undefined): string | null {
  return (format && FORMAT_LABELS[format]) || null;
}

/** The same formats as a count reads them: "6 how-to guides". */
const FORMAT_PLURALS: Record<string, string> = {
  alternatives: "alternatives pages",
  comparison: "comparisons",
  "how-to": "how-to guides",
  review: "reviews",
  list: "list posts",
  explainer: "explainers",
  guide: "in-depth guides",
  "home-page": "home pages",
};

/**
 * What kinds of pages the results are, the commonest first, in one plain sentence: "Among these
 * 10: 6 how-to guides, 2 list posts and 1 review." Null when the kind is known of fewer than half
 * of them: "Among these 6: 1 in-depth guide." says little, and reads as if it said it all.
 */
export function describeRankingKinds(
  results: readonly SerpResult[],
): string | null {
  const counts = new Map<string, number>();
  for (const { format } of results) {
    if (format && FORMAT_LABELS[format])
      counts.set(format, (counts.get(format) ?? 0) + 1);
  }
  const known = [...counts.values()].reduce((sum, count) => sum + count, 0);
  if (known === 0 || known * 2 < results.length) return null;
  const parts = [...counts]
    .sort((a, b) => b[1] - a[1])
    .map(([format, count]) =>
      count === 1
        ? `1 ${FORMAT_LABELS[format].toLowerCase()}`
        : `${count} ${FORMAT_PLURALS[format]}`,
    );
  const list =
    parts.length === 1
      ? parts[0]
      : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
  return `Among these ${results.length}: ${list}.`;
}

/** example.com from https://www.example.com/a/b, or "" when the address doesn't parse. */
export function domainOf(url: string | undefined): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** A Library item's kept results, in position order, the first ten. */
export function serpResultsFromOrganic(
  results:
    | ReadonlyArray<{
        position?: number | null;
        title?: string | null;
        url?: string | null;
        domain?: string | null;
      }>
    | null
    | undefined,
): SerpResult[] {
  return (results ?? [])
    .filter((r) => r.title)
    .map((r, index) => ({
      position: r.position ?? index + 1,
      title: r.title ?? "",
      domain: r.domain || domainOf(r.url ?? undefined),
      url: r.url ?? undefined,
    }))
    .sort((a, b) => a.position - b.position)
    .slice(0, 10);
}

/**
 * The top ten a gate's payload carries (`serp_titles`, sent by the keyword and title gates), with
 * anything missing or malformed left out; none when the gate sent none (an older run).
 */
export function serpResultsFromGate(gate: unknown): SerpResult[] {
  const value =
    gate && typeof gate === "object"
      ? (gate as Record<string, unknown>).serp_titles
      : undefined;
  return (Array.isArray(value) ? value : []).filter(
    (result): result is SerpResult =>
      !!result &&
      typeof result === "object" &&
      typeof (result as { title?: unknown }).title === "string",
  );
}
