/**
 * The outline gate (step 5): what the backend offers for review, the user's
 * edits to the outline's sections, and the approval it sends back.
 *
 * The backend's side is `src/flow/engines/content/review/outline.py` and
 * `outline_edits.py` in rext-backend: the gate sends `editable_sections`, one
 * row per section the article is written under, each with an id naming where
 * the section lives in the outline ("structure.sections:2"). Approval may send
 * `sections` back, the rows in the user's order with edited headings; a row
 * left out of its list is a removed section. Nothing here talks to the network.
 */
import {
  type SerpResult,
  serpResultsFromGate,
} from "@/lib/keywords/serp-results";
import type {
  BrandVoicePromotion,
  InternalLinkSuggestion,
  OutlineRenderBlock,
} from "@/types/generate-content";

/** A section's level. H4 comes only from the gate (a pillar page's deepest headings): shown, never set here. */
export type HeadingLevel = "H2" | "H3" | "H4";

const HEADING_LEVELS: readonly HeadingLevel[] = ["H2", "H3", "H4"];

/** One section the user may reorder, rename or remove, as the gate sends it. */
export interface EditableSectionRow {
  id: string;
  /** The section list it belongs to ("structure.sections"); rows move only within it. */
  list: string;
  heading: string;
  heading_level?: HeadingLevel;
}

export type BrandProminence = "prominent" | "subtle" | "none";

export const BRAND_PROMINENCE_LEVELS: readonly BrandProminence[] = [
  "prominent",
  "subtle",
  "none",
];

/** The outline gate's offer, read defensively: every part may be missing. */
export interface OutlineGate {
  sections: EditableSectionRow[];
  /** The lists a new section may be added to; empty while the backend takes no additions. */
  addableLists: string[];
  /** The level to preselect; null when the gate names none (an older backend). */
  recommendedProminence: BrandProminence | null;
  internalLinks: InternalLinkSuggestion[];
  brandPromotion: BrandVoicePromotion | null;
  serpResults: SerpResult[];
  questions: string[];
  relatedSearches: string[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const nonEmptyStrings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0,
      )
    : [];

function readRow(value: unknown): EditableSectionRow | null {
  if (!isRecord(value)) return null;
  const { id, list, heading, heading_level: level } = value;
  if (typeof id !== "string" || typeof list !== "string") return null;
  if (typeof heading !== "string" || !heading.trim()) return null;
  return {
    id,
    list,
    heading: heading.trim(),
    ...(HEADING_LEVELS.includes(level as HeadingLevel)
      ? { heading_level: level as HeadingLevel }
      : {}),
  };
}

export function readOutlineGate(value: unknown): OutlineGate {
  const gate = isRecord(value) ? value : {};
  const prominence = gate.recommended_brand_prominence;
  return {
    sections: (Array.isArray(gate.editable_sections)
      ? gate.editable_sections
      : []
    )
      .map(readRow)
      .filter((row): row is EditableSectionRow => row !== null),
    addableLists: nonEmptyStrings(gate.section_additions),
    recommendedProminence: BRAND_PROMINENCE_LEVELS.includes(
      prominence as BrandProminence,
    )
      ? (prominence as BrandProminence)
      : null,
    internalLinks: Array.isArray(gate.internal_links)
      ? (gate.internal_links as InternalLinkSuggestion[])
      : [],
    brandPromotion: isRecord(gate.brand_voice_promotion)
      ? (gate.brand_voice_promotion as unknown as BrandVoicePromotion)
      : null,
    // The keyword and title gates' reader; a result without a title has nothing to list.
    serpResults: serpResultsFromGate(gate).filter((result) =>
      result.title.trim(),
    ),
    questions: nonEmptyStrings(gate.serp_questions),
    relatedSearches: nonEmptyStrings(gate.related_searches),
  };
}

// ── The user's edits ─────────────────────────────────────────────────────────

/** A section as the tree shows it: one the gate offered, or one the user added. */
export interface TreeRow {
  /** Stable for React and for the drag: the gate's id, or a local one for an added section. */
  key: string;
  /** The gate's id; null for a section the user added. */
  id: string | null;
  list: string;
  heading: string;
  level?: HeadingLevel;
  /**
   * Removed, with its Undo still possible: the row keeps its place, hidden from
   * the tree and never sent, so Undo puts it back exactly where it was whatever
   * was moved or removed since.
   */
  removed?: true;
  /** For an H3 removed with its H2: that H2's key, so Undo brings the section back whole. */
  removedWith?: string;
}

const shown = (row: TreeRow) => !row.removed;

export function rowsFromGate(sections: EditableSectionRow[]): TreeRow[] {
  return sections.map((row) => ({
    key: row.id,
    id: row.id,
    list: row.list,
    heading: row.heading,
    ...(row.heading_level ? { level: row.heading_level } : {}),
  }));
}

function groupAll(rows: TreeRow[]): { list: string; rows: TreeRow[] }[] {
  const groups = new Map<string, TreeRow[]>();
  for (const row of rows) {
    const group = groups.get(row.list);
    if (group) group.push(row);
    else groups.set(row.list, [row]);
  }
  return Array.from(groups, ([list, listRows]) => ({ list, rows: listRows }));
}

/** The rows the tree shows, grouped by list, each group in the order the lists first appear. */
export function groupRows(
  rows: TreeRow[],
): { list: string; rows: TreeRow[] }[] {
  return groupAll(rows)
    .map((group) => ({ ...group, rows: group.rows.filter(shown) }))
    .filter((group) => group.rows.length > 0);
}

/** One list's shown rows, in order: what the tree draws and what the positions count. */
function shownInList(rows: TreeRow[], list: string): TreeRow[] {
  return rows.filter((row) => row.list === list && shown(row));
}

const LEVEL_RANK: Record<HeadingLevel, number> = { H2: 2, H3: 3, H4: 4 };

/** How deep a row sits: 2 for an H2 or a section without a level, 3 for an H3, 4 for an H4. */
export function levelRank(row: Pick<TreeRow, "level">): number {
  return row.level ? LEVEL_RANK[row.level] : 2;
}

/**
 * Where the block a row heads ends among its list's shown rows: the index just past the row and the
 * deeper rows after it (an H2's subsections, an H3's H4s). The outline is a flat list with levels, as
 * the backend stores it, so a section's subsections are simply the deeper rows that follow it.
 */
export function blockEnd(listRows: TreeRow[], start: number): number {
  const rank = levelRank(listRows[start]);
  let end = start + 1;
  while (end < listRows.length && levelRank(listRows[end]) > rank) end += 1;
  return end;
}

/**
 * Whether the block at `start` may land in `gap` (the place before `listRows[gap]`; the list's length
 * is its end). Its own place counts. Two rules keep every row under the kind of row it belongs to:
 * - it never lands above a deeper row, which it would take from its own parent: an H2 lands only
 *   between whole sections, an H3 never between an H3 and its H4s;
 * - a row deeper than H2 lands only where the row before it is one level up or deeper: an H3 after any
 *   row but never at the top of the list (the backend would quietly make it an H2), an H4 after an H3
 *   or an H4, never straight after an H2.
 * The drag (`dropGaps`), Alt+↑ and Alt+↓ and the menu (`moveTarget`) all go through here.
 */
function takesBlock(
  listRows: TreeRow[],
  start: number,
  end: number,
  gap: number,
): boolean {
  if (gap < 0 || gap > listRows.length || (gap > start && gap < end))
    return false;
  if (gap === start || gap === end) return true;
  const rank = levelRank(listRows[start]);
  if (gap < listRows.length && levelRank(listRows[gap]) > rank) return false;
  if (rank === 2) return true;
  // Not its own place, so the row before the gap is outside the block: the row it will follow.
  const before = listRows[gap - 1];
  return before !== undefined && levelRank(before) >= rank - 1;
}

/**
 * Whether a new row of `rank` may go in `gap`: never above a deeper row, which it would take from the
 * section it belongs to (a new H3 above an H4 would make that H4 its own), and no subsection at the top.
 */
function takesNew(listRows: TreeRow[], gap: number, rank: number): boolean {
  if (gap < 0 || gap > listRows.length) return false;
  if (gap < listRows.length && levelRank(listRows[gap]) > rank) return false;
  return !(rank > 2 && gap === 0);
}

/**
 * The level a new row takes in `gap`, by the row it would sit above: a section above a section (or at
 * the list's end), a subsection above a subsection. Null where neither fits: above an H4, a new row
 * would come between a subsection and its H4s.
 */
export function insertLevelAt(
  listRows: TreeRow[],
  gap: number,
): "H2" | "H3" | null {
  const next = listRows[gap];
  const level = next && levelRank(next) > 2 ? "H3" : "H2";
  return takesNew(listRows, gap, LEVEL_RANK[level]) ? level : null;
}

/**
 * Where "Add section below" and "Add subsection below" put a new row: after the row's whole block (an
 * H2's subsections, an H3's H4s), at the row's own level. Null for an H4, which takes no row beside it.
 */
export function placeBelow(
  listRows: TreeRow[],
  index: number,
): { gap: number; level: "H2" | "H3" } | null {
  const rank = levelRank(listRows[index]);
  if (rank > 3) return null;
  return { gap: blockEnd(listRows, index), level: rank === 3 ? "H3" : "H2" };
}

/**
 * A row's place among its siblings: the rows of its level under the same parent (the H3s of one H2;
 * the H2s of the list). What a tree grid's `aria-posinset` and `aria-setsize` say, beside `aria-level`.
 */
export function siblingPlace(
  listRows: TreeRow[],
  index: number,
): { position: number; size: number } {
  const rank = levelRank(listRows[index]);
  let position = 1;
  for (let at = index - 1; at >= 0 && levelRank(listRows[at]) >= rank; at -= 1)
    if (levelRank(listRows[at]) === rank) position += 1;
  let size = position;
  for (
    let at = index + 1;
    at < listRows.length && levelRank(listRows[at]) >= rank;
    at += 1
  )
    if (levelRank(listRows[at]) === rank) size += 1;
  return { position, size };
}

/** The places a row's block may be dropped (its own included), for the drag's drop line. */
export function dropGaps(listRows: TreeRow[], start: number): number[] {
  const end = blockEnd(listRows, start);
  const gaps: number[] = [];
  for (let gap = 0; gap <= listRows.length; gap += 1)
    if (takesBlock(listRows, start, end, gap)) gaps.push(gap);
  return gaps;
}

/** The gap nearest a pointer's height among the places a block may go; null when there are none. */
export function nearestGap(
  gapTops: number[],
  candidates: number[],
  y: number,
): number | null {
  let best: number | null = null;
  for (const gap of candidates) {
    if (gapTops[gap] === undefined) continue;
    if (
      best === null ||
      Math.abs(gapTops[gap] - y) < Math.abs(gapTops[best] - y)
    )
      best = gap;
  }
  return best;
}

/**
 * Where one step up or down takes the block at `start` (Alt+↑, Alt+↓, the menu's Move up and Move
 * down), or null when it can't go further. A block passes its neighbour's whole block, so an H2 moves
 * past whole sections. A subsection already first in its section goes up to the end of the section
 * before; one already last goes down to the start of the next section. An H4 does the same between
 * the subsections of its section (up to the end of the H3 before, down to the start of the H3 after),
 * and stops at the section's ends: it never lands straight under an H2 (`takesBlock`).
 */
export function moveTarget(
  listRows: TreeRow[],
  start: number,
  offset: -1 | 1,
): number | null {
  const rank = levelRank(listRows[start]);
  const end = blockEnd(listRows, start);
  let gap: number;
  if (offset < 0) {
    // The previous row as deep as this one or less: a sibling to pass, or the section it opens.
    gap = start - 1;
    while (gap >= 0 && levelRank(listRows[gap]) > rank) gap -= 1;
    if (gap < 0) return null;
  } else {
    if (end >= listRows.length) return null;
    gap =
      levelRank(listRows[end]) === rank
        ? blockEnd(listRows, end)
        : // The next row opens a section above this level: go in as its first subsection.
          end + 1;
  }
  return takesBlock(listRows, start, end, gap) ? gap : null;
}

/**
 * Where, in all the rows, something of `rank` goes into a list's `gap`. Removed rows keep their place
 * for an Undo: one right after the row before the gap stays with that row's section when it is deeper
 * than what comes in (an H3 removed from the section before a new H2), and stays after what comes in
 * otherwise (a removed H2 after a new subsection, which then stays in its own section).
 */
function insertionIndex(
  rows: TreeRow[],
  listRows: TreeRow[],
  gap: number,
  rank: number,
): number {
  if (gap === 0) return rows.indexOf(listRows[0]);
  const before = listRows[gap - 1];
  let at = rows.indexOf(before) + 1;
  while (
    at < rows.length &&
    rows[at].list === before.list &&
    !shown(rows[at]) &&
    levelRank(rows[at]) > rank
  )
    at += 1;
  return at;
}

/**
 * The row's block (it and its subsections, with the removed rows among and right after them, which
 * keep following it for their Undo) moved to `gap` of its list's shown rows. The rows unchanged when
 * the gap is its own place or one it can't take.
 */
export function moveBlockTo(
  rows: TreeRow[],
  key: string,
  gap: number,
): TreeRow[] {
  const row = rows.find((candidate) => candidate.key === key);
  if (!row || !shown(row)) return rows;
  const listRows = shownInList(rows, row.list);
  const start = listRows.indexOf(row);
  const end = blockEnd(listRows, start);
  if (gap === start || gap === end || !takesBlock(listRows, start, end, gap))
    return rows;
  const from = rows.indexOf(row);
  const next = listRows[end];
  let to = next ? rows.indexOf(next) : from + 1;
  if (!next) while (to < rows.length && rows[to].list === row.list) to += 1;
  const block = rows.slice(from, to);
  const rest = [...rows.slice(0, from), ...rows.slice(to)];
  const at = insertionIndex(
    rest,
    shownInList(rest, row.list),
    gap > start ? gap - (end - start) : gap,
    levelRank(row),
  );
  return [...rest.slice(0, at), ...block, ...rest.slice(at)];
}

/** One step up or down for a row and its subsections (`moveTarget`); the rows unchanged at an end. */
export function moveRow(
  rows: TreeRow[],
  key: string,
  offset: -1 | 1,
): TreeRow[] {
  const row = rows.find((candidate) => candidate.key === key);
  if (!row || !shown(row)) return rows;
  const listRows = shownInList(rows, row.list);
  const gap = moveTarget(listRows, listRows.indexOf(row), offset);
  return gap === null ? rows : moveBlockTo(rows, key, gap);
}

export function renameRow(
  rows: TreeRow[],
  key: string,
  heading: string,
): TreeRow[] {
  const trimmed = heading.trim();
  if (!trimmed) return rows;
  return rows.map((row) =>
    row.key === key ? { ...row, heading: trimmed } : row,
  );
}

/**
 * Whether a section's level may change to `level`. Only between H2 and H3, in a list with levels: an
 * H4 keeps its level. A section becomes a subsection only with a section above it, since the first
 * section is never a subsection.
 */
export function canChangeLevel(
  rows: TreeRow[],
  key: string,
  level: "H2" | "H3",
): boolean {
  const row = rows.find((candidate) => candidate.key === key);
  if (!row || !shown(row) || row.level === level) return false;
  if (row.level !== "H2" && row.level !== "H3") return false;
  return level === "H2" || shownInList(rows, row.list).indexOf(row) > 0;
}

/**
 * A section made a subsection (H2 to H3) or a subsection a section (H3 to H2), in place. The outline
 * is a flat list with levels, so nothing moves: a new subsection's own subsections sit beside it under
 * the section above, with their H4s still under them, and a new section takes the subsections after it
 * in its old section. A subsection's own H4s go up a level with it and become the new section's
 * subsections (removed ones too, for their Undo), so an H4 never sits straight under an H2.
 */
export function changeLevel(
  rows: TreeRow[],
  key: string,
  level: "H2" | "H3",
): TreeRow[] {
  if (!canChangeLevel(rows, key, level)) return rows;
  const at = rows.findIndex((row) => row.key === key);
  // The rows under an H3: the H4s right after it, up to the next row of its list no deeper than it.
  let end = at + 1;
  if (level === "H2")
    while (
      end < rows.length &&
      rows[end].list === rows[at].list &&
      levelRank(rows[end]) > 3
    )
      end += 1;
  return rows.map((row, index) => {
    if (index === at) return { ...row, level };
    if (index > at && index < end) return { ...row, level: "H3" as const };
    return row;
  });
}

/**
 * The rows a removal hides: the row and the shown rows of its block (an H2's subsections), since
 * removing only the H2 would hang them under the section before, or before any section at all.
 */
function removalKeys(rows: TreeRow[], row: TreeRow): string[] {
  const listRows = shownInList(rows, row.list);
  const start = listRows.indexOf(row);
  return listRows
    .slice(start, blockEnd(listRows, start))
    .map((candidate) => candidate.key);
}

/**
 * Whether a row may be removed: the backend keeps a list rather than empty it, so a removal that
 * would hide every section left in the list (an H2 with all its subsections included) isn't offered.
 */
export function canRemoveRow(rows: TreeRow[], key: string): boolean {
  const row = rows.find((candidate) => candidate.key === key);
  if (!row || !shown(row)) return false;
  return shownInList(rows, row.list).length > removalKeys(rows, row).length;
}

/**
 * The row hidden in its place, with an H2's subsections hidden alongside it, for an Undo to bring
 * back (`restoreRow`). `subsections` counts the H3s that went with it.
 */
export function removeRow(
  rows: TreeRow[],
  key: string,
): { rows: TreeRow[]; removed: TreeRow | null; subsections: number } {
  const row = rows.find((candidate) => candidate.key === key);
  if (!row || !canRemoveRow(rows, key))
    return { rows, removed: null, subsections: 0 };
  const hidden = new Set(removalKeys(rows, row));
  return {
    rows: rows.map((candidate) => {
      if (!hidden.has(candidate.key)) return candidate;
      return candidate.key === key
        ? { ...candidate, removed: true as const }
        : { ...candidate, removed: true as const, removedWith: key };
    }),
    removed: row,
    subsections: hidden.size - 1,
  };
}

/**
 * The undo of `removeRow`: the row shown again in the place it kept, with the subsections removed
 * with it (not one removed on its own before).
 */
export function restoreRow(rows: TreeRow[], key: string): TreeRow[] {
  return rows.map((row) => {
    if (!row.removed || (row.key !== key && row.removedWith !== key))
      return row;
    const { removed: _removed, removedWith: _with, ...restored } = row;
    return restored;
  });
}

/**
 * The most sections one approval adds: the backend takes six and drops the rest without a word
 * (MAX_ADDED_SECTIONS in rext-backend's outline_edits.py), so the tree stops at six and says why.
 */
export const MAX_ADDED_SECTIONS = 6;

/** The sections the user added that approval would send, in every list. */
export function addedSections(rows: TreeRow[]): number {
  return rows.filter((row) => row.id === null && shown(row)).length;
}

export function canAddSection(rows: TreeRow[]): boolean {
  return addedSections(rows) < MAX_ADDED_SECTIONS;
}

/** Whether an Undo may bring a removal back: not when the added sections it holds would pass the cap. */
export function canRestoreRow(rows: TreeRow[], key: string): boolean {
  const added = rows.filter(
    (row) =>
      row.removed &&
      row.id === null &&
      (row.key === key || row.removedWith === key),
  ).length;
  return added === 0 || addedSections(rows) + added <= MAX_ADDED_SECTIONS;
}

let addedCount = 0;

/**
 * A new section in `gap` of its list's shown rows (0 is the top, the list's length its end), at
 * `level` when the list has levels (an H2 unless said otherwise). The rows unchanged for a blank
 * heading, past the cap, for a subsection at the top, or above a deeper row (`takesNew`).
 */
export function insertRow(
  rows: TreeRow[],
  list: string,
  gap: number,
  heading: string,
  level: "H2" | "H3" = "H2",
): TreeRow[] {
  const trimmed = heading.trim();
  const listRows = shownInList(rows, list);
  if (!trimmed || !canAddSection(rows) || listRows.length === 0) return rows;
  const hasLevels = listRows.some((row) => row.level);
  if (!takesNew(listRows, gap, hasLevels ? LEVEL_RANK[level] : 2)) return rows;
  addedCount += 1;
  const added: TreeRow = {
    key: `added-${addedCount}`,
    id: null,
    list,
    heading: trimmed,
    ...(hasLevels ? { level } : {}),
  };
  const at = insertionIndex(rows, listRows, gap, levelRank(added));
  return [...rows.slice(0, at), added, ...rows.slice(at)];
}

/** A new section at the end of its list, as an H2 when the list has levels. */
export function addRow(
  rows: TreeRow[],
  list: string,
  heading: string,
): TreeRow[] {
  return insertRow(rows, list, shownInList(rows, list).length, heading);
}

/**
 * A new subsection (an H3) under an H2, after that H2's subsections (E31, rext-control#599). Only an
 * H2 takes one; the list's levels already say it has them. It goes before a removed H2 that waits on
 * its Undo there, so an Undo can't come back between the parent and its new subsection. Removing the
 * H2 takes it along, like any of its H3s.
 */
export function addSubsection(
  rows: TreeRow[],
  parentKey: string,
  heading: string,
): TreeRow[] {
  const parent = rows.find((row) => row.key === parentKey);
  if (parent?.level !== "H2" || !shown(parent)) return rows;
  const listRows = shownInList(rows, parent.list);
  const gap = blockEnd(listRows, listRows.indexOf(parent));
  return insertRow(rows, parent.list, gap, heading, "H3");
}

/** Whether the rows differ from what the gate offered: order, headings, levels, removals or additions. */
export function rowsEdited(
  allRows: TreeRow[],
  offered: EditableSectionRow[],
): boolean {
  const rows = allRows.filter(shown);
  if (rows.length !== offered.length) return true;
  return rows.some(
    (row, index) =>
      row.id !== offered[index].id ||
      row.heading !== offered[index].heading ||
      row.level !== offered[index].heading_level,
  );
}

/** The `sections` approval sends: one entry per row, in the user's order. */
export type SectionEdit =
  | { id: string; heading: string; heading_level?: HeadingLevel }
  | { new: true; list: string; heading: string; heading_level?: HeadingLevel };

export function sectionEdits(rows: TreeRow[]): SectionEdit[] {
  return rows.filter(shown).map((row) => {
    const level = row.level ? { heading_level: row.level } : {};
    return row.id
      ? { id: row.id, heading: row.heading, ...level }
      : { new: true as const, list: row.list, heading: row.heading, ...level };
  });
}

// ── What a screen reader hears after an edit ────────────────────────────────

/** A row's place among its list's shown rows: its position, the row before it, and its section. */
export function rowPlace(
  rows: TreeRow[],
  key: string,
): {
  position: number;
  total: number;
  previous: TreeRow | null;
  /** The row it is a subsection of; null for a section. */
  parent: TreeRow | null;
  /** The shown rows of its block beneath it. */
  subsections: number;
} | null {
  const row = rows.find((candidate) => candidate.key === key);
  if (!row || !shown(row)) return null;
  const listRows = shownInList(rows, row.list);
  const index = listRows.indexOf(row);
  const rank = levelRank(row);
  let parent: TreeRow | null = null;
  for (let at = index - 1; at >= 0 && rank > 2; at -= 1)
    if (levelRank(listRows[at]) < rank) {
      parent = listRows[at];
      break;
    }
  return {
    position: index + 1,
    total: listRows.length,
    previous: listRows[index - 1] ?? null,
    parent,
    subsections: blockEnd(listRows, index) - index - 1,
  };
}

const withSubsections = (heading: string, subsections: number) =>
  subsections === 0
    ? heading
    : `${heading} and its ${subsections === 1 ? "subsection" : `${subsections} subsections`}`;

/** "Moved Timing and its 2 subsections to position 8 of 14, after Choosing crops." */
export function moveAnnouncement(
  before: TreeRow[],
  after: TreeRow[],
  key: string,
): string {
  const was = rowPlace(before, key);
  const place = rowPlace(after, key);
  const row = after.find((candidate) => candidate.key === key);
  if (!was || !place || !row) return "";
  const where =
    place.parent && place.parent.key !== was.parent?.key
      ? `now a subsection of ${place.parent.heading}`
      : place.previous
        ? `after ${place.previous.heading}`
        : "at the top";
  return `Moved ${withSubsections(row.heading, place.subsections)} to position ${place.position} of ${place.total}, ${where}.`;
}

/** "Bed sizes is now a subsection of Planning your beds." */
export function levelAnnouncement(rows: TreeRow[], key: string): string {
  const place = rowPlace(rows, key);
  const row = rows.find((candidate) => candidate.key === key);
  if (!place || !row) return "";
  if (place.parent)
    return `${row.heading} is now a subsection of ${place.parent.heading}.`;
  // The rows under it now: the subsections after it in its old section, and its own H4s, a level up.
  const taken = place.subsections;
  return taken === 0
    ? `${row.heading} is now a section.`
    : `${row.heading} is now a section, with its ${taken === 1 ? "subsection" : `${taken} subsections`}.`;
}

/** "Removed Timing and its 2 subsections. Undo is in the notification." */
export function removalAnnouncement(
  heading: string,
  subsections: number,
): string {
  return `Removed ${withSubsections(heading, subsections)}. Undo is in the notification.`;
}

/** "Restored Timing and its 2 subsections." */
export function restoreAnnouncement(
  heading: string,
  subsections: number,
): string {
  return `Restored ${withSubsections(heading, subsections)}.`;
}

/** "Added Tools for the first season as a section, position 12 of 15." */
export function insertAnnouncement(
  rows: TreeRow[],
  list: string,
  gap: number,
): string {
  const row = shownInList(rows, list)[gap];
  const place = row && rowPlace(rows, row.key);
  if (!row || !place) return "";
  const as = place.parent
    ? ` as a subsection of ${place.parent.heading}`
    : row.level
      ? " as a section"
      : "";
  return `Added ${row.heading}${as}, position ${place.position} of ${place.total}.`;
}

/**
 * A list's rows counted by the list's own name, for a list without heading levels (a How-to's "Steps"
 * and "Tools" are not sections): "5 steps", "1 tool". A name with no simple singular (not a plain
 * plural in -s: "categories", "tools needed") counts items instead, so one row never reads "1 steps".
 */
function countByName(count: number, list: string): string {
  const plural = listLabel(list).toLowerCase();
  const simple =
    /[a-z]s$/.test(plural) &&
    !/(ss|us|is|ies|sses|xes|zes|ches|shes)$/.test(plural);
  if (!simple) return `${count} ${count === 1 ? "item" : "items"}`;
  return `${count} ${count === 1 ? plural.slice(0, -1) : plural}`;
}

/**
 * The summary above a list: "9 sections · 5 subsections · ~3,100 words" where the rows have heading
 * levels, and the rows by the list's name where they have none ("5 steps · ~900 words").
 */
export function listSummary(
  rows: TreeRow[],
  outline: unknown,
  list: string,
): string {
  const listRows = shownInList(rows, list);
  const budgets = rows
    .filter((row) => row.list === list && row.id)
    .map((row) => sectionPlan(outline, row.id)?.wordCount ?? 0)
    .filter((words) => words > 0)
    .sort((a, b) => a - b);
  // An added section gets its neighbours' middle budget, as the backend gives it (_added_item).
  const addedBudget = budgets[Math.floor(budgets.length / 2)] ?? 0;
  const words = listRows.reduce(
    (sum, row) =>
      sum +
      (row.id ? (sectionPlan(outline, row.id)?.wordCount ?? 0) : addedBudget),
    0,
  );
  const sections = listRows.filter((row) => levelRank(row) === 2).length;
  const subsections = listRows.length - sections;
  return [
    listRows.some((row) => row.level)
      ? `${sections} ${sections === 1 ? "section" : "sections"}`
      : countByName(listRows.length, list),
    subsections > 0
      ? `${subsections} ${subsections === 1 ? "subsection" : "subsections"}`
      : "",
    words > 0 ? `~${words.toLocaleString()} words` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * The FAQ's questions, read as the backend's extract_outline_faqs reads them: the outline's `faqs`,
 * else its `faq`; a list of questions or of `{ question }`, or a wrapper holding one under `faqs`.
 * Shown read-only: the FAQ isn't a body heading, and approval sends no edits to it.
 */
export function readOutlineFaqs(outline: unknown): string[] {
  if (!isRecord(outline)) return [];
  for (const key of ["faqs", "faq"]) {
    const value = outline[key];
    const items = isRecord(value) ? value.faqs : value;
    if (!Array.isArray(items)) continue;
    const questions = items
      .map((item) =>
        typeof item === "string"
          ? item.trim()
          : isRecord(item) && typeof item.question === "string"
            ? item.question.trim()
            : "",
      )
      .filter(Boolean);
    if (questions.length > 0) return questions;
  }
  return [];
}

/**
 * Whether read-only blocks already show the FAQ, so its questions aren't listed twice: the backend's
 * `_render.blocks` often holds a block headed "Faqs" (its label for the outline's `faqs`), and a block
 * under another heading may list every question.
 */
export function blocksShowFaqs(
  blocks: OutlineRenderBlock[],
  questions: string[],
): boolean {
  const same = (text: string) => text.trim().toLowerCase();
  return blocks.some((block) => {
    const heading = same(block.heading);
    if (/\bfaqs?\b/.test(heading) || heading.includes("frequently asked"))
      return true;
    const labels = new Set(block.items.map((item) => same(item.label)));
    return (
      questions.length > 0 &&
      questions.every((question) => labels.has(same(question)))
    );
  });
}

// ── What a row shows under its heading ──────────────────────────────────────

/** A section's plan, as the outline holds it: everything optional. */
export interface SectionPlan {
  description?: string;
  wordCount?: number;
  questions: string[];
  keyPoints: string[];
}

/** The outline item a gate id names ("structure.sections:2"), read from the outline itself. */
export function sectionPlan(
  outline: unknown,
  id: string | null,
): SectionPlan | null {
  if (!id) return null;
  const separator = id.lastIndexOf(":");
  const path = id.slice(0, separator);
  const index = Number(id.slice(separator + 1));
  if (separator < 1 || !Number.isInteger(index)) return null;
  let node: unknown = outline;
  for (const key of path.split("."))
    node = isRecord(node) ? node[key] : undefined;
  const item = Array.isArray(node) ? node[index] : undefined;
  if (!isRecord(item)) return null;
  const words = item.suggested_word_count;
  return {
    description:
      typeof item.description === "string" && item.description.trim()
        ? item.description.trim()
        : undefined,
    wordCount: typeof words === "number" && words > 0 ? words : undefined,
    questions: nonEmptyStrings(item.questions_to_answer),
    keyPoints: nonEmptyStrings(item.key_points),
  };
}

/** A list's name for its group heading: "structure.sections" reads "Sections". */
export function listLabel(list: string): string {
  const last = list.split(".").pop() ?? list;
  const words = last.replace(/_/g, " ").trim();
  return words ? words[0].toUpperCase() + words.slice(1) : list;
}

/**
 * The outline as read-only blocks, for a gate that offers no section edits (an
 * older or restored run): the backend's `_render` blocks, else the outline's own
 * sections as one list, so there is always the outline to review.
 */
export function readOnlyBlocks(outline: unknown): OutlineRenderBlock[] {
  if (!isRecord(outline)) return [];
  const render = isRecord(outline._render) ? outline._render.blocks : undefined;
  if (Array.isArray(render) && render.length > 0) {
    return render as OutlineRenderBlock[];
  }
  const items = (Array.isArray(outline.sections) ? outline.sections : [])
    .filter(isRecord)
    .filter(
      (section) =>
        typeof section.heading === "string" && section.heading.trim(),
    )
    .map((section) => ({
      label: (section.heading as string).trim(),
      points: nonEmptyStrings(section.key_points),
    }));
  return items.length > 0 ? [{ heading: "Sections", items }] : [];
}

// ── While the outline streams ────────────────────────────────────────────────

/** A string field of the outline model's JSON so far (its title, its brief), complete or not yet. */
export function streamedField(rawTokens: string, field: string): string {
  const pattern = new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)`, "g");
  let last: string | null = null;
  for (const match of rawTokens.matchAll(pattern)) last = match[1];
  if (!last) return "";
  try {
    return JSON.parse(`"${last}"`);
  } catch {
    return last.replace(/\\"/g, '"');
  }
}

/**
 * The section headings in the outline model's JSON so far, in order: the
 * sections appear as the model writes them, before the outline parses.
 */
export function streamedHeadings(rawTokens: string): string[] {
  const headings: string[] = [];
  const pattern = /"heading"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
  for (const match of rawTokens.matchAll(pattern)) {
    let heading = match[1];
    try {
      heading = JSON.parse(`"${heading}"`);
    } catch {
      heading = heading.replace(/\\"/g, '"');
    }
    if (heading.trim()) headings.push(heading.trim());
  }
  return headings;
}

// ── Approval ─────────────────────────────────────────────────────────────────

export interface OutlineApprovalInput {
  tone?: string;
  targetAudience?: string[];
  targetWordCount?: number;
  gate: OutlineGate;
  selectedLinks: InternalLinkSuggestion[];
  prominence: BrandProminence;
  personaId: string | null;
  rows: TreeRow[];
}

/** The approve answer's fields beside `action: "approve"`. */
export interface OutlineApproval {
  tone?: string;
  target_audience?: string[];
  target_word_count?: number;
  selected_internal_links?: InternalLinkSuggestion[];
  promote_brand?: boolean;
  brand_prominence?: BrandProminence;
  selected_persona_id: string | null;
  sections?: SectionEdit[];
}

export function buildOutlineApproval(
  input: OutlineApprovalInput,
): OutlineApproval {
  const { gate } = input;
  return {
    ...(input.tone ? { tone: input.tone } : {}),
    ...(input.targetAudience?.length
      ? { target_audience: input.targetAudience }
      : {}),
    ...(input.targetWordCount
      ? { target_word_count: input.targetWordCount }
      : {}),
    ...(gate.internalLinks.length
      ? { selected_internal_links: input.selectedLinks }
      : {}),
    // A backend that names a level takes the level; an older one reads promote_brand alone.
    ...(gate.brandPromotion
      ? gate.recommendedProminence
        ? { brand_prominence: input.prominence }
        : { promote_brand: input.prominence !== "none" }
      : {}),
    // Always sent, null included: the backend reads the key's presence as the
    // user's decision, so omitting it on a cleared persona would restore the
    // recommended one.
    selected_persona_id: input.personaId,
    ...(rowsEdited(input.rows, gate.sections)
      ? { sections: sectionEdits(input.rows) }
      : {}),
  };
}
