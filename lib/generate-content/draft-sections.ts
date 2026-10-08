/**
 * The article's sections as the writer finishes them (task 773, part B).
 *
 * The run's stream carries one event per finished section, some seconds apart, before the whole
 * first draft arrives. The page shows them under their headings as they land, so the reader has
 * words to read during the wait, and the whole draft then takes their place.
 */

/** One section of the first draft, as its event describes it. */
export interface DraftSection {
  /** Its place in the article, from 1. */
  index: number;
  /** Its heading's level in the article. */
  level: 2 | 3 | 4;
  /** Empty for the opening block, and for a section written without a heading. */
  heading: string;
  /** The section's text, without its heading. */
  markdown: string;
}

/** A `section` event of the first draft, or null for anything else on the stream. */
export function readSectionEvent(data: unknown): DraftSection | null {
  if (!data || typeof data !== "object") return null;
  const event = data as Record<string, unknown>;
  if (event.type !== "section" || event.phase !== "draft") return null;
  const index = Number(event.index);
  const markdown =
    typeof event.markdown === "string" ? event.markdown.trim() : "";
  if (!Number.isInteger(index) || index < 1 || !markdown) return null;
  return {
    index,
    level: event.level === 3 || event.level === 4 ? event.level : 2,
    heading:
      typeof event.heading === "string"
        ? event.heading.replace(/\s+/g, " ").trim()
        : "",
    markdown,
  };
}

/**
 * `held` with `section` at its place, in the article's order. A second one for a place replaces
 * the first: when the writer's answer is refused and asked for again, every section comes again.
 */
export function withSection(
  held: DraftSection[],
  section: DraftSection,
): DraftSection[] {
  return [...held.filter((one) => one.index !== section.index), section].sort(
    (a, b) => a.index - b.index,
  );
}

/**
 * The sections to show: in the article's order, up to the first place nothing has arrived for.
 *
 * A section can arrive before an earlier one (a how-to's steps are written first). Shown at once,
 * it would be pushed down the page when the earlier ones land, under the reader's eyes, so it
 * waits for them. The writer also leaves a section out now and then, and says so only by sending
 * nothing: the places up to `givenUp` are no longer waited for.
 */
export function sectionsInOrder(
  held: DraftSection[],
  givenUp = 0,
): DraftSection[] {
  const shown: DraftSection[] = [];
  let next = 1;
  for (const section of held) {
    if (section.index > next && section.index - 1 > givenUp) break;
    shown.push(section);
    next = section.index + 1;
  }
  return shown;
}

/** The sections as one text, each under its heading at its level. */
export function sectionsMarkdown(sections: DraftSection[]): string {
  return sections
    .map((section) =>
      section.heading
        ? `${"#".repeat(section.level)} ${section.heading}\n\n${section.markdown}`
        : section.markdown,
    )
    .join("\n\n");
}
