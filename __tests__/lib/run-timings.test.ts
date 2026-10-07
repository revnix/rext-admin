/**
 * The run component's typical stage times, until this browser has its own: the workspace
 * analysis's come from staging's runs (D22), so "Finding competitors" no longer says "about 15 s"
 * for a step that takes about a minute.
 */

import { expectedStageMs } from "@/lib/generate-content/run-timings";

describe("expectedStageMs", () => {
  beforeEach(() => window.localStorage.clear());

  it("gives the workspace analysis's stages their measured times", () => {
    expect(expectedStageMs("workspace-scrape")).toBe(15_000);
    expect(expectedStageMs("workspace-brand-voice")).toBe(20_000);
    expect(expectedStageMs("workspace-competitors")).toBe(60_000);
  });

  it("prefers this browser's own recent times once it has some", () => {
    window.localStorage.setItem(
      "rext-run-stage-times:2",
      JSON.stringify({ "workspace-competitors": [50_000, 70_000] }),
    );
    expect(expectedStageMs("workspace-competitors")).toBe(60_000);
    window.localStorage.setItem(
      "rext-run-stage-times:2",
      JSON.stringify({ "workspace-competitors": [40_000] }),
    );
    expect(expectedStageMs("workspace-competitors")).toBe(40_000);
  });
});
