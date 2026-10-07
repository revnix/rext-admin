import { marked } from "marked";

/**
 * An article's Markdown as the HTML the app stores beside it (`body_html`) and shows in its preview:
 * one renderer, so the article page and the full-screen editor save the same HTML for the same
 * Markdown (the backend publishes the stored row).
 */

// Custom renderers: links open in new tab; images get fallback placeholder on error
marked.use({
  renderer: {
    code({ text, lang }: { text: string; lang?: string }) {
      const languageClass = lang ? `language-${lang}` : "";
      const escapedText = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

      return `<div class="relative group my-6 rounded-md overflow-hidden bg-surface-inset border border-border">
        ${
          lang
            ? `<div class="flex items-center justify-between px-4 py-2 border-b border-border">
                <span class="text-caption font-mono text-muted-foreground">${lang}</span>
              </div>`
            : ""
        }
        <div class="px-4 py-4 overflow-x-auto">
          <pre class="!m-0 !p-0 !bg-transparent"><code class="${languageClass} text-table font-mono text-foreground">${escapedText}</code></pre>
        </div>
      </div>`;
    },
    link({
      href,
      title,
      text,
    }: {
      href: string;
      title?: string | null;
      text: string;
    }) {
      const titleAttr = title ? ` title="${title}"` : "";
      return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
    },
    image({
      href,
      title,
      text,
    }: {
      href: string;
      title?: string | null;
      text: string;
    }) {
      const alt = text || title || "";
      const caption = title || text || "";
      const placeholder = `
        <div class="content-image-placeholder" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/>
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
          </svg>
        </div>`;
      return `
        <figure class="content-image-figure">
          <img
            src="${href}"
            alt="${alt}"
            loading="lazy"
            class="content-image"
            onerror="this.closest('figure').classList.add('content-image-broken'); this.style.display='none';"
          />
          ${placeholder}
          ${caption ? `<figcaption class="content-image-caption">${caption}</figcaption>` : ""}
        </figure>`;
    },
  },
});

export function articleHtml(markdown: string | null | undefined): string {
  if (!markdown) return "";
  const result = marked.parse(markdown);
  return typeof result === "string" ? result : "";
}
