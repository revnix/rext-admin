import { useState } from "react";

/** An article's text as the page holds it at one moment of its run. */
export interface DraftSource<Content> {
  /** The run's thread; a draft is never carried from one thread to another. */
  thread: string | null;
  /** The text the run has sent so far; empty before the writer ends, and after a reset. */
  body: string;
  /** The article's other fields (its title, tags and description), as sent with that text. */
  content: Content | null;
  /** The article is finished: its text and its scores are all there. */
  final: boolean;
}

export interface FirstDraft<Content> {
  thread: string | null;
  body: string;
  content: Content | null;
}

/**
 * The writer's first draft, as it first arrived, held until the article is final (task 773).
 *
 * The page receives the whole draft about a minute into the run, when the writer ends. The rewrite
 * then changes most of its sentences, and the checks a few more, each reporting its own text. The
 * reader is shown the draft, and it is replaced once, by the final text: text that changes twice
 * under the reader is worse than text that arrives once.
 *
 * Null before a draft arrives, once the article is final, after a reset, and for another thread.
 */
export function useFirstDraft<Content>({
  thread,
  body,
  content,
  final,
}: DraftSource<Content>): FirstDraft<Content> | null {
  const [held, setHeld] = useState<FirstDraft<Content> | null>(null);
  const stale = !!held && (final || !body || held.thread !== thread);
  const wanted = !final && !!body;
  // Adjusted while rendering, not in an effect: no frame shows a draft that is no longer the one
  // to show, or a later stage's text before the draft is held.
  if (stale) setHeld(wanted ? { thread, body, content } : null);
  else if (!held && wanted) setHeld({ thread, body, content });
  return stale || !held ? null : held;
}
