"use client";

import { useEffect, useState } from "react";

/**
 * The time, again every `intervalMs` (a minute by default), so what's worked out from it (a trial's
 * days left, "ends today") moves on in a tab that stays open, without a refetch.
 */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
