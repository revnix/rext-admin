export type WordCountRange = {
  min: number;
  max: number;
};

// Mirrors the `target_word_count` constraints in the backend outline models.
// Types without a bounded backend field deliberately have no entry.
const CONTENT_TYPE_WORD_COUNT_RANGES: Record<string, WordCountRange> = {
  blog: { min: 800, max: 2000 },
  "how-to-guide": { min: 1500, max: 3000 },
  explainer: { min: 400, max: 4000 },
  "pillar-content": { min: 4500, max: 6000 },
  checklist: { min: 400, max: 3000 },
  tutorial: { min: 1500, max: 3000 },
  faq: { min: 500, max: 4000 },
  "white-paper": { min: 1500, max: 15000 },
  "case-study": { min: 800, max: 1500 },
  glossary: { min: 600, max: 6000 },
  "resource-list": { min: 500, max: 5000 },
  comparison: { min: 1500, max: 3000 },
  "best-tools": { min: 600, max: 4000 },
  alternatives: { min: 600, max: 4000 },
  "in-depth-review": { min: 800, max: 6000 },
  "pros-cons": { min: 500, max: 3500 },
  "product-roundup": { min: 700, max: 5000 },
  "buying-guide": { min: 700, max: 5000 },
  "brand-page": { min: 500, max: 2500 },
  "product-homepage": { min: 500, max: 3500 },
  "feature-overview": { min: 400, max: 2500 },
  documentation: { min: 500, max: 5000 },
  "login-guide": { min: 300, max: 2000 },
  "contact-us": { min: 200, max: 1500 },
  "about-us": { min: 400, max: 2000 },
  "help-center": { min: 500, max: 5000 },
  "sales-page": { min: 600, max: 4000 },
  "signup-page": { min: 200, max: 1500 },
  "landing-page": { min: 400, max: 1200 },
  "service-page": { min: 500, max: 3000 },
};

const normalizeContentType = (contentType: string) =>
  contentType
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");

export const getContentTypeWordCountRange = (
  contentType?: string,
): WordCountRange | null => {
  if (!contentType) return null;
  return (
    CONTENT_TYPE_WORD_COUNT_RANGES[normalizeContentType(contentType)] ?? null
  );
};

export const formatWordCountRange = ({ min, max }: WordCountRange) =>
  `${min.toLocaleString()}–${max.toLocaleString()} words`;
