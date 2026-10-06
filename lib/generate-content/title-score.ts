/**
 * The Title step's small score (plans/app/E-workflow.md §4, step 4; research 04 §2.3): three checks a
 * reader can see the reason for. The first two are the backend's own title contract
 * (rext-backend `seo_title_rules.py`: the exact focus keyphrase, 50 to 59 characters), measured the
 * same way, so a title the backend would flag is flagged here before it is chosen.
 */

/** The backend's title length, inclusive (`TITLE_MIN_CHARS`, `TITLE_MAX_CHARS`). */
export const TITLE_MIN_CHARS = 50;
export const TITLE_MAX_CHARS = 59;

export type TitleCheckId = "keyphrase" | "length" | "clarity";

export interface TitleCheck {
  id: TitleCheckId;
  met: boolean;
  /** What a reader sees: what holds, or what is wrong. */
  label: string;
}

export interface TitleScore {
  checks: TitleCheck[];
  met: number;
  total: number;
}

/** Whitespace and surrounding quotes only, as the backend's `normalize_title`. */
export function normalizeTitle(title: string): string {
  return title
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^["'`“”‘’ ]+|["'`“”‘’ ]+$/g, "")
    .trim();
}

/** Lowercase, punctuation flattened, padded with spaces, as the backend's `_normalize_for_match`. */
function forMatch(text: string): string {
  return ` ${text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()} `;
}

/**
 * The exact keyphrase as a whole-word run, tolerant of case, punctuation and spacing only (the
 * backend's `contains_keyphrase`): a reordered or partial phrase does not count.
 */
export function containsKeyphrase(title: string, keyphrase: string): boolean {
  const phrase = forMatch(keyphrase).trim();
  return phrase !== "" && forMatch(title).includes(` ${phrase} `);
}

/** All-capital words that are names, not shouting. Three letters or fewer (SEO, API) always pass. */
const ACRONYMS = new Set([
  "HTML",
  "HTTP",
  "HTTPS",
  "JSON",
  "GDPR",
  "HIPAA",
  "ASAP",
  "FAQS",
  "SAAS",
]);

/**
 * What makes a title hard to read at a glance: a shouted word (four capitals or more that is not a
 * known acronym), stacked punctuation ("!!", "?!") or more than one separator (":", " | ", " - ",
 * " – ", " — ").
 */
function clarityProblem(title: string): string | null {
  const shouted = (title.match(/\b[A-Z]{4,}\b/g) ?? []).some(
    (word) => !ACRONYMS.has(word),
  );
  if (shouted) return "Has a word in capitals";
  if (/[!?]{2,}|\.{4,}/.test(title)) return "Stacked punctuation";
  const separators = title.match(/:|\s[|\-–—]\s/g) ?? [];
  if (separators.length > 1) return "More than one separator";
  return null;
}

export function scoreTitle(
  title: string,
  keyphrase?: string | null,
): TitleScore {
  const text = normalizeTitle(title);
  const checks: TitleCheck[] = [];

  const phrase = (keyphrase ?? "").trim();
  if (phrase) {
    const has = containsKeyphrase(text, phrase);
    checks.push({
      id: "keyphrase",
      met: has,
      label: has ? `Has “${phrase}”` : `Missing “${phrase}”`,
    });
  }

  const length = text.length;
  const inRange = length >= TITLE_MIN_CHARS && length <= TITLE_MAX_CHARS;
  checks.push({
    id: "length",
    met: inRange,
    label: inRange
      ? `${length} characters`
      : `${length} characters, ${length < TITLE_MIN_CHARS ? `under ${TITLE_MIN_CHARS}` : `over ${TITLE_MAX_CHARS}`}`,
  });

  const problem = clarityProblem(text);
  checks.push({
    id: "clarity",
    met: problem === null,
    label: problem ?? "Reads clearly",
  });

  return {
    checks,
    met: checks.filter((check) => check.met).length,
    total: checks.length,
  };
}
