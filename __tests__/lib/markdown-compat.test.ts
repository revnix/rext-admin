import { $convertToMarkdownString } from "@lexical/markdown";
import { createEditor } from "lexical";
import {
  $importArticleMarkdown,
  CUSTOM_TRANSFORMERS,
  NODES,
  theme,
} from "@/components/ui/lexical-editor";
import { tightenLooseLists } from "@/lib/editor/markdown-compat";

const roundTrip = (markdown: string) => {
  const editor = createEditor({
    namespace: "compat",
    nodes: NODES,
    theme,
    onError: (error) => {
      throw error;
    },
  });
  editor.update(() => $importArticleMarkdown(markdown), { discrete: true });
  return {
    markdown: editor
      .getEditorState()
      .read(() => $convertToMarkdownString(CUSTOM_TRANSFORMERS)),
    blocks: (
      editor.getEditorState().toJSON().root as unknown as {
        children: { type: string }[];
      }
    ).children.map((c) => c.type),
  };
};

describe("tightenLooseLists", () => {
  it("drops the blank line between two items of one list", () => {
    expect(
      tightenLooseLists("- A\n  more A\n\n- B\n  more B\n\n- C\n  more C"),
    ).toBe("- A\n  more A\n- B\n  more B\n- C\n  more C");
  });

  it("keeps the blank line before a paragraph that ends the list", () => {
    expect(tightenLooseLists("1. A\n\n2. B\n\nAfter.")).toBe(
      "1. A\n2. B\n\nAfter.",
    );
  });

  it("leaves fenced code and `1)` lines alone", () => {
    const code = "```\n- not a list\n\n- still code\n```";
    expect(tightenLooseLists(code)).toBe(code);
    // A longer fence closes only on a run at least as long: the ``` inside is code.
    const nested = "````md\n```\n- a\n\n- b\n```\n````\n\n- c\n\n- d";
    expect(tightenLooseLists(nested)).toBe(
      "````md\n```\n- a\n\n- b\n```\n````\n\n- c\n- d",
    );
    expect(tightenLooseLists("1) one\n\n2) two")).toBe("1) one\n\n2) two");
  });

  it("finds fences where Lexical does: at any indentation, backticks only", () => {
    // A fence under a two-digit item is indented four columns.
    const indented = "10. Step\n\n    ```\n    - a\n\n    - b\n    ```";
    expect(tightenLooseLists(indented)).toBe(indented);
    // A run of backticks that ends its own line is a one-line code block.
    expect(tightenLooseLists("```one line```\n\n- c\n\n- d")).toBe(
      "```one line```\n\n- c\n- d",
    );
    // Lexical doesn't read tildes as a fence, so the list inside is a list.
    expect(tightenLooseLists("~~~\n- a\n\n- b\n~~~")).toBe(
      "~~~\n- a\n- b\n~~~",
    );
  });
});

describe("the editor's markdown on Lexical 0.52", () => {
  it("keeps a loose list whole, second lines included", () => {
    const { blocks } = roundTrip(
      "- **A.**\n  more A\n\n- **B.**\n  more B\n\n- **C.**\n  more C",
    );
    expect(blocks).toEqual(["list"]);
  });

  it("writes back a paragraph that starts like a list item escaped, so it stays a paragraph", () => {
    const once = roundTrip("1\\. **Not a list item.** Text.");
    expect(once.blocks).toEqual(["paragraph"]);
    expect(once.markdown).toBe("1\\. **Not a list item.** Text.");
    expect(roundTrip(once.markdown).blocks).toEqual(["paragraph"]);
  });

  it("escapes a paragraph that starts like a bullet, a heading or a quote", () => {
    for (const md of ["\\- dash", "\\# hash", "\\> quote"]) {
      const once = roundTrip(md);
      expect(once.blocks).toEqual(["paragraph"]);
      expect(roundTrip(once.markdown).blocks).toEqual(["paragraph"]);
    }
  });

  it("keeps an indented list marker escaped, and one followed by a tab", () => {
    for (const md of ["  \\- note", "  1\\. note", "1\\.\tTab"]) {
      const once = roundTrip(md);
      expect(once.blocks).toEqual(["paragraph"]);
      expect(roundTrip(once.markdown).blocks).toEqual(["paragraph"]);
    }
  });

  it("leaves `1)` as it is, which the preview renders as a list", () => {
    expect(roundTrip("1) **Step.**").markdown).toBe("1) **Step.**");
  });
});
