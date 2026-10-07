import { act, renderHook } from "@testing-library/react";
import { useTimedOut } from "@/hooks/use-timed-out";

describe("useTimedOut", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("turns true once active has lasted the wait", () => {
    const { result } = renderHook(() => useTimedOut(true, 30_000));
    expect(result.current).toBe(false);
    act(() => {
      jest.advanceTimersByTime(30_000);
    });
    expect(result.current).toBe(true);
  });

  it("starts over when it stops being active", () => {
    const { result, rerender } = renderHook(
      ({ active }) => useTimedOut(active, 1_000),
      { initialProps: { active: true } },
    );
    act(() => {
      jest.advanceTimersByTime(1_000);
    });
    expect(result.current).toBe(true);
    rerender({ active: false });
    expect(result.current).toBe(false);
    rerender({ active: true });
    expect(result.current).toBe(false);
  });
});
