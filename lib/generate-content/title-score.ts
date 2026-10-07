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
  /[\u0e00-\u0eff\u1000-\u109f\u1780-\u17ff\u3005-\u3007\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f\u{20000}-\u{3ffff}]/u;

/** A space beside a character of an unspaced script, which `forMatch` drops. */
const SPACE_BESIDE_UNSPACED = new RegExp(
  `(?<=${UNSPACED_SCRIPT.source}) | (?=${UNSPACED_SCRIPT.source})`,
  "gu",
);

/**
 * NFC, lowercase, punctuation flattened, padded with spaces, as the backend's
 * `_normalize_for_match`. A capital dotted İ lowercases to "i" plus a combining dot that no
 * lowercase i carries, so the dot goes: Turkish "İstanbul" is "istanbul" in lowercase. A capital Σ
 * lowercases to the final ς at a word's end, which a user types as σ: both are σ. An invisible
 * format character (a soft hyphen, a zero-width joiner) is no word break, and a mark goes with a
 * flattened character it sits on (an emoji's variation selector). NFC runs again after lowercasing,
 * which can leave a letter and its accent apart ("J̌" is "ǰ"); the Armenian ligature և is եւ, as
 * its capital ԵՒ lowercases; and beside a script written without spaces, a space (or the
 * punctuation it replaced: "生成AI・ツール") is no word break.
 */
function forMatch(text: string): string {
  return ` ${text
    .normalize("NFC")
    .toLowerCase()
    .normalize("NFC")
    .replace(/i\u0307/g, "i")
    .replace(/ς/g, "σ")
    .replace(/և/g, "եւ")
    .replace(/\p{Cf}/gu, "")
    .replace(/([\p{P}\p{S}\p{Z}\p{C}_])\p{M}+/gu, "$1")
    .replace(NON_WORD, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(SPACE_BESIDE_UNSPACED, "")} `;
}

/**
 * East Asian Wide and Fullwidth characters (Unicode's East_Asian_Width W and F, as Python's
 * `unicodedata.east_asian_width` reads them) in the scripts titles use: Hangul Jamo, CJK symbols
 * and punctuation, kana, CJK ideographs, Hangul syllables, fullwidth forms, the supplementary
 * ideographic planes, and the common emoji blocks.
 */
const WIDE =
  /[\u1100-\u115f\u2e80-\u303e\u3041-\u33ff\u3400-\u4dbf\u4e00-\u9fff\ua960-\ua97f\uac00-\ud7a3\uf900-\ufaff\ufe30-\ufe4f\uff00-\uff60\uffe0-\uffe6\u{1f300}-\u{1f64f}\u{1f900}-\u{1f9ff}\u{20000}-\u{3fffd}]/u;
const THAI = /[\u0e00-\u0e7f]/u;
const NO_WIDTH = /[\p{Mn}\p{Me}\p{Cf}]/u;
const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

/**
 * How wide a title is on a results page, in Latin letters, as the backend's `title_width` (G69c):
 * 2 for a wide character, 0 for a mark or an invisible format character, 1 for anything else. For
 * Latin text it is the length.
 */
export function titleWidth(text: string): number {
  let width = 0;
  for (const char of text.normalize("NFC")) {
    if (!NO_WIDTH.test(char)) width += WIDE.test(char) ? 2 : 1;
  }
  return width;
}

export type TitleFamily = "narrow" | "cjk" | "thai";

/**
 * "cjk" when wide characters take a third of the text's letter width, "thai" when Thai letters
 * are a third of its letters, else "narrow" (the backend's `_title_family`).
 */
export function titleFamily(text: string): TitleFamily {
  const letters = Array.from(text.normalize("NFC")).filter((char) =>
    LETTER_OR_DIGIT.test(char),
  );
  if (letters.length === 0) return "narrow";
  const wide = letters.filter((char) => WIDE.test(char)).length * 2;
  if (wide * 3 >= wide + letters.filter((char) => !WIDE.test(char)).length)
    return "cjk";
  if (letters.filter((char) => THAI.test(char)).length * 3 >= letters.length)
    return "thai";
  return "narrow";
}

/** Each family's range in width, inclusive, and the ceiling a long keyphrase may take it to. */
const TITLE_RANGES: Record<TitleFamily, [number, number, number]> = {
  narrow: [TITLE_MIN_CHARS, TITLE_MAX_CHARS, TITLE_MAX_CHARS_CEILING],
  cjk: [40, 60, 64],
  thai: [38, 55, 60],
};

/**
 * The widths a title may have, inclusive, as the backend's `title_range`: its family's range, with
 * room beside a long keyphrase up to the family's ceiling. Without a title, the keyphrase's family.
 */
export function titleRange(
  title: string,
  keyphrase?: string | null,
): [number, number] {
  const phrase = keyphrase ?? "";
  const [low, high, ceiling] = TITLE_RANGES[titleFamily(title || phrase)];
  // As matching reads it, with the Armenian ligature և as the one character it takes in a title.
  const keyphraseWidth = phrase
    ? titleWidth(forMatch(phrase).trim()) -
      (phrase.normalize("NFC").match(/և/g) ?? []).length
    : 0;
  return [
    low,
    Math.min(
      ceiling,
      Math.max(high, keyphraseWidth + TITLE_ROOM_BESIDE_KEYPHRASE),
    ),
  ];
}

/** The widest a title for this keyphrase may be (59 for a short Latin keyphrase). */
export function titleMaxChars(keyphrase?: string | null): number {
  return titleRange("", keyphrase)[1];
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

  const width = titleWidth(text);
  const [low, high] = titleRange(text, phrase);
  const inRange = width >= low && width <= high;
  // In the characters a reader counts: a Chinese, Japanese or Korean character is two widths.
  const unit = titleFamily(text) === "cjk" ? 2 : 1;
  const count = Math.ceil(width / unit);
  checks.push({
    id: "length",
    met: inRange,
    label: inRange
      ? `${count} characters`
      : `${count} characters, ${width < low ? `under ${low / unit}` : `over ${high / unit}`}`,
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
