import { deriveBackgroundProgress } from "@/lib/generate-content/background-progress";

describe("deriveBackgroundProgress, a run that ended with an error", () => {
  it("calls a run with no search results stopped, with its message", () => {
    expect(
      deriveBackgroundProgress("success", {
        values: {
          content: {
            error: "No search results were found for this keyword.",
            error_code: "no_serp_data",
          },
        },
      }),
    ).toEqual({
      progress: 100,
      stage: "Generation stopped",
      error: "No search results were found for this keyword.",
    });
  });

  it("keeps calling other errors a failure", () => {
    expect(
      deriveBackgroundProgress("success", {
        values: {
          content: {
            error: "Insufficient credits.",
            error_code: "insufficient_credits",
          },
        },
      }).stage,
    ).toBe("Generation failed");
  });
});
