/**
 * The article editor's round trip, snapshotted so a Lexical upgrade can be
 * compared with the version before it: each article's markdown goes into an
 * editor built with the app's own nodes, theme and transformers, and the test
 * records the markdown that comes out, the document's structure and the HTML
 * the editor renders.
 *
 * The articles (__tests__/fixtures/articles): wordpress-maintenance-cost.md is
 * a real Rext AI run's article (rext-control reports/part3/demo-run); four are
 * real rext.ai blog posts, converted from their published HTML to markdown;
 * constructs.md is written by hand to cover what the real ones lack (quotes,
 * code, rules, underline, nested lists, the smaller headings).
 */

import fs from "node:fs";
import path from "node:path";
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
} from "@lexical/markdown";
import { createEditor, type LexicalEditor } from "lexical";
import {
  CUSTOM_TRANSFORMERS,
  NODES,
  theme,
} from "@/components/ui/lexical-editor";

const dir = path.join(__dirname, "../fixtures/articles");
const articles = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".md"))
  .sort();

function load(markdown: string): { editor: LexicalEditor; root: HTMLElement } {
  const root = document.createElement("div");
  root.contentEditable = "true";
  const editor = createEditor({
    namespace: "round-trip",
    nodes: NODES,
    theme,
    onError: (error) => {
      throw error;
    },
  });
  editor.setRootElement(root);
  editor.update(
    () => {
      $convertFromMarkdownString(markdown, CUSTOM_TRANSFORMERS);
    },
    { discrete: true },
  );
  return { editor, root };
}

const toMarkdown = (editor: LexicalEditor) =>
  editor
    .getEditorState()
    .read(() => $convertToMarkdownString(CUSTOM_TRANSFORMERS));

/** The document's shape and content, without the serialisation details that
 *  change between Lexical versions without changing the document. */
type Shape = { [key: string]: unknown; children?: Shape[] };
const KEEP = [
  "type",
  "tag",
  "listType",
  "value",
  "url",
  "title",
  "text",
  "format",
  "src",
  "altText",
  "headerState",
];
function shape(node: Shape): Shape {
  const out: Shape = {};
  for (const key of KEEP)
    if (node[key] !== undefined && node[key] !== "") out[key] = node[key];
  if (Array.isArray(node.children)) out.children = node.children.map(shape);
  return out;
}

describe.each(articles)("%s", (file) => {
  const markdown = fs.readFileSync(path.join(dir, file), "utf8");

  it("round-trips the same on every Lexical version", () => {
    const { editor, root } = load(markdown);
    const out = toMarkdown(editor);
    expect(out).toMatchSnapshot("markdown");
    expect(
      shape(editor.getEditorState().toJSON().root as unknown as Shape),
    ).toMatchSnapshot("structure");
    expect(root.innerHTML).toMatchSnapshot("html");
    // Saving what the editor wrote and opening it again changes nothing.
    expect(toMarkdown(load(out).editor)).toBe(out);
  });
});
