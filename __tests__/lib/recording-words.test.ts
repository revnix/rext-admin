import { isWords, normalizeWords, wordsInSource } from "@/lib/recording-words";

describe("normalizeWords", () => {
  it("reads a text as the page shows it: one space between words, none around", () => {
    expect(normalizeWords("  Save\n      changes ")).toBe("Save changes");
  });
});

describe("isWords", () => {
  it("lists two characters or more with a letter, and nothing as long as a paragraph", () => {
    expect(isWords("OK")).toBe(true);
    expect(isWords("?")).toBe(false);
    expect(isWords("12")).toBe(false);
    expect(isWords("a".repeat(81))).toBe(false);
  });
});

describe("wordsInSource", () => {
  const words = (source: string) => new Set(wordsInSource(source));

  it("reads the text between tags, as the page shows it", () => {
    const found = words(`
      <Button onClick={() => setOpen(true)}>Save changes</Button>
      <TableHead>
        Last
        updated
      </TableHead>
      <p>Don&rsquo;t show this again &amp; close</p>
    `);
    expect(found.has("Save changes")).toBe(true);
    expect(found.has("Last updated")).toBe(true);
    expect(found.has("Don’t show this again & close")).toBe(true);
  });

  it("reads the app's part of a sentence that has a person's text in it", () => {
    const found = words(
      "<DialogTitle>Delete {workspace.name} for good?</DialogTitle>",
    );
    expect(found.has("Delete")).toBe(true);
    expect(found.has("for good?")).toBe(true);
    expect([...found].some((text) => text.includes("workspace"))).toBe(false);
  });

  it("reads a label kept in a list, in any kind of quotes", () => {
    const found = words(`
      const items = [{ title: "Personas", url }, { title: 'Brand voice' }];
      const empty = \`No articles yet\`;
      const said = "She said \\"no\\" twice\\u2026";
    `);
    expect(found.has("Personas")).toBe(true);
    expect(found.has("Brand voice")).toBe(true);
    expect(found.has("No articles yet")).toBe(true);
    expect(found.has('She said "no" twice…')).toBe(true);
  });

  it("leaves out a text the app builds from a value", () => {
    // A template with a value put into it, written so that this file's own is not one.
    const found = words(["const label = `$", "{count} articles`;"].join(""));
    expect([...found].some((text) => text.includes("articles"))).toBe(false);
  });

  it("leaves out class lists and paths, and keeps a single name an attribute holds", () => {
    const found = words(`
      import { cn } from "@/lib/utils";
      <div data-slot="sidebar-menu-button" className="flex items-center gap-2 px-3" />
      <Button variant="outline" size="sm" />
    `);
    expect(found.has("flex items-center gap-2 px-3")).toBe(false);
    expect(found.has("@/lib/utils")).toBe(false);
    expect(found.has("sidebar-menu-button")).toBe(true);
    expect(found.has("outline")).toBe(true);
    expect(found.has("sm")).toBe(true);
  });

  it("returns nothing that isn't written in the source", () => {
    const source = '<Button>Save</Button> const a = "Cancel";';
    for (const text of wordsInSource(source)) {
      expect(source).toContain(text.split(" ")[0]);
    }
  });
});
