"use client";

import { useEffect, useState } from "react";

/**
 * True once `active` has held for `delay` ms. A skeleton waits 150 to 300 ms before it shows
 * (design/app-language.md §8), so a fast load shows nothing at all.
 */
export function useShowAfter(active: boolean, delay = 200) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!active) {
      setShown(false);
      return;
    }
    const timer = setTimeout(() => setShown(true), delay);
    return () => clearTimeout(timer);
  }, [active, delay]);
  return active && shown;
}
