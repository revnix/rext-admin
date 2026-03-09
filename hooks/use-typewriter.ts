// hooks/use-typewriter.ts
"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export function useTypewriter(
  text: string,
  { speed = 40, retypeOnChange = false }: { speed?: number; retypeOnChange?: boolean } = {},
) {
  const [displayed, setDisplayed] = useState("");
  const [isDone, setIsDone] = useState(false);
  const indexRef    = useRef(0);
  const rafRef      = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const skippedRef  = useRef(false);
  const intervalMs  = Math.round(1000 / speed);

  const cancelRaf = () => {
    if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  };

  useEffect(() => {
    if (!text) { cancelRaf(); setDisplayed(""); setIsDone(false); indexRef.current = 0; return; }
    if (retypeOnChange) {
      cancelRaf(); indexRef.current = 0; skippedRef.current = false;
      lastTimeRef.current = null; setDisplayed(""); setIsDone(false);
    }
    if (indexRef.current >= text.length) { setDisplayed(text); setIsDone(true); return; }
    skippedRef.current = false; lastTimeRef.current = null;
    const step = (ts: number) => {
      if (skippedRef.current) return;
      if (!lastTimeRef.current) lastTimeRef.current = ts;
      const elapsed = ts - lastTimeRef.current;
      if (elapsed >= intervalMs) {
        const add = Math.max(1, Math.floor(elapsed / intervalMs));
        indexRef.current = Math.min(indexRef.current + add, text.length);
        lastTimeRef.current = ts;
        setDisplayed(text.slice(0, indexRef.current));
        if (indexRef.current >= text.length) { setIsDone(true); return; }
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return cancelRaf;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, intervalMs, retypeOnChange]);

  const skip = useCallback(() => {
    skippedRef.current = true; cancelRaf();
    indexRef.current = text.length; setDisplayed(text); setIsDone(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return { displayed, isDone, skip };
}
