import { excludeJsonLdFromSeoResult } from "@/lib/generate-content/seo-issues";
import { safeJsonParse } from "@/lib/utils";
import type { ContentSEODataSchema } from "@/types/content";
import type {
  ContentChecklist,
  SEORESULT,
  TrustScore,
} from "@/types/generate-content";

export type ArticleChecks = {
  seoScore: SEORESULT | null;
  checklist: ContentChecklist | null;
  trustScore: TrustScore | null;
};

/**
 * What the checklist shows for a saved article: the scores stored with it when it was written.
 * The on-page result is kept as JSON text; the trust score as its one number, so its parts are
 * zero here (the checklist reads the number only).
 */
export function articleChecks(article: {
  seo_data?: Pick<ContentSEODataSchema, "seo_details" | "trust_score"> | null;
  checklist?: ContentChecklist | null;
}): ArticleChecks {
  const trust = article.seo_data?.trust_score;
  return {
    seoScore: excludeJsonLdFromSeoResult(
      safeJsonParse<SEORESULT>(article.seo_data?.seo_details),
    ),
    checklist: article.checklist ?? null,
    trustScore:
      typeof trust === "number" && trust > 0
        ? {
            score: trust,
            trust_score: trust,
            author_credibility: 0,
            expertise: 0,
            authority: 0,
            trustworthiness: 0,
            citations_references: 0,
            content_accuracy: 0,
            freshness: 0,
            transparency: 0,
            spam_signals: 0,
            technical_trust: 0,
            reasoning: "",
          }
        : null,
  };
}
