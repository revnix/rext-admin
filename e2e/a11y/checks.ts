import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

/** One finding on a page: which check, on which element, and what's wrong. */
export interface Issue {
  check: string;
  target: string;
  detail: string;
}

/** WCAG 2.2 AA, as design/app-language.md §11 asks; `wcag22aa` brings target size (2.5.8, 24 px). */
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** axe's rules for those levels: names, roles, labels, contrast, landmarks, target size. */
export async function axeIssues(page: Page): Promise<Issue[]> {
  const { violations } = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .analyze();
  return violations.flatMap((violation) =>
    violation.nodes.map((node) => ({
      check: `axe ${violation.id}`,
      target: node.target.join(" "),
      detail: violation.help,
    })),
  );
}

/** The focused element as one stop of the tab order, read in the page. */
interface Stop {
  id: string;
  label: string;
  /** Too small to see, or transparent: a control drawn by its wrapper or its label. */
  hidden: boolean;
  /** `next dev`'s overlay or the query devtools (against the local stack): not the dashboard's. */
  devTool: boolean;
  /** What covers its centre, if something else does (2.4.11). */
  coveredBy: string | null;
}

/**
 * Tabs through the page from its top (2.4.7 and 2.4.11): nothing covers a focused element, and it shows
 * an outline or a ring (the `ring` token) it doesn't have unfocused, on itself, on a wrapper drawn around
 * it, or on its label (a visually hidden control drawn by its label, as a switch or a radio card is). A
 * colour change alone isn't a focus indicator here.
 */
export async function focusIssues(
  page: Page,
  maxStops = 500,
): Promise<Issue[]> {
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    window.scrollTo(0, 0);
  });
  const issues: Issue[] = [];
  const stops: { stop: Stop; rings: string[] }[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < maxStops; i++) {
    await page.keyboard.press("Tab");
    await page.evaluate(settle);
    const stop = await page.evaluate(readFocus);
    // Focus left the page (for the browser's own controls), or came round to an element again.
    if (!stop || seen.has(stop.id)) break;
    seen.add(stop.id);
    if (stop.devTool) continue;
    stops.push({
      stop,
      rings: (await page.evaluate(readRings, stop.id)) ?? [],
    });
    if (!stop.hidden && stop.coveredBy) {
      issues.push({
        check: "focus not obscured",
        target: stop.label,
        detail: `covered by ${stop.coveredBy} when focused`,
      });
    }
  }

  await page.evaluate(() =>
    (document.activeElement as HTMLElement | null)?.blur(),
  );
  for (const { stop, rings } of stops) {
    const unfocused = await page.evaluate(readRings, stop.id);
    if (!unfocused) continue;
    const shown = rings.some(
      (ring, level) => ring !== "" && ring !== unfocused[level],
    );
    if (!shown) {
      issues.push({
        check: "focus visible",
        target: stop.label,
        detail: stop.hidden
          ? "focus lands on a hidden control, and nothing around it or its label shows a ring"
          : "no outline or ring when focused",
      });
    }
  }
  return issues;
}

/**
 * With `prefers-reduced-motion: reduce` (the checks open every page with it), every finished state
 * renders at once (design/app-language.md §10): no animation or transition that moves, scales or rotates
 * is running, whether CSS's, the Web Animations API's or a script's writing `transform` frame by frame.
 */
export async function motionIssues(page: Page): Promise<Issue[]> {
  return page.evaluate(async () => {
    const label = (el: Element | null) =>
      el
        ? `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${
            el.getAttribute("data-slot")
              ? `[data-slot=${el.getAttribute("data-slot")}]`
              : ""
          }`
        : "(no element)";
    const found: { check: string; target: string; detail: string }[] = [];
    for (const animation of document.getAnimations()) {
      if (animation.playState !== "running" && !animation.pending) continue;
      const effect = animation.effect as KeyframeEffect | null;
      const moves = (effect?.getKeyframes() ?? []).some(
        (frame) =>
          "transform" in frame ||
          "translate" in frame ||
          "rotate" in frame ||
          "scale" in frame,
      );
      if (!moves) continue;
      const name =
        (animation as CSSAnimation).animationName ??
        (animation as CSSTransition).transitionProperty ??
        "a script's animation";
      found.push({
        check: "reduced motion",
        target: label(effect?.target ?? null),
        detail: `${name} moves while reduced motion is on`,
      });
    }
    const before = new Map<HTMLElement, string>();
    for (const el of document.querySelectorAll<HTMLElement>(
      '[style*="transform"]',
    )) {
      before.set(el, el.style.transform);
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
    for (const [el, transform] of before) {
      if (el.isConnected && el.style.transform !== transform) {
        found.push({
          check: "reduced motion",
          target: label(el),
          detail: "a script moves it while reduced motion is on",
        });
      }
    }
    return found;
  });
}

/**
 * Runs in the page: lets it finish answering a key press before it's read, as a person would see it.
 * The animations still running end (with reduced motion, each lasts a hundredth of a millisecond), then
 * two frames pass, so a tooltip or menu that closed is gone and one that opened is in place. Read at
 * once, a closing tooltip's last frame lay over the next control (/dev/primitives at 390, C10a).
 */
async function settle(): Promise<void> {
  const running = document
    .getAnimations()
    .filter((animation) => animation.playState === "running");
  await Promise.race([
    Promise.allSettled(running.map((animation) => animation.finished)),
    new Promise((resolve) => setTimeout(resolve, 500)),
  ]);
  await new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve)),
  );
}

/** Runs in the page: the focused element as a Stop, marking it so readRings finds it again. */
function readFocus(): Stop | null {
  const el = document.activeElement as HTMLElement | null;
  if (!el || el === document.body || el === document.documentElement) {
    return null;
  }
  // The ring's transition (120 ms) would still be at its start: read the finished state.
  for (const animation of document.getAnimations()) {
    if (animation instanceof CSSTransition) animation.finish();
  }
  const marker = "a11yStop";
  if (!el.dataset[marker]) {
    const counter = window as unknown as { __a11yStops?: number };
    counter.__a11yStops = (counter.__a11yStops ?? 0) + 1;
    el.dataset[marker] = String(counter.__a11yStops);
  }
  const name = (
    el.getAttribute("aria-label") ??
    el.textContent ??
    el.getAttribute("placeholder") ??
    el.getAttribute("name") ??
    ""
  )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
  const label = `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${
    el.getAttribute("role") ? `[role=${el.getAttribute("role")}]` : ""
  }${name ? ` "${name}"` : ""}`;

  const isDevTool = (node: Element) =>
    node.tagName === "NEXTJS-PORTAL" ||
    node.closest(".tsqd-parent-container") !== null;
  const rect = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  const hidden =
    rect.width < 2 ||
    rect.height < 2 ||
    style.visibility === "hidden" ||
    Number(style.opacity) === 0;

  // The part of it inside the window; the browser scrolls a focused element into view.
  const left = Math.max(rect.left, 0);
  const right = Math.min(rect.right, window.innerWidth);
  const top = Math.max(rect.top, 0);
  const bottom = Math.min(rect.bottom, window.innerHeight);
  let coveredBy: string | null = null;
  if (!hidden) {
    if (right <= left || bottom <= top) {
      coveredBy = "the edge of the window (it isn't scrolled into view)";
    } else {
      const hit = document.elementFromPoint(
        (left + right) / 2,
        (top + bottom) / 2,
      );
      if (hit && !el.contains(hit) && !hit.contains(el) && !isDevTool(hit)) {
        coveredBy = `${hit.tagName.toLowerCase()}${
          hit.getAttribute("data-slot")
            ? `[data-slot=${hit.getAttribute("data-slot")}]`
            : ""
        }`;
      }
    }
  }

  return {
    id: el.dataset[marker] as string,
    label,
    hidden,
    devTool: isDevTool(el),
    coveredBy,
  };
}

/**
 * Runs in the page: the outline and box-shadow a marked element, its three nearest ancestors and its labels
 * show now (read with focus on the element, then without). Only what can be seen counts: an outline or a
 * shadow layer in a transparent colour, or a shadow of no size (a ring of 0 px, as `ring-0` leaves),
 * reads as nothing, so swapping one for another isn't taken for a focus ring.
 */
function readRings(id: string): string[] | null {
  const el = document.querySelector(`[data-a11y-stop="${id}"]`);
  if (!el) return null;
  // The ring's transition (120 ms) would still be at its start: read the finished state.
  for (const animation of document.getAnimations()) {
    if (animation instanceof CSSTransition) animation.finish();
  }
  // A computed colour's alpha: rgba()'s fourth value, or what follows the slash in the newer forms.
  const opaque = (colour: string) => {
    if (colour === "transparent") return false;
    const slash = /\/\s*([\d.]+)(%?)\s*\)$/.exec(colour);
    if (slash) return Number(slash[1]) > 0;
    const rgba = /^rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)$/.exec(colour);
    return rgba ? Number(rgba[1]) > 0 : true;
  };
  // Box-shadow layers, split on the commas outside a colour's parentheses.
  const layers = (shadow: string) => {
    const found: string[] = [];
    let depth = 0;
    let from = 0;
    for (let i = 0; i < shadow.length; i++) {
      if (shadow[i] === "(") depth++;
      else if (shadow[i] === ")") depth--;
      else if (shadow[i] === "," && depth === 0) {
        found.push(shadow.slice(from, i).trim());
        from = i + 1;
      }
    }
    found.push(shadow.slice(from).trim());
    return found;
  };
  const seen = (layer: string) => {
    const colour = /^(\w+\([^)]*\)|[a-z]+)/.exec(layer)?.[1] ?? "";
    const lengths = layer
      .slice(colour.length)
      .match(/-?[\d.]+px/g)
      ?.map((length) => Number.parseFloat(length));
    return opaque(colour) && (lengths ?? []).some((length) => length !== 0);
  };
  const candidates: Element[] = [el];
  // Three: the box a field shows its focus on can sit outside Input's own wrapper and a row (the keyword form).
  for (let up = el.parentElement, level = 0; up && level < 3; level++) {
    candidates.push(up);
    up = up.parentElement;
  }
  candidates.push(...Array.from((el as HTMLInputElement).labels ?? []));
  return candidates.map((node) => {
    const s = getComputedStyle(node);
    const outline =
      s.outlineStyle !== "none" &&
      Number.parseFloat(s.outlineWidth) > 0 &&
      opaque(s.outlineColor)
        ? `outline ${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}`
        : "";
    const shown =
      s.boxShadow === "none" ? [] : layers(s.boxShadow).filter(seen);
    const shadow = shown.length > 0 ? `shadow ${shown.join(", ")}` : "";
    return [outline, shadow].filter(Boolean).join(" ");
  });
}
