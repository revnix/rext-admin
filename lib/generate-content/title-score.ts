/**
 * The Title step's small score (plans/app/E-workflow.md §4, step 4; research 04 §2.3): three checks a
 * reader can see the reason for. The first two are the backend's own title contract
 * (rext-backend `seo_title_rules.py`: the exact focus keyphrase, 50 to 59 characters, or up to the
 * keyphrase plus 20 for a long keyphrase, never over 75), measured the same way, so a title the
 * backend would flag is flagged here before it is chosen.
 */

/** The backend's title length, inclusive (`TITLE_MIN_CHARS`, `TITLE_MAX_CHARS`). */
export const TITLE_MIN_CHARS = 50;
export const TITLE_MAX_CHARS = 59;
/**
 * A long keyphrase leaves 59 characters little room beside it, so its titles may run to the
 * keyphrase plus this, up to the ceiling (the backend's `title_max_chars`, G69).
 */
export const TITLE_ROOM_BESIDE_KEYPHRASE = 20;
export const TITLE_MAX_CHARS_CEILING = 75;

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

/** Whitespace, surrounding quotes and NFC only, as the backend's `normalize_title`. */
export function normalizeTitle(title: string): string {
  return title
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^["'`“”‘’ ]+|["'`“”‘’ ]+$/g, "")
    .trim();
}

/**
 * Punctuation, symbols, separators, control characters and the underscore: what matching flattens
 * to a space, in any script (the backend's `_normalize_for_match`, G69b). Letters, marks and
 * digits of every script are kept.
 */
const NON_WORD = /[\p{P}\p{S}\p{Z}\p{C}_]+/gu;

/**
 * Scripts written without spaces between words (Thai, Lao, Myanmar, Khmer, kana including the
 * halfwidth forms, CJK ideographs, with the supplementary ideographic planes 2 and 3): a phrase's
 * edge in one of them needs no space beside it, and a character of one beside a phrase is a
 * boundary in itself. The `u` flag reads a character past the first plane as one code point.
 */
const UNSPACED_SCRIPT =
  /[\u0e00-\u0eff\u1000-\u109f\u1780-\u17ff\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f\u{20000}-\u{3ffff}]/u;

/** A length in characters (code points), as the backend's Python counts it, not UTF-16 units. */
function charCount(text: string): number {
  return Array.from(text).length;
}

/**
 * NFC, lowercase, punctuation flattened, padded with spaces, as the backend's
 * `_normalize_for_match`. A capital dotted İ lowercases to "i" plus a combining dot that no
 * lowercase i carries, so the dot goes: Turkish "İstanbul" is "istanbul" in lowercase. A capital Σ
 * lowercases to the final ς at a word's end, which a user types as σ: both are σ.
 */
function forMatch(text: string): string {
  return ` ${text
    .normalize("NFC")
    .toLowerCase()
    .replace(/i\u0307/g, "i")
    .replace(/ς/g, "σ")
    .replace(NON_WORD, " ")
    .trim()
    .replace(/\s+/g, " ")} `;
}

/**
 * The longest a title for this keyphrase may be, as the backend measures it: 59, or the keyphrase
 * (punctuation flattened) plus 20 when that is more, never over 75. A short keyphrase keeps 59.
 */
export function titleMaxChars(keyphrase?: string | null): number {
  const length = charCount(forMatch(keyphrase ?? "").trim());
  return Math.min(
    TITLE_MAX_CHARS_CEILING,
    Math.max(TITLE_MAX_CHARS, length + TITLE_ROOM_BESIDE_KEYPHRASE),
  );
}

/**
 * The exact keyphrase as a whole-word run, tolerant of case, punctuation and spacing only (the
 * backend's `contains_keyphrase`): a reordered or partial phrase does not count.
 */
export function containsKeyphrase(title: string, keyphrase: string): boolean {
  const phrase = forMatch(keyphrase).trim();
  if (phrase === "") return false;
  const haystack = forMatch(title); // padded with a space at each end
  const chars = Array.from(phrase);
  const first = chars[0];
  const last = chars[chars.length - 1];
  for (
    let start = haystack.indexOf(phrase);
    start !== -1;
    start = haystack.indexOf(phrase, start + 1)
  ) {
    const end = start + phrase.length;
    const preceding = Array.from(haystack.slice(0, start));
    const before = preceding[preceding.length - 1] ?? " ";
    const after = Array.from(haystack.slice(end))[0] ?? " ";
    if (atBoundary(first, before) && atBoundary(last, after)) return true;
  }
  return false;
}

/**
 * Whether a phrase's edge character ends a word against the character beside it (the backend's
 * `_at_boundary`). Each edge is judged on its own, so "AIツール" still needs its Latin edge to
 * end a word.
 */
function atBoundary(edge: string, beside: string): boolean {
  return (
    beside === " " || UNSPACED_SCRIPT.test(edge) || UNSPACED_SCRIPT.test(beside)
  );
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

  const length = charCount(text);
  const max = titleMaxChars(phrase);
  const inRange = length >= TITLE_MIN_CHARS && length <= max;
  checks.push({
    id: "length",
    met: inRange,
    label: inRange
      ? `${length} characters`
      : `${length} characters, ${length < TITLE_MIN_CHARS ? `under ${TITLE_MIN_CHARS}` : `over ${max}`}`,
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
