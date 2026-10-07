import type { SerpResult } from "@/lib/keywords/serp-results";
import { leadsWithKeyphrase } from "./keyphrase-match";
import {
  containsKeyphrase,
  normalizeTitle,
  titleMaxChars,
} from "./title-score";

/**
 * What the search results' top ten titles have in common, for the Title step's panel (task 695): how
 * many use the keyphrase and lead with it, their typical length and how many run past the limit, and
 * the words three or more of them share. A result is matched and measured as the score reads a
 * candidate (title-score.ts), so the panel and the checks agree.
 */
export interface SerpTitleFacts {
  total: number;
  /** The positions whose title has the keyphrase, and those that open with it; null without one. */
  keyphrase: { uses: number[]; leads: number[] } | null;
  /** The median length, the score's limit, and how many titles run past it. */
  length: { typical: number; limit: number; over: number };
  /**
   * The words three or more titles share, the most shared first; null where they can't be told:
   * a language other than English (the only stop-word list here), or a script without spaces.
   */
  sharedWords: { word: string; count: number }[] | null;
}

/** A title's length as `scoreTitle` measures it: code points, after `normalizeTitle`. */
export function titleLength(title: string): number {
  return Array.from(normalizeTitle(title)).length;
}

/** A title's length, and whether it runs past the score's limit, where a results page may cut it. */
export function measureTitle(
  title: string,
  keyphrase?: string | null,
): { length: number; cutOff: boolean } {
  const length = titleLength(title);
  return { length, cutOff: length > titleMaxChars(keyphrase) };
}

export function serpTitleFacts(
  results: readonly SerpResult[],
  keyphrase?: string | null,
): SerpTitleFacts | null {
  if (results.length === 0) return null;
  const phrase = keyphrase?.trim() || null;
  const sizes = results.map((result) => measureTitle(result.title, phrase));
  // The gate's results are read as sent: one without a position counts from its place.
  const where = (test: (title: string, phrase: string) => boolean) =>
    results.flatMap((result, index) =>
      phrase && test(result.title, phrase)
        ? [result.position ?? index + 1]
        : [],
    );
  return {
    total: results.length,
    keyphrase: phrase
      ? { uses: where(containsKeyphrase), leads: where(leadsWithKeyphrase) }
      : null,
    length: {
      typical: median(sizes.map((size) => size.length)),
      limit: titleMaxChars(phrase),
      over: sizes.filter((size) => size.cutOff).length,
    },
    sharedWords: sharedWords(results, phrase),
  };
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/** English words too common to say anything about a title. */
const STOP_WORDS = new Set(
  "a an and are as at be by can do does for from has have how i in into is it its me my of on or our than that the their this to was we what when where which who why will with you your".split(
    " ",
  ),
);

/** Common English words that are rare as words of other languages: an English set has them. */
const ENGLISH = new Set(
  "the and for of with your how to what why you".split(" "),
);

/** Lower case, apostrophes dropped ("Gardener's" is "gardeners"), split at anything else. */
function words(text: string): string[] {
  return text
    .normalize("NFC")
    .toLowerCase()
    .replace(/['’ʼ]/g, "")
    .split(/[^\p{L}\p{M}\p{N}]+/u)
    .filter(Boolean);
}

/** A site's names: its domain's labels but the last, three characters or more (extension, umn). */
function siteNames(domain: string): Set<string> {
  const labels = domain
    .toLowerCase()
    .replace(/^www\./, "")
    .split(".");
  return new Set(
    labels
      .slice(0, -1)
      .map((label) => label.replace(/[^\p{L}\p{N}]/gu, ""))
      .filter((label) => label.length >= 3),
  );
}

/**
 * A title's words without the site's own name, as one word or several: "Smart Gardener" for
 * smartgardener.com, "The Spruce" for thespruce.com, "Better Homes & Gardens" for bhg.com.
 */
function withoutSiteName(list: string[], names: Set<string>): string[] {
  const dropped = new Set<number>();
  for (let i = 0; i < list.length; i++) {
    for (let n = 1; n <= 4 && i + n <= list.length; n++) {
      const run = list.slice(i, i + n);
      const initials = run.map((word) => word[0]).join("");
      if (names.has(run.join("")) || (n > 1 && names.has(initials))) {
        for (let k = i; k < i + n; k++) dropped.add(k);
      }
    }
  }
  return list.filter((_, i) => !dropped.has(i));
}

function sharedWords(
  results: readonly SerpResult[],
  keyphrase: string | null,
): SerpTitleFacts["sharedWords"] {
  // A letter outside the Latin script: no stop-word list for it, or no spaces to split it at.
  if (results.some((r) => /(?=\p{L})\P{Script=Latin}/u.test(r.title))) {
    return null;
  }
  const titles = results.map((r) =>
    withoutSiteName(words(r.title), siteNames(r.domain ?? "")),
  );
  const english = titles.filter((list) => list.some((w) => ENGLISH.has(w)));
  if (english.length * 3 < titles.length) return null;

  const phrase = new Set(words(keyphrase ?? ""));
  const counts = new Map<string, number>();
  for (const list of titles) {
    const kept = list.filter(
      (word) =>
        word.length > 1 &&
        !STOP_WORDS.has(word) &&
        !phrase.has(word) &&
        !phrase.has(word.replace(/s$/, "")) &&
        // A number says little, but a year shared by three titles does.
        (!/^\d+$/.test(word) || /^(19|20)\d\d$/.test(word)),
    );
    for (const word of new Set(kept)) {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }
  return [...counts]
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .map(([word, count]) => ({ word, count }));
}

/** "position 3", or "positions 1, 2 and 9". */
export function positionsInWords(positions: readonly number[]): string {
  if (positions.length === 1) return `position ${positions[0]}`;
  return `positions ${positions.slice(0, -1).join(", ")} and ${positions.at(-1)}`;
}

/**
 * How a chosen title compares with the top ten on the keyphrase, in one sentence ("Leads with the
 * keyword, like positions 1, 2 and 9"); null without a keyphrase.
 */
export function comparePick(
  title: string,
  facts: SerpTitleFacts,
  keyphrase?: string | null,
): string | null {
  if (!facts.keyphrase || !keyphrase) return null;
  const { uses, leads } = facts.keyphrase;
  if (leadsWithKeyphrase(title, keyphrase)) {
    return leads.length > 0
      ? `Leads with the keyword, like ${positionsInWords(leads)}`
      : "Leads with the keyword, which none of the top ten do";
  }
  if (containsKeyphrase(title, keyphrase)) {
    const later = uses.filter((position) => !leads.includes(position));
    return later.length > 0
      ? `Has the keyword after other words, like ${positionsInWords(later)}`
      : "Has the keyword after other words, which none of the top ten do";
  }
  return uses.length > 0
    ? `Leaves out the keyword, which ${positionsInWords(uses)} ${uses.length === 1 ? "uses" : "use"}`
    : "Leaves out the keyword, like all of the top ten";
}
