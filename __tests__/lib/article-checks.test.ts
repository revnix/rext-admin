/**
 * A saved article's checks, as the editor's checklist drawer reads them (task 706).
 */

import { articleChecks } from "@/lib/content/article-checks";

describe("articleChecks", () => {
  it("reads the on-page result from its JSON text and the trust score from its number", () => {
    const checks = articleChecks({
      seo_data: {
        seo_details: JSON.stringify({
          seo_health_score: 92,
          issues: [{ level: "GOOD", message: "Optimal Title Length" }],
        }),
        trust_score: 79,
      },
      checklist: null,
    });
    expect(checks.seoScore?.seo_health_score).toBe(92);
    expect(checks.seoScore?.issues).toHaveLength(1);
    expect(checks.trustScore?.score).toBe(79);
    expect(checks.checklist).toBeNull();
  });

  it("gives nothing for an article stored without checks", () => {
    expect(articleChecks({})).toEqual({
      seoScore: null,
      checklist: null,
      trustScore: null,
    });
    expect(
      articleChecks({ seo_data: { trust_score: 0 } }).trustScore,
    ).toBeNull();
  });

  it("gives no on-page result for text that isn't JSON", () => {
    expect(
      articleChecks({ seo_data: { seo_details: "{not json" } }).seoScore,
    ).toBeNull();
  });
});
