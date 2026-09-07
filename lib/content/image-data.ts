/**
 * Image state derived from the article body.
 *
 * The editor's markdown is the single source of truth for an article's images.
 * `images_data` used to be sent as a hardcoded `{}` on every save, which wiped
 * the column, and anything it held could drift out of step with what the user
 * could actually see. Deriving it from the body on each save means removing an
 * image in the editor removes it everywhere — including the WordPress featured
 * image, which the backend resolves from this field first.
 */

export type DerivedImage = {
  url: string;
  alt_text: string;
};

export type DerivedImagesData = {
  featured_image_url?: string;
  featured_image_alt?: string;
  images: DerivedImage[];
};

/** Markdown `![alt](src)`, ignoring an optional `"title"` suffix. */
const MARKDOWN_IMAGE_RE = /!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)/g;
/** Rendered `<img src="..." alt="...">`, with either attribute order. */
const HTML_IMAGE_RE = /<img\b[^>]*>/gi;
const SRC_ATTR_RE = /\bsrc=["']([^"']+)["']/i;
const ALT_ATTR_RE = /\balt=["']([^"']*)["']/i;

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function isPublishableImageUrl(url: string): boolean {
  // Only real, fetchable images count. `rext-placeholder:` markers are upload
  // slots the user never filled, and data/blob URLs cannot be re-fetched by
  // the backend when it copies the image into the WordPress media library.
  return /^https?:\/\//i.test(url);
}

/**
 * Every image embedded in the article body, in document order, deduplicated by
 * URL. Accepts markdown, HTML, or a mixture of the two.
 */
export function extractContentImages(
  body: string | null | undefined,
): DerivedImage[] {
  if (!body) return [];

  const found: Array<DerivedImage & { index: number }> = [];

  for (const match of body.matchAll(MARKDOWN_IMAGE_RE)) {
    const url = decodeEntities((match[2] ?? "").trim());
    if (!isPublishableImageUrl(url)) continue;
    found.push({
      url,
      alt_text: decodeEntities((match[1] ?? "").trim()),
      index: match.index ?? 0,
    });
  }

  for (const match of body.matchAll(HTML_IMAGE_RE)) {
    const tag = match[0];
    const url = decodeEntities((tag.match(SRC_ATTR_RE)?.[1] ?? "").trim());
    if (!isPublishableImageUrl(url)) continue;
    found.push({
      url,
      alt_text: decodeEntities((tag.match(ALT_ATTR_RE)?.[1] ?? "").trim()),
      index: match.index ?? 0,
    });
  }

  found.sort((a, b) => a.index - b.index);

  const seen = new Set<string>();
  const images: DerivedImage[] = [];
  for (const image of found) {
    if (seen.has(image.url)) continue;
    seen.add(image.url);
    images.push({ url: image.url, alt_text: image.alt_text });
  }
  return images;
}

/**
 * The `images_data` payload for a save/publish, derived from the current body.
 *
 * Always returns a concrete object — never `undefined` — because the backend
 * skips `None` when updating, so an omitted field would silently keep the
 * previous publish's image. `{ images: [] }` is how "the user removed the
 * image" is stated explicitly.
 */
export function deriveImagesData(
  body: string | null | undefined,
): DerivedImagesData {
  const images = extractContentImages(body);
  const featured = images[0];
  return {
    ...(featured
      ? {
          featured_image_url: featured.url,
          featured_image_alt: featured.alt_text,
        }
      : {}),
    images,
  };
}
