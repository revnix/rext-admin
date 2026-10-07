/**
 * Readability in words (the founder's feedback v2, #704): the Flesch reading-ease score (0 to 100,
 * higher is easier) in five bands, shown instead of the number. The website names the same bands.
 */
export const READABILITY_BANDS = [
  { min: 80, word: "Very easy" },
  { min: 70, word: "Easy" },
  { min: 50, word: "Moderate" },
  { min: 30, word: "Difficult" },
  { min: Number.NEGATIVE_INFINITY, word: "Very difficult" },
] as const;

export type ReadabilityWord = (typeof READABILITY_BANDS)[number]["word"];

export function readabilityWord(score: number): ReadabilityWord {
  const band = READABILITY_BANDS.find((b) => score >= b.min);
  return band ? band.word : "Very difficult";
}
