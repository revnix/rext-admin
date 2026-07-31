import {
  formatWordCountRange,
  getContentTypeWordCountRange,
} from "@/lib/generate-content/content-type-word-count";

describe("content-type word-count ranges", () => {
  it("returns the backend range for normalized content-type names", () => {
    expect(getContentTypeWordCountRange("Blog")).toEqual({
      min: 800,
      max: 2000,
    });
    expect(getContentTypeWordCountRange("sales_page")).toEqual({
      min: 600,
      max: 4000,
    });
  });

  it("does not invent a range for an unbounded content type", () => {
    expect(getContentTypeWordCountRange("pricing-page")).toBeNull();
  });

  it("formats permitted ranges for validation messages", () => {
    expect(formatWordCountRange({ min: 800, max: 2000 })).toBe(
      "800–2,000 words",
    );
  });
});
