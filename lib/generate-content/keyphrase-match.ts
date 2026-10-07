import { containsKeyphrase } from "./title-score";

/**
 * Where the focus keyphrase sits in a title, found by the score's own matching (`containsKeyphrase`,
 * the backend's `contains_keyphrase`), so the keyphrase shows in bold exactly where the score counts
 * it, and "leads with it" holds for a title the score says has it.
 */

/** A letter, mark, digit or invisible format character: none of them ends a word beside another. */
const JOINS = /[\p{L}\p{M}\p{N}\p{Cf}]/u;

/** Scripts written without spaces between words, where a word may end between any two characters. */
const UNSPACED =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}\p{Script=Lao}\p{Script=Myanmar}\p{Script=Khmer}]/u;

/** Whether a word may end between two characters (or at the title's start or end). */
function wordEdge(before: string | undefined, after: string | undefined) {
  if (before === undefined || after === undefined) return true;
  return (
    !(JOINS.test(before) && JOINS.test(after)) ||
    UNSPACED.test(before) ||
    UNSPACED.test(after)
  );
}

export interface TitlePart {
  text: string;
  /** An occurrence of the keyphrase. */
  keyphrase: boolean;
}

/**
 * A title as runs of text and the keyphrase's occurrences, in order. Each occurrence is the shortest
 * run between two word edges that `containsKeyphrase` finds the keyphrase in, so "SEO-agency" is one
 * for "seo agency" and "agencyx" never is. Without a keyphrase, the title as one run.
 */
export function splitByKeyphrase(
  title: string,
  keyphrase: string | null | undefined,
): TitlePart[] {
  const chars = Array.from(title);
  const text = (from: number, to: number) => chars.slice(from, to).join("");
  const edges: number[] = [];
  for (let i = 0; i <= chars.length; i++) {
    if (wordEdge(chars[i - 1], chars[i])) edges.push(i);
  }
  const parts: TitlePart[] = [];
  let from = 0;
  while (keyphrase && containsKeyphrase(text(from, chars.length), keyphrase)) {
    const start = from;
    const end =
      edges.find(
        (edge) =>
          edge > start && containsKeyphrase(text(start, edge), keyphrase),
      ) ?? chars.length;
    const first =
      edges.findLast(
        (edge) =>
          edge >= start &&
          edge < end &&
          containsKeyphrase(text(edge, end), keyphrase),
      ) ?? start;
    if (first > start)
      parts.push({ text: text(start, first), keyphrase: false });
    parts.push({ text: text(first, end), keyphrase: true });
    from = end;
  }
  if (from < chars.length) {
    parts.push({ text: text(from, chars.length), keyphrase: false });
  }
  return parts;
}

/**
 * Whether the title opens with the keyphrase: nothing but punctuation, symbols or spaces before its
 * first occurrence ("Vegetable Garden Planner: …", "“Vegetable garden planner” …").
 */
export function leadsWithKeyphrase(
  title: string,
  keyphrase: string | null | undefined,
): boolean {
  const [first, second] = splitByKeyphrase(title, keyphrase);
  if (!first) return false;
  if (first.keyphrase) return true;
  return !!second?.keyphrase && !/[\p{L}\p{N}]/u.test(first.text);
}
