/**
 * The run component's typical stage times, until this browser has its own: the workspace
 * analysis's come from staging's runs (D22), so "Finding competitors" no longer says "about 15 s"
 * for a step that takes about a minute.
 */

import {
  expectedStageMs,
  formatDuration,
  recordStageMs,
} from "@/lib/generate-content/run-timings";

describe("expectedStageMs", () => {
  beforeEach(() => window.localStorage.clear());

  it("gives the workspace analysis's stages their measured times", () => {
    expect(expectedStageMs("workspace-scrape")).toBe(15_000);
    expect(expectedStageMs("workspace-brand-voice")).toBe(20_000);
    expect(expectedStageMs("workspace-competitors")).toBe(60_000);
  });

  it("prefers this browser's own recent times once it has some", () => {
    window.localStorage.setItem(
      "rext-run-stage-times:3",
      JSON.stringify({ "workspace-competitors": [50_000, 70_000] }),
    );
    expect(expectedStageMs("workspace-competitors")).toBe(60_000);
    window.localStorage.setItem(
      "rext-run-stage-times:3",
      JSON.stringify({ "workspace-competitors": [40_000] }),
    );
    expect(expectedStageMs("workspace-competitors")).toBe(40_000);
  });

  it("never calls a stage's usual time less than a second", () => {
    // The title checks end at once when no title needs rewriting.
    for (const ms of [40, 90, 15]) recordStageMs("title-checks", ms);
    expect(expectedStageMs("title-checks")).toBe(1000);
    expect(formatDuration(expectedStageMs("title-checks") ?? 0)).toBe("1 s");
  });

  // rext-control#694 split "Writing five titles" from "Checking each title": a time kept for the
  // whole step under the earlier key would be shown as the writing's.
  it("ignores the times kept before the title stage was split", () => {
    window.localStorage.setItem(
      "rext-run-stage-times:2",
      JSON.stringify({ titles: [31_000] }),
    );
    expect(expectedStageMs("titles")).toBe(10_000);
    expect(expectedStageMs("title-checks")).toBe(2_000);
  });
});
