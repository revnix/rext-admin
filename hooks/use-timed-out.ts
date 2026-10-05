import { useEffect, useState } from "react";

/**
 * True once `active` has stayed true for `ms`. A loading state that waits on
 * something that may never arrive uses it to stop spinning and say so.
 */
export function useTimedOut(active: boolean, ms: number): boolean {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    setTimedOut(false);
    if (!active) return;
    const id = window.setTimeout(() => setTimedOut(true), ms);
    return () => window.clearTimeout(id);
  }, [active, ms]);

  return active && timedOut;
}
