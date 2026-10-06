import { $isParagraphNode, ParagraphNode } from "lexical";
import type { ElementTransformer } from "@lexical/markdown";

/**
 * Two gaps in @lexical/markdown 0.52, kept apart from the editor so they can be
 * tested and removed once Lexical closes them (see the round-trip test).
 */

const LIST_ITEM = /^\s*(?:[-*+]|\d+\.)\s/; // the list items Lexical reads
// Lexical's code fence: three or more backticks at any indentation (tildes are
// not a fence to it), closed by a line of at least as many.
const FENCE = /^[ \t]*(`{3,})/;
const FENCE_CLOSE = /^[ \t]*(`{3,})$/;
const RUN_AT_END = /`{3,}$/;

/**
 * Lexical 0.52 reads a loose list (items separated by blank lines) wrongly:
 * the continuation line of an item that follows a blank line leaves the list
 * as a paragraph and splits the list in two. A blank line between two items of
 * one list doesn't change what the list says, so it is dropped before import.
 * Fenced code is left as it is, found the way Lexical finds it: a line that
 * also ends in a run as long is a one-line code block, and otherwise the code
 * runs to a line of at least as many backticks.
 */
export function tightenLooseLists(markdown: string): string {
  const lines = markdown.split("\n");
  const out: string[] = [];
  let inList = false;
  let fence: string | null = null; // the run of backticks that opened the code
  lines.forEach((line, i) => {
    if (fence !== null) {
      const close = FENCE_CLOSE.exec(line)?.[1];
      if (close && close.length >= fence.length) fence = null;
      out.push(line);
      return;
    }
    const run = FENCE.exec(line)?.[1];
    if (run) {
      const rest = line.slice(line.indexOf(run) + run.length);
      if ((RUN_AT_END.exec(rest)?.[0].length ?? 0) < run.length) fence = run;
      inList = false;
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

// What Lexical's import reads as a block: a list marker (`1.`, `-`, `*`, `+`)
// after any indentation, or `#` to `######` or `>` at the start of the line,
// each followed by whitespace. (`1)` is not among them, and marked renders it
// as a list, so it is left alone.)
const BLOCK_START = /^(\s*)(?:(\d+)\.|([-*+]))(?=\s)|^(#{1,6}|>)(?=\s)/;

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
    return text.replace(BLOCK_START, (_match, indent, digits, bullet, mark) =>
      digits
        ? `${indent}${digits}\\.`
        : bullet
          ? `${indent}\\${bullet}`
          : `\\${mark}`,
    );
  },
  // Paragraphs are what a line becomes when nothing else matches; this never
  // matches on import.
  regExp: /(?!)/,
  replace: () => {},
  type: "element",
};
