/**
 * The "/" menu's blocks that stand alone (task 706): the divider puts a rule in the article, the
 * image block an upload slot; each leaves a line to type on.
 */

import { $isHorizontalRuleNode, HorizontalRuleNode } from "@lexical/extension";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  createEditor,
} from "lexical";
import { insertBlock } from "@/components/editor/slash-menu-plugin";
import { $isImageNode, ImageNode } from "@/components/ui/lexical-editor";

/** An article of these lines, the cursor at the end of the given one, after a block is picked. */
function afterBlock(
  block: "divider" | "image",
  lines: string[],
  cursorOn: number,
) {
  const editor = createEditor({
    nodes: [HorizontalRuleNode, ImageNode],
    onError: (error) => {
      throw error;
    },
  });
  editor.update(
    () => {
      const root = $getRoot().clear();
      for (const text of lines) {
        const line = $createParagraphNode();
        if (text) line.append($createTextNode(text));
        root.append(line);
      }
      root.getChildAtIndex(cursorOn)?.selectEnd();
      insertBlock(editor, block);
    },
    { discrete: true },
  );
  return editor.getEditorState().read(() => {
    const selection = $getSelection();
    const at = $isRangeSelection(selection)
      ? selection.anchor.getNode().getTopLevelElement()
      : null;
    return {
      blocks: $getRoot()
        .getChildren()
        .map((node) => {
          if ($isHorizontalRuleNode(node)) return "rule";
          // An upload slot: an image whose address is the placeholder scheme's, with no description.
          if ($isImageNode(node)) {
            const { src, altText } = node.exportJSON();
            return src.startsWith("rext-placeholder:") && altText === ""
              ? "image slot"
              : "image";
          }
          return node.getTextContent();
        }),
      cursorOn: at ? at.getIndexWithinParent() : -1,
    };
  });
}

const afterDivider = (lines: string[], cursorOn: number) =>
  afterBlock("divider", lines, cursorOn);

describe("the image block", () => {
  it("puts an upload slot above an empty line, which stays to type on", () => {
    expect(afterBlock("image", ["Intro.", ""], 1)).toEqual({
      blocks: ["Intro.", "image slot", ""],
      cursorOn: 2,
    });
  });

  it("puts the slot under a line with text, with a new line after it", () => {
    expect(afterBlock("image", ["Intro.", "Next."], 0)).toEqual({
      blocks: ["Intro.", "image slot", "", "Next."],
      cursorOn: 2,
    });
  });
});

describe("the divider block", () => {
  it("goes above an empty line, which stays to type on", () => {
    expect(afterDivider(["Intro.", ""], 1)).toEqual({
      blocks: ["Intro.", "rule", ""],
      cursorOn: 2,
    });
  });

  it("goes under a line with text, with a new line after it to type on", () => {
    expect(afterDivider(["Intro.", "Last words."], 1)).toEqual({
      blocks: ["Intro.", "Last words.", "rule", ""],
      cursorOn: 3,
    });
  });

  it("keeps the typing out of the line that came next", () => {
    expect(afterDivider(["Intro.", "Next."], 0)).toEqual({
      blocks: ["Intro.", "rule", "", "Next."],
      cursorOn: 2,
    });
  });
});
