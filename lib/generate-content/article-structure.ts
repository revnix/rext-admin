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
  /** A body's own h1 (rare: the title sits above the body). Listed, but not a section to count. */
  title?: true;
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

// A fenced code block's lines are code, whatever they start with ("# install" in a shell example).
const FENCED = /^(`{3,}|~{3,})[^\n]*\n[\s\S]*?(?:^\1[ \t]*$|(?![\s\S]))/gm;

const clean = (heading: string) =>
  heading.replace(/[*_`~]|\[|\]\([^)]*\)/g, "").trim();

// The same heading in two spellings (numbering, marks, case). Not containment: "Benefits" is not
// "Benefits of X", which would take a later section for an earlier one.
const same = (a: string, b: string) => {
  const [x, y] = [words(a), words(b)];
  return x !== "" && x === y;
};

/**
 * Whether two headings read the same (numbering, marks and case aside). For finding a listed
 * heading on the page: one with no words at all (an emoji) compares by its text.
 */
export const sameHeading = (a: string, b: string) =>
  same(a, b) || a.trim() === b.trim();

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
 * a glossary's terms) plans its page in blocks of its own: each block the backend names for
 * display (`_render.blocks`: "Steps", "Tools"…) lists as a main row, with its items under it.
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
  const blocks = isRecord(outline._render) ? outline._render.blocks : undefined;
  return (Array.isArray(blocks) ? blocks : [])
    .filter(isRecord)
    .flatMap((block) => {
      const items = (Array.isArray(block.items) ? block.items : [])
        .filter(isRecord)
        .filter((item) => typeof item.label === "string" && item.label.trim());
      if (typeof block.heading !== "string" || !block.heading.trim()) return [];
      if (items.length === 0) return [];
      return [
        { heading: block.heading, heading_level: "H2" } as Planned,
        ...items.map(
          (item) =>
            ({ heading: item.label as string, heading_level: "H3" }) as Planned,
        ),
      ];
    });
}

export function articleStructure(
  body: string,
  planned: Planned[],
  writing: boolean,
  /** The text grows a whole section at a time (the first draft's sections as they land), not
   *  word by word: its last section is finished, with every part planned under it. */
  landsWhole = false,
): StructureEntry[] {
  const prose = (body ?? "").replace(FENCED, "");
  const written = [...prose.matchAll(HEADING_LINE)].map((match) => ({
    level: (match[1].length === 3 ? 3 : 2) as 2 | 3,
    heading: clean(match[2]),
    ...(match[1].length === 1 ? { title: true as const } : {}),
  }));

  const entries: StructureEntry[] = written.map((entry, index) => ({
    ...entry,
    state:
      writing && !landsWhole && index === written.length - 1
        ? "writing"
        : "done",
  }));
  if (!writing) return entries;

  // Still to come: the outline's headings after the last one the text already has. One the writer
  // reworded on the way is taken as written, not listed as waiting for ever.
  // Matched in the outline's order: each planned heading is looked for after the last match, so a
  // heading repeated or resembling a later one can't jump the list ahead.
  let lastWritten = -1;
  let from = 0;
  planned.forEach((section, index) => {
    const at = written.findIndex(
      (entry, position) =>
        position >= from && same(entry.heading, section.heading),
    );
    if (at >= 0) {
      lastWritten = index;
      from = at + 1;
    }
  });
  // By position too: the text's Nth main section stands for the outline's Nth, reworded or not, so
  // a reworded heading (the last one above all, which no later match confirms) isn't listed twice.
  const sectionsWritten = written.filter(
    (entry) => entry.level === 2 && !("title" in entry),
  ).length;
  let seen = 0;
  planned.forEach((section, index) => {
    if (section.heading_level === "H3") return;
    seen += 1;
    if (seen <= sectionsWritten && index > lastWritten) lastWritten = index;
  });
  // A section that landed whole holds its parts, under its own headings or inside a typed block
  // (a how-to's steps): the H3s planned under it are not still to come.
  if (landsWhole && lastWritten >= 0) {
    while (planned[lastWritten + 1]?.heading_level === "H3") lastWritten += 1;
  }
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
  const sections = entries.filter((entry) => entry.level === 2 && !entry.title);
  const reached = sections.filter((entry) => entry.state !== "waiting").length;
  return { section: reached, sections: sections.length };
}
