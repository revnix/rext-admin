import { renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import {
  useCancelOnUnmount,
  useOncePerKey,
} from "@/hooks/use-strict-mode-safe";

// The dev server's strict mode mounts, unmounts and mounts again at once, running each effect twice:
// a library start made two threads and cut its own stream (E23, rext-control#494).
const strict = { wrapper: StrictMode };
const microtasks = () =>
  new Promise<void>((resolve) => queueMicrotask(resolve));

describe("useOncePerKey", () => {
  it("runs once for a key in strict mode", () => {
    const run = jest.fn();
    renderHook(() => useOncePerKey("seo tools", run), strict);

    expect(run).toHaveBeenCalledTimes(1);
  });

  it("runs again for a new key, not for the same one, and not for none", () => {
    const run = jest.fn();
    const { rerender } = renderHook(
      ({ key }: { key: string }) => useOncePerKey(key, run),
      { ...strict, initialProps: { key: "" } },
    );
    expect(run).not.toHaveBeenCalled();

    rerender({ key: "seo tools" });
    rerender({ key: "seo tools" });
    expect(run).toHaveBeenCalledTimes(1);

    rerender({ key: "email marketing" });
    expect(run).toHaveBeenCalledTimes(2);
  });
});

describe("useCancelOnUnmount", () => {
  it("leaves what's in flight alone through strict mode's unmount and mount again", async () => {
    const cancel = jest.fn();
    renderHook(() => useCancelOnUnmount(cancel), strict);
    await microtasks();

    expect(cancel).not.toHaveBeenCalled();
  });

  it("cancels when the component unmounts for good", async () => {
    const cancel = jest.fn();
    const { unmount } = renderHook(() => useCancelOnUnmount(cancel), strict);
    await microtasks();

    unmount();
    await microtasks();

    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("calls the newest cancel", async () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender, unmount } = renderHook(
      ({ cancel }: { cancel: () => void }) => useCancelOnUnmount(cancel),
      { initialProps: { cancel: first } },
    );
    rerender({ cancel: second });

    unmount();
    await microtasks();

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
