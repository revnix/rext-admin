/**
 * The blocks the full-screen editor's "/" menu offers (task 706), and which of them a typed query
 * keeps. The plugin maps each id to what it does in the editor.
 */

export type BlockId =
  | "h2"
  | "h3"
  | "bulleted"
  | "numbered"
  | "quote"
  | "table"
  | "divider";

export type Block = { id: BlockId; title: string; keywords: string[] };

export const BLOCKS: readonly Block[] = [
  {
    id: "h2",
    title: "Heading 2",
    keywords: ["h2", "heading", "section", "title"],
  },
  { id: "h3", title: "Heading 3", keywords: ["h3", "heading", "subsection"] },
  {
    id: "bulleted",
    title: "Bulleted list",
    keywords: ["ul", "list", "bullets", "points"],
  },
  {
    id: "numbered",
    title: "Numbered list",
    keywords: ["ol", "list", "numbers", "steps"],
  },
  { id: "quote", title: "Quote", keywords: ["blockquote", "citation"] },
  { id: "table", title: "Table", keywords: ["grid", "rows", "columns"] },
  {
    id: "divider",
    title: "Divider",
    keywords: ["line", "rule", "hr", "separator"],
  },
];

/** The blocks a query keeps: every one for an empty query, else those whose name or keywords start a word with it. */
export function matchBlocks(query: string | null): Block[] {
  const wanted = (query ?? "").trim().toLowerCase();
  if (!wanted) return [...BLOCKS];
  return BLOCKS.filter((block) =>
    [block.title, ...block.keywords].some((text) =>
      text
        .toLowerCase()
        .split(/\s+/)
        .some((word) => word.startsWith(wanted)),
    ),
  );
}
