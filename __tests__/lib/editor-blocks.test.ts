/**
 * The "/" menu's blocks (task 706): which ones a typed query keeps.
 */

import { altTextFor } from "@/lib/editor/alt-text";
import { BLOCKS, matchBlocks } from "@/lib/editor/blocks";

const titles = (query: string | null) => matchBlocks(query).map((b) => b.title);

describe("matchBlocks", () => {
  it("offers every block for a bare slash", () => {
    expect(titles(null)).toEqual(BLOCKS.map((b) => b.title));
    expect(titles("  ")).toHaveLength(BLOCKS.length);
  });

  it("narrows by the start of a word in the name", () => {
    expect(titles("head")).toEqual(["Heading 2", "Heading 3"]);
    expect(titles("LIST")).toEqual(["Bulleted list", "Numbered list"]);
    expect(titles("qu")).toEqual(["Quote"]);
  });

  it("knows a block by its other names", () => {
    expect(titles("h3")).toEqual(["Heading 3"]);
    expect(titles("steps")).toEqual(["Numbered list"]);
    expect(titles("hr")).toEqual(["Divider"]);
    expect(titles("grid")).toEqual(["Table"]);
    expect(titles("photo")).toEqual(["Image"]);
    expect(titles("upload")).toEqual(["Image"]);
  });

  it("offers nothing for a word no block has", () => {
    expect(titles("video")).toEqual([]);
  });
});

describe("altTextFor", () => {
  it("swaps what would end the alt text or its title in Markdown", () => {
    expect(altTextFor('Chart [2025] of "plays"')).toBe(
      "Chart (2025) of 'plays'",
    );
  });

  it("puts a description on one line, with no space round it", () => {
    expect(altTextFor("  A host\n at a desk  ")).toBe("A host at a desk");
    expect(altTextFor("   ")).toBe("");
  });

  it("round-trips through the editor's image pattern", () => {
    const markdown = `![${altTextFor("a [b] c")}](https://x.test/a.png "t")`;
    expect(markdown).toMatch(/^!\[([^\]]*)\]\(([^)\s"]+)(?:\s+"([^"]*)")?\)$/);
  });
});
