import {
  excludeJsonLdFromSeoResult,
  isJsonLdIssue,
} from "@/lib/generate-content/seo-issues";
import type { SEORESULT } from "@/types/generate-content";

const seo = (score: number, issues: SEORESULT["issues"]): SEORESULT =>
  ({
    seo_health_score: score,
    issue_summary: { critical: 0, errors: 0, warnings: 0 },
    issues,
  }) as SEORESULT;

describe("JSON-LD exclusion from content-level SEO", () => {
  it("hides JSON-LD issues from the UI and recounts the summary", () => {
    const result = excludeJsonLdFromSeoResult(
      seo(80, [
        { type: "JSON-LD", message: "JSON-LD Parsing Error", level: "ERROR" },
        {
          type: "Structured Data",
          message: "No Common Structured Data Detected",
          level: "INFO",
        },
        {
          type: "Meta Description",
          message: "Meta description too short",
          level: "WARNING",
        },
      ]),
    );

    expect(result.issues.map((i) => i.type)).toEqual(["Meta Description"]);
    expect(result.issue_summary).toEqual({
      critical: 0,
      errors: 0,
      warnings: 1,
    });
    expect(result.seo_health_score).toBe(82);
  });

  it.each([99, 100])("caps the compensated score at 100 (base %i)", (base) => {
    const result = excludeJsonLdFromSeoResult(
      seo(base, [
        { type: "JSON-LD", message: "JSON-LD Parsing Error", level: "ERROR" },
      ]),
    );
    expect(result.seo_health_score).toBe(100);
  });

  it("does not hide or compensate non-JSON-LD issues (already-filtered results pass through)", () => {
    const input = seo(70, [
      { type: "Title", message: "Title too long", level: "WARNING" },
      { type: "Images", message: "Image missing alt text", level: "ERROR" },
    ]);
    expect(excludeJsonLdFromSeoResult(input)).toBe(input);
  });

  it("handles missing results", () => {
    expect(excludeJsonLdFromSeoResult(null)).toBeNull();
    expect(isJsonLdIssue({ type: "Headings", message: "Missing H2" })).toBe(
      false,
    );
  });

  it.each(["Schema.org", "schema", "Microdata", "RDFa"])(
    "matches the exact element type %s like the backend does",
    (type) => {
      expect(
        isJsonLdIssue({ type, message: "Missing recommended field" }),
      ).toBe(true);
    },
  );
});
