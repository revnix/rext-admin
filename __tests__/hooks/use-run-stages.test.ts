import { act, renderHook } from "@testing-library/react";
import { useRunStages } from "@/hooks/use-run-stages";
import { expectedStageMs } from "@/lib/generate-content/run-timings";

beforeEach(() => window.localStorage.clear());

const states = (run: ReturnType<typeof useRunStages>["run"]) =>
  run?.stages.map((stage) => stage.state);

describe("useRunStages", () => {
  it("starts a phase at its first stage and moves it with the stream's nodes", () => {
    const { result } = renderHook(() => useRunStages());
    act(() => result.current.start("outline"));
    expect(states(result.current.run)).toEqual(["active", "pending"]);
    act(() => result.current.nodeDone("map_keyword_clusters"));
    expect(states(result.current.run)).toEqual(["complete", "active"]);
    act(() => result.current.settle());
    expect(states(result.current.run)).toEqual(["complete", "complete"]);
  });

  it("starts a run picked up mid-way at the stage the status names", () => {
    const { result } = renderHook(() => useRunStages());
    act(() => result.current.start("article", { joined: true, at: "style" }));
    expect(states(result.current.run)).toEqual([
      "complete",
      "complete",
      "active",
      "pending",
    ]);
  });

  it("learns the times of a run watched from its start, not of one picked up mid-way", () => {
    jest.useFakeTimers({ now: 0 });
    try {
      const { result } = renderHook(() => useRunStages());
      act(() => result.current.start("titles", { joined: true }));
      act(() => jest.advanceTimersByTime(3000));
      act(() => result.current.settle());
      expect(expectedStageMs("titles")).toBe(12_000);

      act(() => result.current.start("titles"));
      act(() => jest.advanceTimersByTime(4000));
      act(() => result.current.settle());
      expect(expectedStageMs("titles")).toBe(4000);
    } finally {
      jest.useRealTimers();
    }
  });

  it("fails the running stage on a cancel", () => {
    const { result } = renderHook(() => useRunStages());
    act(() => result.current.start("analysis"));
    act(() => result.current.fail());
    expect(states(result.current.run)).toEqual([
      "failed",
      "skipped",
      "skipped",
    ]);
  });
});
