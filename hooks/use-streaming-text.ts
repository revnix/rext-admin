// hooks/use-streaming-text.ts
"use client";

import { useState, useRef, useCallback } from "react";

/**
 * useStreamingText
 *
 * A text that grows as a model writes it. The generation stream
 * (`messages-tuple` and `custom` modes) carries one token per event, and each
 * is appended once with `appendToken`; the `updates` event that follows holds
 * the parsed result, which replaces what was streamed.
 */
export function useStreamingText() {
  const [streamedText, setStreamedText] = useState("");
  const bufferRef = useRef("");

  /** Call this for every token that arrives */
  const appendToken = useCallback((token: string) => {
    bufferRef.current += token;
    setStreamedText(bufferRef.current);
  }, []);

  /** Call this when starting a new workflow step (e.g. outline → content) */
  const resetStream = useCallback(() => {
    bufferRef.current = "";
    setStreamedText("");
  }, []);

  return { streamedText, appendToken, resetStream };
}
