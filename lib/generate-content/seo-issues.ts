import type { Issue, SEORESULT } from "@/types/generate-content";

/**
 * Content-level on-page SEO excludes JSON-LD / structured-data checks: that
 * markup is emitted by the CMS or theme at publish time, not written by the
 * author, so it must neither appear as an issue nor lower the score.
 *
 * The backend already filters these out and adds the compensation before
 * results are saved. This mirrors that rule for results saved before the
 * backend change. It is idempotent: when nothing is filtered (every new
 * result), the score is left alone, so compensation is never applied twice.
 */

export const JSON_LD_SCORE_COMPENSATION = 2;
export const MAX_SEO_SCORE = 100;

// Kept in step with the backend (`_is_jsonld_issue` in the content utils):
// an exact element-type match, a type substring match, then a message match.
const JSON_LD_EXACT_TYPES = new Set([
  "schema",
  "schema_markup",
  "schema.org",
  "microdata",
  "rdfa",
]);

const JSON_LD_TYPE_TOKENS = [
  "json-ld",
  "jsonld",
  "json_ld",
  "structured data",
  "structured_data",
];

const JSON_LD_MESSAGE_TOKENS = [
  "json-ld",
  "json ld",
  "jsonld",
  "structured data",
  "schema.org",
  "schema markup",
  "microdata",
  "rdfa",
];

export function isJsonLdIssue(issue: Pick<Issue, "type" | "message">): boolean {
  const type = (issue.type || "").toLowerCase().trim();
  const message = (issue.message || "").toLowerCase();

  if (JSON_LD_EXACT_TYPES.has(type)) return true;
  if (JSON_LD_TYPE_TOKENS.some((token) => type.includes(token))) return true;
  return JSON_LD_MESSAGE_TOKENS.some((token) => message.includes(token));
}

export function excludeJsonLdFromSeoResult<
  T extends SEORESULT | null | undefined,
>(seo: T): T {
  if (!seo || !Array.isArray(seo.issues)) return seo;

  const issues = seo.issues.filter((issue) => !isJsonLdIssue(issue));
  if (issues.length === seo.issues.length) return seo;

  const count = (level: string) =>
    issues.filter((issue) => (issue.level || "").toUpperCase() === level)
      .length;

  return {
    ...seo,
    issues,
    issue_summary: {
      critical: count("CRITICAL"),
      errors: count("ERROR"),
      warnings: count("WARNING"),
    },
    seo_health_score: Math.min(
      MAX_SEO_SCORE,
      (Number(seo.seo_health_score) || 0) + JSON_LD_SCORE_COMPENSATION,
    ),
  };
}
