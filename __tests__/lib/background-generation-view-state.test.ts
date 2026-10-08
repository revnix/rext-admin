import { deriveActiveGenerationViewState } from "@/lib/generate-content/background-generation-view-state";

describe("deriveActiveGenerationViewState", () => {
  it.each([
    ["Researching the topic", 42, "Researching the topic"],
    ["Writing the first draft", 50, "Writing the first draft"],
    ["Polishing the wording", 58, "Polishing the wording"],
    ["Checking readability and SEO", 78, "Checking readability and SEO"],
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
    // The names before task 838, which a job saved by an open tab still holds.
    ["Research", 42, "Researching the topic"],
    ["Draft", 50, "Writing the first draft"],
    ["Style pass", 58, "Polishing the wording"],
    ["Checks", 78, "Checking readability and SEO"],
    ["Drafting your article", 42, "Writing the first draft"],
    ["Refining tone and structure", 58, "Polishing the wording"],
    ["Running quality checks", 78, "Checking readability and SEO"],
    ["Reviewing SEO and readability", 74, "Checking readability and SEO"],
  ])(
    "reads a job saved with the older words (%s)",
    (stage, progress, message) => {
      expect(deriveActiveGenerationViewState(progress, stage).message).toBe(
        message,
      );
    },
  );

  it("falls back to the progress when the job has no stage words", () => {
    expect(deriveActiveGenerationViewState(80).message).toBe(
      "Checking readability and SEO",
    );
    expect(deriveActiveGenerationViewState(60).message).toBe(
      "Polishing the wording",
    );
    expect(deriveActiveGenerationViewState(42).message).toBe(
      "Writing the first draft",
    );
  });

  it("never names Injecting EEAT, which has no node behind it", () => {
    for (const progress of [24, 42, 58, 74, 78, 96]) {
      expect(
        JSON.stringify(deriveActiveGenerationViewState(progress)),
      ).not.toMatch(/EEAT|Humaniz/i);
    }
  });
});
