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
} from "@/types/generate-content";

export type HeadingLevel = "H2" | "H3";

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
    ...(level === "H2" || level === "H3" ? { heading_level: level } : {}),
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
}

export function rowsFromGate(sections: EditableSectionRow[]): TreeRow[] {
  return sections.map((row) => ({
    key: row.id,
    id: row.id,
    list: row.list,
    heading: row.heading,
    ...(row.heading_level ? { level: row.heading_level } : {}),
  }));
}

/** The rows grouped by list, each group in the order the lists first appear. */
export function groupRows(
  rows: TreeRow[],
): { list: string; rows: TreeRow[] }[] {
  const groups = new Map<string, TreeRow[]>();
  for (const row of rows) {
    const group = groups.get(row.list);
    if (group) group.push(row);
    else groups.set(row.list, [row]);
  }
  return Array.from(groups, ([list, listRows]) => ({ list, rows: listRows }));
}

/** The rows with one list's rows replaced, in that list's new order. */
export function replaceList(
  rows: TreeRow[],
  list: string,
  listRows: TreeRow[],
): TreeRow[] {
  return groupRows(rows).flatMap((group) =>
    group.list === list ? listRows : group.rows,
  );
}

/** One row moved by `offset` places within its own list (a menu's Move up and Move down). */
export function moveRow(
  rows: TreeRow[],
  key: string,
  offset: -1 | 1,
): TreeRow[] {
  const row = rows.find((candidate) => candidate.key === key);
  if (!row) return rows;
  const listRows = rows.filter((candidate) => candidate.list === row.list);
  const from = listRows.indexOf(row);
  const to = from + offset;
  if (to < 0 || to >= listRows.length) return rows;
  const reordered = [...listRows];
  reordered.splice(from, 1);
  reordered.splice(to, 0, row);
  return replaceList(rows, row.list, reordered);
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

/** Whether a row may be removed: the backend keeps a list rather than empty it, so the last one stays. */
export function canRemoveRow(rows: TreeRow[], key: string): boolean {
  const row = rows.find((candidate) => candidate.key === key);
  return (
    !!row && rows.filter((candidate) => candidate.list === row.list).length > 1
  );
}

export function removeRow(
  rows: TreeRow[],
  key: string,
): { rows: TreeRow[]; removed: { row: TreeRow; index: number } | null } {
  const index = rows.findIndex((row) => row.key === key);
  if (index === -1 || !canRemoveRow(rows, key)) return { rows, removed: null };
  return {
    rows: rows.filter((row) => row.key !== key),
    removed: { row: rows[index], index },
  };
}

/** A removed row put back where it was (the undo of `removeRow`). */
export function restoreRow(
  rows: TreeRow[],
  row: TreeRow,
  index: number,
): TreeRow[] {
  if (rows.some((candidate) => candidate.key === row.key)) return rows;
  const next = [...rows];
  next.splice(Math.min(index, next.length), 0, row);
  return next;
}

let addedCount = 0;

/** A new section at the end of its list, as an H2 when the list has levels. */
export function addRow(
  rows: TreeRow[],
  list: string,
  heading: string,
): TreeRow[] {
  const trimmed = heading.trim();
  if (!trimmed) return rows;
  addedCount += 1;
  const listRows = rows.filter((row) => row.list === list);
  const hasLevels = listRows.some((row) => row.level);
  const added: TreeRow = {
    key: `added-${addedCount}`,
    id: null,
    list,
    heading: trimmed,
    ...(hasLevels ? { level: "H2" as const } : {}),
  };
  return replaceList(rows, list, [...listRows, added]);
}

/** Whether the rows differ from what the gate offered: order, headings, removals or additions. */
export function rowsEdited(
  rows: TreeRow[],
  offered: EditableSectionRow[],
): boolean {
  if (rows.length !== offered.length) return true;
  return rows.some(
    (row, index) =>
      row.id !== offered[index].id || row.heading !== offered[index].heading,
  );
}

/** The `sections` approval sends: one entry per row, in the user's order. */
export type SectionEdit =
  | { id: string; heading: string; heading_level?: HeadingLevel }
  | { new: true; list: string; heading: string; heading_level?: HeadingLevel };

export function sectionEdits(rows: TreeRow[]): SectionEdit[] {
  return rows.map((row) => {
    const level = row.level ? { heading_level: row.level } : {};
    return row.id
      ? { id: row.id, heading: row.heading, ...level }
      : { new: true as const, list: row.list, heading: row.heading, ...level };
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
