/**
 * The shell's own navigation and a page's unsaved changes (task 839): a navigation made in code,
 * not by a link click, is asked about while a form on the page is dirty.
 */

import { act, renderHook } from "@testing-library/react";
import { useLeaveGuard } from "@/components/forms/use-leave-guard";
import { leaveThroughGuard } from "@/lib/leave-guard";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("leaveThroughGuard", () => {
  it("runs at once on a page with nothing unsaved", () => {
    renderHook(() => useLeaveGuard(false));
    const go = jest.fn();
    leaveThroughGuard(go);
    expect(go).toHaveBeenCalledTimes(1);
  });

  it("is held while a form is dirty, and goes when the person leaves", () => {
    const { result } = renderHook(() => useLeaveGuard(true));
    const go = jest.fn();
    act(() => leaveThroughGuard(go));
    expect(go).not.toHaveBeenCalled();
    expect(result.current.isAsking).toBe(true);

    act(() => result.current.leave());
    expect(go).toHaveBeenCalledTimes(1);
    expect(result.current.isAsking).toBe(false);
  });

  it("goes nowhere when the person stays", () => {
    const { result } = renderHook(() => useLeaveGuard(true));
    const go = jest.fn();
    act(() => leaveThroughGuard(go));
    act(() => result.current.stay());
    expect(go).not.toHaveBeenCalled();
    expect(result.current.isAsking).toBe(false);
  });

  it("is no longer held once the changes are saved, or the form is gone", () => {
    const { rerender, unmount } = renderHook(
      ({ dirty }: { dirty: boolean }) => useLeaveGuard(dirty),
      { initialProps: { dirty: true } },
    );
    rerender({ dirty: false });
    const afterSave = jest.fn();
    leaveThroughGuard(afterSave);
    expect(afterSave).toHaveBeenCalledTimes(1);

    rerender({ dirty: true });
    unmount();
    const afterLeaving = jest.fn();
    leaveThroughGuard(afterLeaving);
    expect(afterLeaving).toHaveBeenCalledTimes(1);
  });
});
