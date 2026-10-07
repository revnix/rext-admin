import { useEffect, useRef } from "react";

// React's strict mode, on the dev server, mounts every component, unmounts it and mounts it again at
// once, running each effect twice. These two are for the effects that mustn't happen twice: a library
// start made two threads and left neither streaming (E23, rext-control#494).

/** Runs `run` once for each new non-empty `key`, however often the effect itself runs. */
export function useOncePerKey(
  key: string | null | undefined,
  run: () => void,
): void {
  const doneRef = useRef<string | null>(null);
  const runRef = useRef(run);
  runRef.current = run;

  useEffect(() => {
    if (!key || doneRef.current === key) return;
    doneRef.current = key;
    runRef.current();
  }, [key]);
}

/**
 * Calls `cancel` when the component unmounts for good: strict mode's unmount and mount again in one go
 * leaves what's in flight alone.
 */
export function useCancelOnUnmount(cancel: () => void): void {
  const mountedRef = useRef(false);
  const cancelRef = useRef(cancel);
  cancelRef.current = cancel;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      queueMicrotask(() => {
        if (!mountedRef.current) cancelRef.current();
      });
    };
  }, []);
}
