/**
 * The article's structure as the page beside it shows it (task 703): its headings in order with
 * their level, and, while the article is still being written, which one is being written and which
 * of the outline's are still to come.
 */

export type StructureState = "done" | "writing" | "waiting";

export type StructureEntry = {
  level: 2 | 3;
  heading: string;
  state: StructureState;
};

type Planned = { heading: string; heading_level?: "H2" | "H3" };

// A Markdown heading line, levels 1 to 3; deeper ones are detail the structure doesn't list.
const HEADING_LINE = /^(#{1,3})[ \t]+(.+?)[ \t]*#*[ \t]*$/gm;

/** A heading's words only: no Markdown marks, numbering or punctuation, so two spellings compare. */
const words = (heading: string) =>
  heading
    .replace(/[*_`~]|\[|\]\([^)]*\)/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/^\d+\s+/, "");

const clean = (heading: string) =>
  heading.replace(/[*_`~]|\[|\]\([^)]*\)/g, "").trim();

const same = (a: string, b: string) => {
  const [x, y] = [words(a), words(b)];
  return x !== "" && y !== "" && (x === y || x.includes(y) || y.includes(x));
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const headingsOf = (list: unknown): Planned[] =>
  (Array.isArray(list) ? list : []).filter(isRecord).flatMap((section) =>
    typeof section.heading === "string" && section.heading.trim()
      ? [
          {
            heading: section.heading,
            heading_level: section.heading_level === "H3" ? "H3" : "H2",
          } as Planned,
        ]
      : [],
  );

/**
 * The outline's planned headings, wherever its schema keeps them: a flat `sections` list, or one
 * nested a level down (a blog's `structure.sections`). An outline with neither (a how-to's steps,
 * a glossary's terms) plans its page another way, and gives none.
 */
export function plannedSections(outline: unknown): Planned[] {
  if (!isRecord(outline)) return [];
  const flat = headingsOf(outline.sections);
  if (flat.length > 0) return flat;
  for (const value of Object.values(outline)) {
    if (!isRecord(value)) continue;
    const nested = headingsOf(value.sections);
    if (nested.length > 0) return nested;
  }
  return [];
}

export function articleStructure(
  body: string,
  planned: Planned[],
  writing: boolean,
): StructureEntry[] {
  const written = [...(body ?? "").matchAll(HEADING_LINE)].map((match) => ({
    // A body's own h1 is rare (the title sits above it); it lists with the sections.
    level: (match[1].length === 3 ? 3 : 2) as 2 | 3,
    heading: clean(match[2]),
  }));

  const entries: StructureEntry[] = written.map((entry, index) => ({
    ...entry,
    state: writing && index === written.length - 1 ? "writing" : "done",
  }));
  if (!writing) return entries;

  // Still to come: the outline's headings after the last one the text already has. One the writer
  // reworded on the way is taken as written, not listed as waiting for ever.
  let lastWritten = -1;
  planned.forEach((section, index) => {
    if (written.some((entry) => same(entry.heading, section.heading))) {
      lastWritten = index;
    }
  });
  for (const section of planned.slice(lastWritten + 1)) {
    if (!section.heading?.trim()) continue;
    entries.push({
      level: section.heading_level === "H3" ? 3 : 2,
      heading: clean(section.heading),
      state: "waiting",
    });
  }
  return entries;
}

/** Where the writing is, for the page's status line: "section 3 of 7", counting main sections. */
export function writingPosition(entries: StructureEntry[]) {
  const sections = entries.filter((entry) => entry.level === 2);
  const reached = sections.filter((entry) => entry.state !== "waiting").length;
  return { section: reached, sections: sections.length };
}
