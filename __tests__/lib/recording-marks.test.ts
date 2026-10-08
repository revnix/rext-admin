import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import {
  markFixedText,
  markProblems,
  recordableElements,
} from "@/lib/recording-marks";

/**
 * The render sites that may carry `data-rec="own"`: a label there comes from a list in the code,
 * which one file can't prove, and a person's text can never reach it. Per file, the elements by
 * kind, in the order they stand: adding one anywhere means changing this list, in the open. Each
 * is named in the pull request that added it, with where its labels come from.
 */
const OWN_SITES: Readonly<Record<string, readonly string[]>> = {
  // The sidebar's entries, the settings group and its sub-entries: every title is a plain
  // string in components/shell/use-shell-navigation.ts.
  "components/shell/app-sidebar.tsx": [
    "NavRow > SidebarMenuButton #1",
    "SettingsRow > SidebarMenuButton #2",
    "SettingsRow > SidebarMenuSubButton #1",
  ],
  // A data table's column header: a plain string (or fixed text) in each table's column list.
  "components/ui/data-table/data-table.tsx": ["DataTable > TableHead #2"],
};

const read = (source: string) => recordableElements(ts, "page.tsx", source);
const first = (source: string) => read(source)[0];

describe("recordableElements", () => {
  it("takes text, string literals, a static choice and an icon for fixed text", () => {
    const source = `
      import { Save, Loader2 } from "lucide-react";
      export const A = ({ saving }: { saving: boolean }) => (
        <Button type="submit">
          {saving ? <Loader2 /> : <Save />}
          <span>{saving ? "Saving…" : "Save changes"}</span>
          {" "}
          {saving && "one moment"}
        </Button>
      );
    `;
    expect(first(source)).toMatchObject({ kind: "Button", notFixed: null });
  });

  it("reads through a plain tag and a link around the text", () => {
    expect(
      first(
        '<Button asChild><Link href="/pricing"><b>See the plans</b></Link></Button>',
      ).notFixed,
    ).toBeNull();
  });

  it.each([
    ["a value", "<Button>{workspace.name}</Button>"],
    ["a value", "<Button>Delete {name}</Button>"],
    ["a value", "<Label>{label}</Label>"],
    ["a value", '<Button>{name || "Untitled"}</Button>'],
    ["a call", "<TableHead>{flexRender(header, context)}</TableHead>"],
    [
      "a text built from a value",
      // Written in two pieces so that this file's own string is not a template.
      ["<Button>{`$", "{count} articles`}</Button>"].join(""),
    ],
    ["a component (UserName)", "<Button><UserName /></Button>"],
    [
      "a component (Badge)",
      "<DropdownMenuItem><Badge>New</Badge></DropdownMenuItem>",
    ],
    ["a value", "<Button>{children}</Button>"],
    ["a value", "<Button>{...parts}</Button>"],
    ["title from a value", "<Button title={article.title}>Open</Button>"],
    [
      "aria-label from a value",
      "<button><span aria-label={name}>Open</span></button>",
    ],
    [
      "HTML set from a value",
      "<label><span dangerouslySetInnerHTML={{ __html: html }}>x</span></label>",
    ],
  ])("doesn't take %s for fixed text", (reason, source) => {
    expect(first(source).notFixed).toBe(reason);
  });

  it("takes an icon only when it is lucide's: another component can say anything", () => {
    expect(first("<Button><Save /> Save</Button>").notFixed).toBe(
      "a component (Save)",
    );
  });

  it("doesn't take spread attributes for fixed: they can bring a title, HTML or the content", () => {
    expect(first("<Button {...props}>Save</Button>").notFixed).toBe(
      "attributes spread from a value",
    );
    expect(first("<button><span {...rest}>Save</span></button>").notFixed).toBe(
      "attributes spread from a value",
    );
  });

  it("reads a children prop as the content it is", () => {
    expect(
      read('<Button data-rec="show" children={workspace.name} />')[0].notFixed,
    ).toBe("a value");
    expect(
      read('<Button data-rec="show" children="Save" />')[0].notFixed,
    ).toBeNull();
    expect(first("<Button children={name}>Save</Button>").notFixed).toBe(
      "a value",
    );
  });

  it("lets a condition stand before fixed text: what it can add is a 0, never a person's text", () => {
    // React writes out a falsy left side only when it is the number 0 or NaN.
    expect(first('<Button>{count && "Open"}</Button>').notFixed).toBeNull();
    expect(first("<Button>{open && name}</Button>").notFixed).toBe("a value");
  });

  it("says which component an element stands in, and which of its kind it is there", () => {
    const elements = read(`
      function NavRow() {
        return <SidebarMenuButton>Home</SidebarMenuButton>;
      }
      const SettingsRow = () => (
        <div>
          <SidebarMenuButton />
          <SidebarMenuButton>Settings</SidebarMenuButton>
        </div>
      );
    `);
    expect(elements.map((e) => `${e.within} > ${e.kind} #${e.nth}`)).toEqual([
      "NavRow > SidebarMenuButton #1",
      "SettingsRow > SidebarMenuButton #2",
    ]);
  });

  it("reads a marked element that closes itself, for its attributes", () => {
    expect(
      read('<Button data-rec="show" aria-label={workspace.name} />'),
    ).toMatchObject([
      { kind: "Button", mark: "show", notFixed: "aria-label from a value" },
    ]);
    // Unmarked and without content: nothing to show, nothing to list.
    expect(read('<Button aria-label="Close" />')).toEqual([]);
  });

  it("reads only the kinds a recording may show, and anything that is marked", () => {
    const kinds = read(`
      <div>
        <h1>Settings</h1>
        <p data-rec="show">A description</p>
        <th>Status</th>
        <Button />
      </div>
    `).map((element) => element.kind);
    expect(kinds).toEqual(["p", "th"]);
  });
});

describe("markProblems", () => {
  const problems = (source: string, ownSites: readonly string[] = []) =>
    markProblems(ts, "page.tsx", source, ownSites);

  it("accepts a mark on fixed text", () => {
    expect(problems('<Button data-rec="show">Save</Button>')).toEqual([]);
    expect(problems('<Button data-rec="mask">{name}</Button>')).toEqual([]);
  });

  it("refuses a mark on an element that holds a value", () => {
    expect(
      problems('<Button data-rec="show">{workspace.name}</Button>'),
    ).toEqual([
      'page.tsx:1 <Button>: data-rec="show" promises fixed text, and this holds a value',
    ]);
    expect(
      problems('<Button data-rec="show" aria-label={workspace.name} />')[0],
    ).toContain("this holds aria-label from a value");
    expect(
      problems('<Button data-rec="show" {...props}>Save</Button>')[0],
    ).toContain("this holds attributes spread from a value");
  });

  it("refuses a mark on anything but a button, a menu item, a label or a table header", () => {
    expect(problems('<h1 data-rec="show">Settings</h1>')[0]).toContain(
      "is for buttons, menu items, labels and table headers",
    );
    expect(problems('<Avatar data-rec="show" />')[0]).toContain(
      "is for buttons, menu items, labels and table headers",
    );
  });

  it("allows the asserted mark only on the exact elements it is told", () => {
    const table = (first: string, second: string) => `
      function DataTable() {
        return (
          <tr>
            <TableHead${first}>{select}</TableHead>
            <TableHead${second}>{header}</TableHead>
          </tr>
        );
      }`;
    const reviewed = ["DataTable > TableHead #2"];
    expect(problems(table("", ' data-rec="own"'), reviewed)).toEqual([]);
    expect(problems(table("", ' data-rec="own"'))[0]).toContain(
      "allowed only at the render sites the test names (here: none; found: DataTable > TableHead #2)",
    );
    // Moved to its neighbour of the same kind, added a second time, or taken away.
    expect(problems(table(' data-rec="own"', ""), reviewed)[0]).toContain(
      "found: DataTable > TableHead #1",
    );
    expect(
      problems(table(' data-rec="own"', ' data-rec="own"'), reviewed)[0],
    ).toContain("found: DataTable > TableHead #1, DataTable > TableHead #2");
    expect(problems(table("", ""), reviewed)[0]).toContain("found: none");
    // And never on another kind of element, listed or not.
    expect(
      problems('<div data-rec="own">{workspace.name}</div>', [" > div #1"])[0],
    ).toContain("is for buttons, menu items, labels and table headers");
  });

  it("refuses a mark that isn't written out", () => {
    expect(problems("<Button data-rec={mark}>Save</Button>")[0]).toContain(
      "written as a plain string",
    );
  });
});

describe("markFixedText", () => {
  it("marks what is fixed and unmarked, and leaves the rest as it is", () => {
    const source = [
      "<div>",
      "  <Button onClick={save}>Save</Button>",
      "  <Button>{workspace.name}</Button>",
      '  <Label data-rec="mask">Name</Label>',
      "  <th>Status</th>",
      "  <p>Text</p>",
      "</div>",
    ].join("\n");
    const marked = markFixedText(ts, "page.tsx", source);
    expect(marked.added).toBe(2);
    expect(marked.source).toBe(
      [
        "<div>",
        '  <Button data-rec="show" onClick={save}>Save</Button>',
        "  <Button>{workspace.name}</Button>",
        '  <Label data-rec="mask">Name</Label>',
        '  <th data-rec="show">Status</th>',
        "  <p>Text</p>",
        "</div>",
      ].join("\n"),
    );
    expect(markProblems(ts, "page.tsx", marked.source)).toEqual([]);
    expect(markFixedText(ts, "page.tsx", marked.source).added).toBe(0);
  });

  it("takes a mark back where the promise no longer holds", () => {
    const source = [
      '<Button data-rec="show" onClick={open}>{workspace.name}</Button>',
      '<Button className="w-full" data-rec="show" {...props}>Save</Button>',
      '<Button data-rec="show">Save</Button>',
    ].join("\n");
    const marked = markFixedText(ts, "page.tsx", `<div>${source}</div>`);
    expect(marked.removed).toBe(2);
    expect(marked.source).toBe(
      [
        "<div><Button onClick={open}>{workspace.name}</Button>",
        '<Button className="w-full" {...props}>Save</Button>',
        '<Button data-rec="show">Save</Button></div>',
      ].join("\n"),
    );
  });
});

describe("the app's own marks", () => {
  it("promise fixed text only where the source has fixed text", () => {
    const root = process.cwd();
    const problems: string[] = [];
    for (const folder of ["app", "components"]) {
      const names = readdirSync(path.join(root, folder), {
        recursive: true,
        encoding: "utf8",
      });
      for (const name of names) {
        const file = path.join(folder, name).split(path.sep).join("/");
        if (!file.endsWith(".tsx") || file.endsWith(".test.tsx")) continue;
        problems.push(
          ...markProblems(
            ts,
            file,
            readFileSync(path.join(root, file), "utf8"),
            OWN_SITES[file] ?? [],
          ),
        );
      }
    }
    expect(problems).toEqual([]);
  });
});
