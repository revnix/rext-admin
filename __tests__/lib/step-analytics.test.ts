/**
 * Generate's steps in analytics (rext-control task 712, the tracking plan's "Generate, step by
 * step"): one view per arrival on a step, with how long the step before it was on screen.
 */
import {
  createStepViewTracker,
  STEP_NAMES,
} from "@/lib/generate-content/step-analytics";
import { WORKFLOW_STEPS } from "@/lib/generate-content/workflow-steps";

const at = (seconds: number) => seconds * 1000;

describe("Generate's step views", () => {
  it("names each of the steps row's six steps, in its order", () => {
    expect(STEP_NAMES).toHaveLength(WORKFLOW_STEPS.length);
    expect(STEP_NAMES).toEqual([
      "search_keyword",
      "select_keyword",
      "content_type",
      "title",
      "outline",
      "article",
    ]);
  });

  it("counts the first step with no time before it, then each arrival with the seconds on the step before", () => {
    const tracker = createStepViewTracker();
    expect(tracker.arrive(0, at(0))).toEqual({
      step: 1,
      step_name: "search_keyword",
    });
    expect(tracker.arrive(1, at(12.4))).toEqual({
      step: 2,
      step_name: "select_keyword",
      seconds_on_previous: 12,
    });
    expect(tracker.arrive(2, at(40.6))).toEqual({
      step: 3,
      step_name: "content_type",
      seconds_on_previous: 28,
    });
  });

  it("counts a step once however often the page renders it", () => {
    const tracker = createStepViewTracker();
    expect(tracker.arrive(0, at(0))).not.toBeNull();
    expect(tracker.arrive(0, at(3))).toBeNull();
    expect(tracker.arrive(0, at(9))).toBeNull();
    // The time on the step runs from the arrival, not from the last render.
    expect(tracker.arrive(1, at(20))?.seconds_on_previous).toBe(20);
  });

  it("counts coming back to a step as an arrival", () => {
    const tracker = createStepViewTracker();
    tracker.arrive(3, at(0));
    tracker.arrive(4, at(30));
    expect(tracker.arrive(3, at(45))).toEqual({
      step: 4,
      step_name: "title",
      seconds_on_previous: 15,
    });
  });

  it("marks the first step of a page opened on a run that already existed, and not the ones after", () => {
    const tracker = createStepViewTracker({ restored: true });
    // The page shows the first step for a moment while the run is read: an existing run is
    // never there.
    expect(tracker.arrive(0, at(0))).toBeNull();
    expect(tracker.arrive(4, at(1))).toEqual({
      step: 5,
      step_name: "outline",
      restored: true,
    });
    expect(tracker.arrive(5, at(61))).toEqual({
      step: 6,
      step_name: "article",
      seconds_on_previous: 60,
    });
  });

  it("counts the first step again once such a page starts a new article", () => {
    const tracker = createStepViewTracker({ restored: true });
    tracker.arrive(5, at(0));
    expect(tracker.arrive(0, at(90))).toEqual({
      step: 1,
      step_name: "search_keyword",
      seconds_on_previous: 90,
    });
  });

  it("leaves out the two keyword steps of a run started from a saved keyword: they are never shown", () => {
    const tracker = createStepViewTracker({ fromLibrary: true });
    expect(tracker.arrive(0, at(0))).toBeNull();
    expect(tracker.arrive(1, at(5))).toBeNull();
    expect(tracker.arrive(2, at(20))).toEqual({
      step: 3,
      step_name: "content_type",
    });
  });

  it("sends nothing for a step the row doesn't have", () => {
    const tracker = createStepViewTracker();
    expect(tracker.arrive(-1, at(0))).toBeNull();
    expect(tracker.arrive(6, at(0))).toBeNull();
  });
});
