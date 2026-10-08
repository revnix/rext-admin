/**
 * The article page's saved text (task 706): an empty article has an empty text, not a missing one.
 */

import { MAX_ARTICLE_TEXT, savedArticleText } from "@/lib/content/saved-text";

describe("savedArticleText", () => {
  it("gives the text as saved", () => {
    expect(savedArticleText("## A heading\n\nText.")).toBe(
      "## A heading\n\nText.",
    );
  });

  it("gives an empty text for an article with none, whatever the backend sends for it", () => {
    expect(savedArticleText("")).toBe("");
    expect(savedArticleText(null)).toBe("");
    expect(savedArticleText(undefined)).toBe("");
  });

  it("cuts a text past the limit", () => {
    const long = "a".repeat(MAX_ARTICLE_TEXT + 10);
    expect(savedArticleText(long)).toHaveLength(MAX_ARTICLE_TEXT);
  });
});
