/**
 * The "/" menu's divider (task 706): it puts a rule in the article, and leaves a line to type on.
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

/** An article of these lines, the cursor at the end of the given one, after "Divider" is picked. */
function afterDivider(lines: string[], cursorOn: number) {
  const editor = createEditor({
    nodes: [HorizontalRuleNode],
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
      insertBlock(editor, "divider");
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
        .map((node) =>
          $isHorizontalRuleNode(node) ? "rule" : node.getTextContent(),
        ),
      cursorOn: at ? at.getIndexWithinParent() : -1,
    };
  });
}

describe("the divider block", () => {
  it("goes above an empty line, which stays to type on", () => {
    expect(afterDivider(["Intro.", ""], 1)).toEqual({
      blocks: ["Intro.", "rule", ""],
      cursorOn: 2,
    });
  });

  it("goes under a line with text, with a new line after it at the article's end", () => {
    expect(afterDivider(["Intro.", "Last words."], 1)).toEqual({
      blocks: ["Intro.", "Last words.", "rule", ""],
      cursorOn: 3,
    });
  });

  it("goes between two lines, the cursor on the one after", () => {
    expect(afterDivider(["Intro.", "Next."], 0)).toEqual({
      blocks: ["Intro.", "rule", "Next."],
      cursorOn: 2,
    });
  });
});
