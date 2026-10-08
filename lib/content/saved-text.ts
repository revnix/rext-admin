/** The longest article text a page takes: 500 KB. */
export const MAX_ARTICLE_TEXT = 500_000;

/**
 * An article's saved text as the article page shows it, and as its publish sends it: always a
 * string, cut at a sane length. An article with no text (one edited down to nothing in the
 * full-screen editor) has an empty one; it is not "no answer", or the page would go on showing
 * the text it held before.
 */
export function savedArticleText(body: unknown): string {
  return (typeof body === "string" ? body : "").slice(0, MAX_ARTICLE_TEXT);
}
