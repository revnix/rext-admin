import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type DraftSection,
  readSectionEvent,
  sectionsInOrder,
  sectionsMarkdown,
  withSection,
} from "@/lib/generate-content/draft-sections";

/** How long a section waits for an earlier one that hasn't arrived, before it is shown anyway.
 *  The writer finishes one every two or three seconds. */
export const SECTION_GAP_WAIT_MS = 10_000;

const NONE: DraftSection[] = [];

interface Held {
  thread: string | null;
  sections: DraftSection[];
  /** The places no longer waited for (see `sectionsInOrder`). */
  givenUp: number;
}

/**
 * The first draft's sections as the run's stream brings them, for the page to show before the
 * whole draft is there (task 773, part B).
 *
 * `add` takes any custom event of the stream and keeps the ones that are a section. `body` is
 * the article's text so far: the sections that may be shown, in the article's order. Empty before
 * the article's first section, for another thread, and once the article is final (a later run
 * starts clean).
 */
export function useDraftSections({
  thread,
  final,
}: {
  thread: string | null;
  final: boolean;
}): { body: string; add: (event: unknown) => void } {
  const [held, setHeld] = useState<Held>({ thread, sections: [], givenUp: 0 });
  const stale = held.thread !== thread || (final && held.sections.length > 0);
  // Adjusted while rendering, as the first draft is (use-first-draft.ts): no frame shows another
  // thread's sections.
  if (stale) setHeld({ thread, sections: [], givenUp: 0 });

  const add = useCallback((event: unknown) => {
    const section = readSectionEvent(event);
    if (!section) return;
    setHeld((was) => ({
      ...was,
      sections: withSection(was.sections, section),
    }));
  }, []);

  const sections = stale ? NONE : held.sections;
  const givenUp = stale ? 0 : held.givenUp;
  const shown = useMemo(
    () => sectionsInOrder(sections, givenUp),
    [sections, givenUp],
  );
  // The place before the first section that is held back: what it waits for. Only once the
  // article's start is on the page: the stream doesn't send again what a reloaded or joined run
  // missed, so sections with nothing before them would be the middle of an article shown as its
  // start. Those wait for the whole draft, as the page did before.
  const gap =
    shown.length > 0 && sections.length > shown.length
      ? sections[shown.length].index - 1
      : 0;
  const arrived = shown.length;
  // biome-ignore lint/correctness/useExhaustiveDependencies: an earlier section arriving starts the wait again
  useEffect(() => {
    if (!gap) return;
    const timer = setTimeout(
      () =>
        setHeld((was) => (was.givenUp >= gap ? was : { ...was, givenUp: gap })),
      SECTION_GAP_WAIT_MS,
    );
    return () => clearTimeout(timer);
  }, [gap, arrived]);

  const body = useMemo(() => sectionsMarkdown(shown), [shown]);
  return { body, add };
}
