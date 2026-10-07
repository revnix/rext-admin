import { deriveActiveGenerationViewState } from "@/lib/generate-content/background-generation-view-state";

describe("deriveActiveGenerationViewState", () => {
  it.each([
    ["Research", 42, "Research"],
    ["Draft", 50, "Draft"],
    ["Style pass", 58, "Style pass"],
    ["Checks", 78, "Checks"],
    ["Preparing your article", 96, "Preparing your article"],
  ])(
    "names the stage %s by the run component's name",
    (stage, progress, message) => {
      expect(deriveActiveGenerationViewState(progress, stage).message).toBe(
        message,
      );
    },
  );

  it.each([
    ["Drafting your article", 42, "Draft"],
    ["Refining tone and structure", 58, "Style pass"],
    ["Running quality checks", 78, "Checks"],
    ["Reviewing SEO and readability", 74, "Checks"],
  ])(
    "reads a job saved with the older words (%s)",
    (stage, progress, message) => {
      expect(deriveActiveGenerationViewState(progress, stage).message).toBe(
        message,
      );
    },
  );

  it("falls back to the progress when the job has no stage words", () => {
    expect(deriveActiveGenerationViewState(80).message).toBe("Checks");
    expect(deriveActiveGenerationViewState(60).message).toBe("Style pass");
    expect(deriveActiveGenerationViewState(42).message).toBe("Draft");
  });

  it("never names Injecting EEAT, which has no node behind it", () => {
    for (const progress of [24, 42, 58, 74, 78, 96]) {
      expect(
        JSON.stringify(deriveActiveGenerationViewState(progress)),
      ).not.toMatch(/EEAT|Humaniz/i);
    }
  });
});
