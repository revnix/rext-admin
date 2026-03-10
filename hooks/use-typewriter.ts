// hooks/use-typewriter.ts
"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const CHUNK_THRESHOLDS = [
  { minLength: 5000, chunkSize: 120 },
  { minLength: 2000, chunkSize: 60 },
  { minLength: 500,  chunkSize: 20 },
  { minLength: 0,    chunkSize: 1 },
] as const;

function getChunkSize(textLength: number): number {
  for (const { minLength, chunkSize } of CHUNK_THRESHOLDS) {
    if (textLength >= minLength) return chunkSize;
  }
  return 1;
}

export function useTypewriter(
  text: string,
  {
    speed = 40,
    retypeOnChange = false,
    chunkSize: chunkSizeOverride,
  }: {
    speed?: number;
    retypeOnChange?: boolean;
    chunkSize?: number;
  } = {},
) {
  const [displayed, setDisplayed] = useState("");
  const [isDone, setIsDone] = useState(false);
  const indexRef    = useRef(0);
  const rafRef      = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const skippedRef  = useRef(false);
  const intervalMs  = Math.round(1000 / speed);

  const cancelRaf = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  useEffect(() => {
    if (!text) {
      cancelRaf();
      setDisplayed("");
      setIsDone(false);
      indexRef.current = 0;
      return;
    }

    if (retypeOnChange) {
      cancelRaf();
      indexRef.current = 0;
      skippedRef.current = false;
      lastTimeRef.current = null;
      setDisplayed("");
      setIsDone(false);
    }

    if (indexRef.current >= text.length) {
      setDisplayed(text);
      setIsDone(true);
      return;
    }

    skippedRef.current = false;
    lastTimeRef.current = null;

    const step = (ts: number) => {
      if (skippedRef.current) return;
      if (!lastTimeRef.current) lastTimeRef.current = ts;

      const elapsed = ts - lastTimeRef.current;

      if (elapsed >= intervalMs) {
        const ticksElapsed = Math.max(1, Math.floor(elapsed / intervalMs));
        const chunkSize = chunkSizeOverride ?? getChunkSize(text.length);
        const advance = ticksElapsed * chunkSize;

        indexRef.current = Math.min(indexRef.current + advance, text.length);
        lastTimeRef.current = ts;
        setDisplayed(text.slice(0, indexRef.current));

        if (indexRef.current >= text.length) {
          setIsDone(true);
          return;
        }
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return cancelRaf;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, intervalMs, retypeOnChange, chunkSizeOverride]);

  const skip = useCallback(() => {
    skippedRef.current = true;
    cancelRaf();
    indexRef.current = text.length;
    setDisplayed(text);
    setIsDone(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return { displayed, isDone, skip };
}