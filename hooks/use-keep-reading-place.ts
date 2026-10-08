import { type RefObject, useEffect, useLayoutEffect, useRef } from "react";

interface Place {
  text: string;
  /** Which of the headings with this text, from 0. */
  nth: number;
  /** Where it stood on the screen, from the top. */
  top: number;
}

/** How far under the top of the screen a heading still counts as the one being read. */
const READING_LINE = 96;

const headingsOf = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLElement>("h2, h3, h4"));

const textOf = (heading: HTMLElement) =>
  (heading.textContent ?? "").trim().toLowerCase();

/** The heading the reader is under: the last one at or above the reading line. */
function placeIn(root: HTMLElement): Place | null {
  const headings = headingsOf(root);
  let at = -1;
  for (let i = 0; i < headings.length; i++) {
    if (headings[i].getBoundingClientRect().top <= READING_LINE) at = i;
  }
  if (at < 0) return null;
  const text = textOf(headings[at]);
  const nth = headings.slice(0, at).filter((h) => textOf(h) === text).length;
  return { text, nth, top: headings[at].getBoundingClientRect().top };
}

/** What scrolls the article: the nearest ancestor that does, else the page. */
function scrollerOf(root: HTMLElement): HTMLElement | Window {
  for (let el: HTMLElement | null = root; el; el = el.parentElement) {
    const overflow = getComputedStyle(el).overflowY;
    if (
      (overflow === "auto" || overflow === "scroll") &&
      el.scrollHeight > el.clientHeight
    ) {
      return el;
    }
  }
  return window;
}

/**
 * Keeps the reader's place when the article's text is replaced at once (task 773): the heading
 * they are under stays where it is on the screen, whatever changed above it.
 *
 * `version` names the text the article holds (its sections so far, the whole draft, the final
 * text). When it changes, the heading that was being read is found again by its words and the
 * scroll is moved by as much as the heading moved. A reader still above the first heading, or a
 * heading the new text words differently, is left alone.
 */
export function useKeepReadingPlace(
  root: RefObject<HTMLElement | null>,
  version: string,
): void {
  const place = useRef<Place | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when the text is replaced, and reads the place held before it
  useLayoutEffect(() => {
    const before = place.current;
    const element = root.current;
    if (!before || !element) return;
    const restore = () => {
      const again = headingsOf(element).filter(
        (heading) => textOf(heading) === before.text,
      )[before.nth];
      if (!again) return;
      const moved = again.getBoundingClientRect().top - before.top;
      if (Math.abs(moved) < 1) return;
      scrollerOf(element).scrollBy({ top: moved, behavior: "instant" });
    };
    // The editor writes its new text after this commit: once before the next paint, and once
    // after it for an editor that took a frame.
    const first = requestAnimationFrame(() => {
      restore();
      second = requestAnimationFrame(restore);
    });
    let second = 0;
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [version]);

  // The place as the reader last left it: after each scroll, and after each change of the page.
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const note = () => {
      place.current = placeIn(element);
    };
    note();
    window.addEventListener("scroll", note, { capture: true, passive: true });
    return () => window.removeEventListener("scroll", note, { capture: true });
  });
}
