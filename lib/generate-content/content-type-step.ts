// Step 3 of the Generate flow, the content type (plans/app/E-workflow.md, step 3): what the
// SERP shows, how the candidate types are ordered, and what each type is called.

/** What the SERP shows, as the content-type gate sends it (`serp_evidence`, built by the
 * backend's `src/flow/engines/serp/serp_evidence.py`). */
export type SerpEvidence = {
  /** How many top results were read: at most 10. */
  results: number;
  /** The format most of them share, when enough do; `null` when none leads. */
  dominantFormat: {
    label: string;
    count: number;
    contentTypes: string[];
  } | null;
  /** Distinct "People also ask" questions. */
  paaCount: number;
  /** `true` Google shows an AI Overview, `false` it shows none, `null` not known. */
  aiOverview: boolean | null;
};

const asCount = (value: unknown) =>
  typeof value === "number" && Number.isInteger(value) && value > 0 ? value : 0;

/** The gate's `serp_evidence`, or `null` when the run has none (a library keyword, a failed
 * lookup) or it isn't the expected shape. */
export function readSerpEvidence(raw: unknown): SerpEvidence | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const results = asCount(value.results);
  if (!results) return null;

  const dominant = value.dominant_format as Record<string, unknown> | null;
  const count = asCount(dominant?.count);
  const dominantFormat =
    dominant && typeof dominant.label === "string" && count
      ? {
          label: dominant.label,
          count,
          contentTypes: Array.isArray(dominant.content_types)
            ? dominant.content_types.filter(
                (type): type is string => typeof type === "string",
              )
            : [],
        }
      : null;

  return {
    results,
    dominantFormat,
    paaCount: asCount(value.paa_count),
    aiOverview:
      typeof value.ai_overview === "boolean" ? value.ai_overview : null,
  };
}

/** The evidence line's parts ("6 of 10 results are list posts", "4 questions people also
 * ask", "AI Overview present"): only what the SERP says, nothing for what it doesn't. */
export function evidenceParts(evidence: SerpEvidence | null): string[] {
  if (!evidence) return [];
  const parts: string[] = [];
  const { dominantFormat, results, paaCount, aiOverview } = evidence;
  if (dominantFormat)
    parts.push(
      `${dominantFormat.count} of ${results} results are ${dominantFormat.label}`,
    );
  if (paaCount)
    parts.push(
      `${paaCount} ${paaCount === 1 ? "question" : "questions"} people also ask`,
    );
  if (aiOverview === true) parts.push("AI Overview present");
  if (aiOverview === false) parts.push("No AI Overview");
  return parts;
}

// The types most written for each intent, most common first (reports/app/04-competitors-and-
// workflow.md §2.2): informational keywords get guides and explainers, commercial ones "best X"
// lists, comparisons and reviews, transactional ones landing and service pages, navigational ones
// the brand's own pages. The backend's other candidates go under "More types".
const COMMON_BY_INTENT: Record<string, string[]> = {
  informational: ["how-to-guide", "explainer", "blog", "faq"],
  commercial: [
    "best-tools",
    "comparison",
    "alternatives",
    "in-depth-review",
    "buying-guide",
  ],
  transactional: ["landing-page", "service-page", "sales-page", "pricing-page"],
  navigational: [
    "brand-page",
    "product-homepage",
    "help-center",
    "login-guide",
  ],
};

// Three to five cards in the common case (the plan's step 3).
const MIN_SHOWN = 3;
const MAX_SHOWN = 5;

/** The candidate types split into the cards shown and those under "More types". Shown, in
 * order: the recommended type, the types the SERP's leading format supports, then the intent's
 * common types; at least three of the candidates, at most five. A single leftover is shown
 * rather than folded away. */
export function arrangeContentTypes(
  candidates: string[],
  {
    recommended,
    intent,
    serpTypes = [],
  }: {
    recommended?: string | null;
    intent?: string | null;
    serpTypes?: string[];
  },
): { shown: string[]; more: string[] } {
  const common = COMMON_BY_INTENT[intent?.trim().toLowerCase() ?? ""] ?? [];
  const ranked = [
    ...(recommended ? [recommended] : []),
    ...serpTypes,
    ...common,
  ];
  const shown = ranked
    .filter((type, index) => ranked.indexOf(type) === index)
    .filter((type) => candidates.includes(type))
    .slice(0, MAX_SHOWN);
  for (const type of candidates) {
    if (shown.length >= MIN_SHOWN) break;
    if (!shown.includes(type)) shown.push(type);
  }
  const more = candidates.filter((type) => !shown.includes(type));
  if (more.length <= 1) return { shown: [...shown, ...more], more: [] };
  return { shown, more };
}

// The names a slug can't spell by itself.
const LABELS: Record<string, string> = {
  faq: "FAQ",
  "how-to-guide": "How-to guide",
  "in-depth-review": "In-depth review",
  "pros-cons": "Pros and cons",
  "product-homepage": "Product home page",
  "contact-us": "Contact page",
  "about-us": "About page",
};

/** A content type's name in sentence case: "best-tools" is "Best tools". */
export function contentTypeLabel(type: string): string {
  const slug = type
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
  if (LABELS[slug]) return LABELS[slug];
  const words = slug.replace(/-+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
