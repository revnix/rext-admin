/**
 * Readability in words (#704): the Flesch reading-ease score in five bands.
 */

import { readabilityWord } from "@/lib/content/readability";

describe("readabilityWord", () => {
  it.each([
    [100, "Very easy"],
    [80, "Very easy"],
    [79.9, "Easy"],
    [70, "Easy"],
    [69, "Moderate"],
    [50, "Moderate"],
    [49, "Difficult"],
    [30, "Difficult"],
    [29, "Very difficult"],
    [0, "Very difficult"],
    [-12, "Very difficult"],
  ])("reads %d as %s", (score, word) => {
    expect(readabilityWord(score)).toBe(word);
  });
});
