import { $isParagraphNode, ParagraphNode } from "lexical";
import type { ElementTransformer } from "@lexical/markdown";

/**
 * Two gaps in @lexical/markdown 0.52, kept apart from the editor so they can be
 * tested and removed once Lexical closes them (see the round-trip test).
 */

const LIST_ITEM = /^\s*(?:[-*+]|\d+\.)\s/; // the list items Lexical reads
const FENCE = /^\s*(?:```|~~~)/;

/**
 * Lexical 0.52 reads a loose list (items separated by blank lines) wrongly:
 * the continuation line of an item that follows a blank line leaves the list
 * as a paragraph and splits the list in two. A blank line between two items of
 * one list doesn't change what the list says, so it is dropped before import.
 * Fenced code is left as it is.
 */
export function tightenLooseLists(markdown: string): string {
  const lines = markdown.split("\n");
  const out: string[] = [];
  let inList = false;
  let inFence = false;
  lines.forEach((line, i) => {
    if (FENCE.test(line)) inFence = !inFence;
    if (inFence) {
      out.push(line);
      return;
    }
    if (LIST_ITEM.test(line)) {
      inList = true;
    } else if (line.trim() === "") {
      const next = lines.slice(i + 1).find((l) => l.trim() !== "");
      if (inList && next !== undefined && LIST_ITEM.test(next)) return;
      inList = false;
    } else if (!/^\s+\S/.test(line)) {
      inList = false;
    }
    out.push(line);
  });
  return out.join("\n");
}

// What Lexical's import reads as a block: `1. `, `- `, `* `, `+ `, `# ` to
// `###### `, `> `. (`1)` is not among them, and marked renders it as a list, so
// it is left alone.)
const BLOCK_START = /^(\d+)\. |^([-*+]) |^(#{1,6}) |^> /;

/**
 * Lexical 0.52 unescapes a paragraph written as `1\. Text` on import (0.39
 * showed the backslash), but doesn't escape it again on export, so the next
 * import turns the paragraph into a list item. This writes a paragraph that
 * starts like a list, a heading or a quote with that start escaped, as the
 * article had it.
 */
export const PARAGRAPH_ESCAPE_TRANSFORMER: ElementTransformer = {
  dependencies: [ParagraphNode],
  export: (node, traverseChildren) => {
    if (!$isParagraphNode(node)) return null;
    const text = traverseChildren(node);
    if (!BLOCK_START.test(text)) return null;
    return text.replace(BLOCK_START, (match, digits, bullet, hashes) =>
      digits
        ? `${digits}\\. `
        : bullet
          ? `\\${bullet} `
          : hashes
            ? `\\${hashes} `
            : `\\${match}`,
    );
  },
  // Paragraphs are what a line becomes when nothing else matches; this never
  // matches on import.
  regExp: /(?!)/,
  replace: () => {},
  type: "element",
};
