/**
 * Autosave (task 706): a change is saved after the delay, one save at a time; a change made during
 * a save is saved next; a failure shows, retries by itself and can be retried at once.
 */

import { act, renderHook } from "@testing-library/react";
import { useAutosave } from "@/hooks/use-autosave";

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

const flush = () => act(async () => {});

describe("useAutosave", () => {
  it("saves a change after the delay, and says so", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAutosave({ initial: "one", save, delay: 2000 }),
    );
    expect(result.current.state).toBe("saved");

    act(() => result.current.change("two"));
    expect(result.current.state).toBe("unsaved");
    act(() => jest.advanceTimersByTime(1999));
    expect(save).not.toHaveBeenCalled();

    await act(async () => jest.advanceTimersByTime(1));
    await flush();
    expect(save).toHaveBeenCalledWith("two");
    expect(result.current.state).toBe("saved");
    expect(result.current.savedAt).toBeInstanceOf(Date);
  });

  it("waits for the typing to stop: each change restarts the delay", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAutosave({ initial: "", save, delay: 2000 }),
    );
    act(() => result.current.change("a"));
    act(() => jest.advanceTimersByTime(1500));
    act(() => result.current.change("ab"));
    act(() => jest.advanceTimersByTime(1500));
    expect(save).not.toHaveBeenCalled();
    await act(async () => jest.advanceTimersByTime(500));
    await flush();
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith("ab");
  });

  it("saves a change made during a save next, never two at once", async () => {
    let finish: () => void = () => {};
    const save = jest
      .fn()
      .mockImplementationOnce(
        () => new Promise<void>((resolve) => (finish = resolve)),
      )
      .mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAutosave({ initial: "", save, delay: 1000 }),
    );
    act(() => result.current.change("first"));
    await act(async () => jest.advanceTimersByTime(1000));
    expect(result.current.state).toBe("saving");

    act(() => result.current.change("second"));
    await act(async () => jest.advanceTimersByTime(5000));
    expect(save).toHaveBeenCalledTimes(1);

    await act(async () => finish());
    expect(result.current.state).toBe("unsaved");
    await act(async () => jest.advanceTimersByTime(1000));
    await flush();
    expect(save).toHaveBeenLastCalledWith("second");
    expect(result.current.state).toBe("saved");
  });

  it("shows a failure, tries again by itself, and at once on request", async () => {
    const save = jest
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAutosave({ initial: "", save, delay: 1000, retryDelay: 15000 }),
    );
    act(() => result.current.change("text"));
    await act(async () => jest.advanceTimersByTime(1000));
    await flush();
    expect(result.current.state).toBe("failed");

    await act(async () => jest.advanceTimersByTime(15000));
    await flush();
    expect(save).toHaveBeenCalledTimes(2);
    expect(result.current.state).toBe("failed");

    let ok = false;
    await act(async () => {
      ok = await result.current.saveNow();
    });
    expect(ok).toBe(true);
    expect(save).toHaveBeenCalledTimes(3);
    expect(result.current.state).toBe("saved");
  });

  it("keeps a failure on show while the person keeps typing", async () => {
    const save = jest.fn().mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() =>
      useAutosave({ initial: "", save, delay: 1000 }),
    );
    act(() => result.current.change("a"));
    await act(async () => jest.advanceTimersByTime(1000));
    await flush();
    act(() => result.current.change("ab"));
    expect(result.current.state).toBe("failed");
  });

  it("takes the editor's own rewrite as the baseline, without saving", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAutosave({ initial: "* item", save, delay: 1000 }),
    );
    act(() => result.current.rebase("- item"));
    await act(async () => jest.advanceTimersByTime(5000));
    expect(save).not.toHaveBeenCalled();

    act(() => result.current.change("- item"));
    expect(result.current.state).toBe("saved");
  });

  it("tries nothing again once the page is gone", async () => {
    let fail: (error: Error) => void = () => {};
    const save = jest
      .fn()
      .mockImplementationOnce(
        () => new Promise<void>((_, reject) => (fail = reject)),
      )
      .mockResolvedValue(undefined);
    const { result, unmount } = renderHook(() =>
      useAutosave({ initial: "", save, delay: 1000, retryDelay: 15000 }),
    );
    act(() => result.current.change("old text"));
    await act(async () => jest.advanceTimersByTime(1000));
    expect(save).toHaveBeenCalledTimes(1);

    unmount();
    await act(async () => fail(new Error("offline")));
    await act(async () => jest.advanceTimersByTime(60000));
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("waits for a save under way when asked to save at once, then says yes", async () => {
    let finish: () => void = () => {};
    const save = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const { result } = renderHook(() =>
      useAutosave({ initial: "", save, delay: 2000 }),
    );
    act(() => result.current.change("a"));
    await act(async () => jest.advanceTimersByTime(2000));
    expect(result.current.state).toBe("saving");

    // Asked in the middle of the autosave (a Publish choice, a restore): no answer yet.
    let answer: boolean | undefined;
    act(() => {
      void result.current.saveNow().then((saved) => {
        answer = saved;
      });
    });
    await flush();
    expect(answer).toBeUndefined();

    await act(async () => finish());
    await flush();
    expect(answer).toBe(true);
    expect(save).toHaveBeenCalledTimes(1);
    expect(result.current.state).toBe("saved");
  });

  it("then saves what that save left, before it answers", async () => {
    const finishes: Array<() => void> = [];
    const save = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finishes.push(resolve);
        }),
    );
    const { result } = renderHook(() =>
      useAutosave({ initial: "", save, delay: 2000 }),
    );
    act(() => result.current.change("a"));
    await act(async () => jest.advanceTimersByTime(2000));
    act(() => result.current.change("ab"));

    let answer: boolean | undefined;
    act(() => {
      void result.current.saveNow().then((saved) => {
        answer = saved;
      });
    });
    await act(async () => finishes[0]());
    await flush();
    // The first save left "ab" unsaved: it goes at once, not after the delay.
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith("ab");
    expect(answer).toBeUndefined();

    await act(async () => finishes[1]());
    await flush();
    expect(answer).toBe(true);
    expect(result.current.state).toBe("saved");
    // And no third save comes from the first one's own timer.
    await act(async () => jest.advanceTimersByTime(5000));
    expect(save).toHaveBeenCalledTimes(2);
  });

  it("says no when a save on request fails", async () => {
    const save = jest.fn().mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useAutosave({ initial: "", save }));
    act(() => result.current.change("text"));
    let ok = true;
    await act(async () => {
      ok = await result.current.saveNow();
    });
    expect(ok).toBe(false);
    expect(result.current.state).toBe("failed");
  });
});
