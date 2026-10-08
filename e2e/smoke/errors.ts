import type { Page } from "@playwright/test";

/**
 * The errors a page raised by itself: an uncaught exception, or an error our own code logged. A request
 * that failed is not one of them (the browser logs those too): a signed-out page asks who the visitor is
 * and is told 401, and an analytics script may be refused in a test browser. Nor is Vercel's toolbar: Vercel
 * adds its script to every deployment that isn't production, and the dashboard's content policy refuses it.
 */
export function watchForErrors(page: Page): () => string[] {
  const seen: string[] = [];
  page.on("pageerror", (error) => seen.push(`uncaught: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (text.startsWith("Failed to load resource")) return;
    if (text.includes("https://vercel.live/")) return;
    seen.push(`console: ${text.slice(0, 300)}`);
  });
  return () => seen;
}
