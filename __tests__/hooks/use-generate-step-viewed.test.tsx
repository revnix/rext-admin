/**
 * `generate_step_viewed` (rext-control task 712): sent once per arrival on a step of Generate,
 * through the app's analytics only, and never with anything a person typed.
 */
import { renderHook } from "@testing-library/react";

import { useGenerateStepViewed } from "@/hooks/use-generate-step-viewed";
import { analytics } from "@/lib/analytics";

jest.mock("@/lib/analytics", () => ({ analytics: { track: jest.fn() } }));
const track = analytics.track as jest.Mock;

type Props = Parameters<typeof useGenerateStepViewed>[0];
const start: Props = {
  index: 0,
  threadId: null,
  restored: false,
  fromLibrary: false,
};

describe("useGenerateStepViewed", () => {
  beforeEach(() => {
    track.mockClear();
    jest.useFakeTimers().setSystemTime(new Date("2026-10-08T09:00:00Z"));
  });
  afterEach(() => jest.useRealTimers());

  it("sends the step on arrival, and again only when the step changes", () => {
    const { rerender } = renderHook(
      (props: Props) => useGenerateStepViewed(props),
      {
        initialProps: start,
      },
    );
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenLastCalledWith("generate_step_viewed", {
      step: 1,
      step_name: "search_keyword",
      thread_id: undefined,
    });

    // The run starts: the page renders again on the same step, now with its run's id.
    rerender({ ...start, threadId: "thread-1" });
    rerender({ ...start, threadId: "thread-1" });
    expect(track).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(14_000);
    rerender({ ...start, index: 1, threadId: "thread-1" });
    expect(track).toHaveBeenCalledTimes(2);
    expect(track).toHaveBeenLastCalledWith("generate_step_viewed", {
      step: 2,
      step_name: "select_keyword",
      seconds_on_previous: 14,
      thread_id: "thread-1",
    });
  });

  it("says when the page was opened on a run that already existed", () => {
    const { rerender } = renderHook(
      (props: Props) => useGenerateStepViewed(props),
      {
        initialProps: { ...start, threadId: "thread-9", restored: true },
      },
    );
    // The first step shows for a moment while the run is read: not an arrival.
    expect(track).not.toHaveBeenCalled();

    rerender({
      index: 3,
      threadId: "thread-9",
      restored: true,
      fromLibrary: false,
    });
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenLastCalledWith("generate_step_viewed", {
      step: 4,
      step_name: "title",
      restored: true,
      thread_id: "thread-9",
    });
  });

  it("sends only the step, its fixed name, the seconds and the run's id", () => {
    const { rerender } = renderHook(
      (props: Props) => useGenerateStepViewed(props),
      {
        initialProps: start,
      },
    );
    rerender({ ...start, index: 2, threadId: "thread-1" });
    for (const [, properties] of track.mock.calls) {
      expect(
        Object.keys(properties).every((name) =>
          [
            "step",
            "step_name",
            "seconds_on_previous",
            "restored",
            "thread_id",
          ].includes(name),
        ),
      ).toBe(true);
    }
  });
});
