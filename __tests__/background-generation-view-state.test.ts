import { deriveActiveGenerationViewState } from "@/lib/generate-content/background-generation-view-state";

describe("restored background generation view state", () => {
  it("restores the drafting overlay and pipeline", () => {
    expect(
      deriveActiveGenerationViewState(42, "Drafting your article"),
    ).toEqual({
      message: "Generating Content...",
      description: "Creating the first draft based on the approved outline...",
      pipelineSteps: [
        { label: "Generating Content", status: "active" },
        { label: "Humanizing", status: "pending" },
        { label: "Reviewing Content", status: "pending" },
      ],
    });
  });

  it("keeps the early preparation stage in the drafting state", () => {
    expect(
      deriveActiveGenerationViewState(24, "Preparing your article"),
    ).toMatchObject({
      message: "Generating Content...",
      pipelineSteps: [
        { label: "Generating Content", status: "active" },
        { label: "Humanizing", status: "pending" },
        { label: "Reviewing Content", status: "pending" },
      ],
    });
  });

  it("restores the humanizing milestone from the persisted progress", () => {
    expect(
      deriveActiveGenerationViewState(58, "Refining tone and structure"),
    ).toMatchObject({
      message: "Humanizing Content...",
      pipelineSteps: [
        { label: "Generating Content", status: "done" },
        { label: "Humanizing", status: "active" },
        { label: "Reviewing Content", status: "pending" },
      ],
    });
  });

  it("restores the review milestone from the server stage", () => {
    expect(
      deriveActiveGenerationViewState(74, "Reviewing SEO and readability"),
    ).toMatchObject({
      message: "Reviewing Content...",
      pipelineSteps: [
        { label: "Generating Content", status: "done" },
        { label: "Humanizing", status: "done" },
        { label: "Reviewing Content", status: "active" },
      ],
    });
  });
});
