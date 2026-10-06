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
