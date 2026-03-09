// hooks/use-streaming-text.ts
"use client";

import { useState, useRef, useCallback } from "react";

/**
 * useStreamingText
 *
 * This hook solves the REAL problem with your SSE stream:
 *
 * Your API sends two kinds of events:
 *
 *   1. messages/partial — raw LLM tokens arriving one-by-one, e.g.:
 *        { content: '{"title":"Optimizing Next' }
 *        { content: '.js for Performance' }
 *        { content: '...' }
 *      These are the tokens TO DISPLAY live as they arrive.
 *
 *   2. updates|* — fully parsed final objects (outline, final_content, etc.)
 *      These arrive AFTER all partial tokens are done.
 *
 * Strategy
 * ────────
 * • For outline & content: collect `messages/partial` tokens in real time,
 *   accumulate them into a growing string, and pass that to useTypewriter.
 *   The user sees text appear character-by-character AS the LLM generates it.
 *
 * • When the `updates` event fires with the final parsed object (e.g. outline),
 *   use that for your structured data (sections, tone, etc.) but the display
 *   is already done — no need to retype.
 *
 * Usage in processStream:
 *
 *   // Get these from the hook at the top of your component:
 *   const { appendToken, resetStream, streamedText } = useStreamingText();
 *
 *   // Inside your for-await loop, handle BOTH event types:
 *   for await (const chunk of stream) {
 *     // ── Token-by-token (messages/partial) ──
 *     if (chunk.event === "messages/partial") {
 *       const token = chunk.data?.[0]?.content ?? "";
 *       if (token) appendToken(token);
 *     }
 *
 *     // ── Final parsed object (updates) ──
 *     if (chunk.event?.startsWith("updates|")) {
 *       const updates = chunk.data;
 *       // dispatch to your reducer as before...
 *     }
 *   }
 *
 * Then feed `streamedText` into useTypewriter:
 *   const { displayed, isDone } = useTypewriter(streamedText, { speed: 50 });
 */
export function useStreamingText() {
  const [streamedText, setStreamedText] = useState("");
  const bufferRef = useRef("");

  /** Call this for every `messages/partial` token that arrives */
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