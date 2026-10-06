// Fails when a page writes its own layout instead of using the shared ones (AGENTS.md, "Pages";
// rext-control design/app-language.md §6 and §12). Ported from the site's scripts/check-layout.mjs.
//   pnpm layout:check                    the whole tree, against the baseline (the ratchet below)
//   pnpm layout:check <file>...          only these files, with no baseline: every finding fails
//   pnpm layout:check --update           lower the baseline to today's counts (it never raises one; with no
//                                        baseline yet, it writes today's counts as the first)
// What it looks for, in app and components, outside the primitives (components/ui, components/layouts,
// components/shell):
//   no-layout          a page.tsx inside the shell that renders none of the five page layouts (ListPage,
//                      DetailPage, FormPage, SettingsPage, WorkingSurface from components/layouts), itself or
//                      through a layout.tsx above it. A page that renders nothing (a redirect) passes.
//   page-container     a page width written by hand (`mx-auto max-w-7xl`, `max-w-(--content-max)`, the
//                      `container` class): the layouts own the page's width and gutters
//   page-heading       an <h1>: the page's title is the layout header's (a working surface that draws its own
//                      heading passes `hidden` to keep the h1 for screen readers)
//   table-recipe       a hand-written <table>: use the Table primitive, and the DataTable once it exists (C3)
//   field-recipe       an <input>, <textarea> or <select> styled by hand: use Input, Textarea or Select
// The ratchet: the tree held hand-written tables and fields when the check came in (task C2), which C3, C4
// and the page tasks replace, so a whole-tree run compares each file's count per rule with
// scripts/layout-baseline.json and fails when one goes up; a new file starts at zero. An element that must stay
// as it is says why in a comment on its lines or the line above:   {/* layout-ok: the reason */}
// Before it reads the tree, the check runs its rules over two samples kept in this file, one wrong and one
// right, so that a rule which stops firing is noticed. Exit status 1 when anything is found, 2 when the check
// itself is broken.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCES = ["app", "components"];
const BASELINE = path.join(ROOT, "scripts/layout-baseline.json");
/** The primitives, the layouts and the shell: the only places a page's frame may be written. */
const PRIMITIVES = ["components/ui", "components/layouts", "components/shell"].map((d) => path.join(ROOT, d));
const LAYOUTS = ["ListPage", "DetailPage", "FormPage", "SettingsPage", "WorkingSurface"];
const MARK = /layout-ok:\s*\S/;

/** A class split from its variants: `md:hover:py-20` is `py-20` under `md:hover:`; `[&>p]:px-2` is `px-2`. */
function split(token) {
  let depth = 0;
  let cut = 0;
  for (let i = 0; i < token.length; i++) {
    const ch = token[i];
    if (ch === "[" || ch === "(") depth++;
    else if (ch === "]" || ch === ")") depth--;
    else if (ch === ":" && depth === 0) cut = i + 1;
  }
  return { variants: token.slice(0, cut), name: token.slice(cut).replace(/^[!-]+/, "").replace(/!$/, "") };
}
/** A variant that styles something other than the element itself: a pseudo-element, or its children. */
const ELSEWHERE = /(^|:)(before|after|placeholder|file|marker|selection|first-letter|first-line|backdrop|\*|\*\*)(:|$)|\[&(?![:.[\]])|::/;
/** A ring that is drawn: a ring width, not a ring colour and not `ring-0`. */
const ringed = (c) =>
  /^(inset-)?ring(-(\d+|[[(](length:|\.?\d|calc\(|min\(|max\(|clamp\().*))?$/.test(c) && !/^(inset-)?ring-0$/.test(c);

/**
 * The class lists a className expression can produce: one for each way its conditions can fall.
 * `open ? "rounded-xl border" : "p-6"` is two lists, and no element ever has all three classes.
 * Each list remembers how the conditions it met fell, so that `cn(a ? "x" : "y", a ? "z" : "w")` is
 * two lists as well, not four: one condition cannot fall both ways in one rendering.
 */
const MAX_LISTS = 64;
const one = (text) => ({ text: text === undefined ? [] : [text], when: new Map() });
function both(a, b) {
  for (const [condition, fell] of b.when) if (a.when.has(condition) && a.when.get(condition) !== fell) return null;
  return { text: [...a.text, ...b.text], when: new Map([...a.when, ...b.when]) };
}
const cross = (a, b) => a.flatMap((x) => b.map((y) => both(x, y)).filter(Boolean));
const capped = (lists) => (lists.length > MAX_LISTS ? [{ text: lists.flatMap((l) => l.text), when: new Map() }] : lists);
function given(condition, fell, lists) {
  let text = condition.getText().replace(/\s+/g, " ");
  while (text.startsWith("!")) {
    text = text.slice(1).trim();
    fell = !fell;
  }
  return cross(lists, [{ text: [], when: new Map([[text, fell]]) }]);
}
function classLists(node) {
  if (!node) return [one()];
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return [one(node.text)];
  if (ts.isJsxExpression(node) || ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isNonNullExpression(node)) {
    return classLists(node.expression);
  }
  if (ts.isTemplateExpression(node)) {
    return node.templateSpans.reduce(
      (lists, span) => capped(cross(cross(lists, classLists(span.expression)), [one(span.literal.text)])),
      [one(node.head.text)],
    );
  }
  if (ts.isConditionalExpression(node)) {
    return capped([...given(node.condition, true, classLists(node.whenTrue)), ...given(node.condition, false, classLists(node.whenFalse))]);
  }
  if (ts.isBinaryExpression(node)) {
    const operator = node.operatorToken.kind;
    if (operator === ts.SyntaxKind.AmpersandAmpersandToken) {
      return capped([...given(node.left, false, [one()]), ...given(node.left, true, classLists(node.right))]);
    }
    if (operator === ts.SyntaxKind.BarBarToken || operator === ts.SyntaxKind.QuestionQuestionToken) {
      return capped([...classLists(node.left), ...classLists(node.right)]);
    }
    if (operator === ts.SyntaxKind.PlusToken) return capped(cross(classLists(node.left), classLists(node.right)));
    return [one()];
  }
  if (ts.isCallExpression(node)) {
    // cn(...), clsx(...): every argument contributes. [..].filter(Boolean).join(" "): so does what the method is called on.
    const receiver = ts.isPropertyAccessExpression(node.expression) ? classLists(node.expression.expression) : [one()];
    return node.arguments.reduce((lists, arg) => capped(cross(lists, classLists(arg))), receiver);
  }
  if (ts.isArrayLiteralExpression(node)) return node.elements.reduce((lists, el) => capped(cross(lists, classLists(el))), [one()]);
  if (ts.isObjectLiteralExpression(node)) {
    return node.properties.reduce(
      (lists, prop) => {
        if (!ts.isPropertyAssignment(prop)) return lists;
        // cn({ "p-4": open }): the key is a class that applies when its value holds.
        if (ts.isStringLiteral(prop.name)) {
          return capped(cross(lists, [...given(prop.initializer, false, [one()]), ...given(prop.initializer, true, [one(prop.name.text)])]));
        }
        return /className$/i.test(prop.name.getText()) ? capped(cross(lists, classLists(prop.initializer))) : lists;
      },
      [one()],
    );
  }
  // A variable, or anything else whose text is not in front of us.
  return [one()];
}

/** A page's width: Tailwind's widest steps, the screens, the content token, or 1000 px and more written out. */
const PAGE_WIDTH = /^max-w-(5xl|6xl|7xl|screen-(lg|xl|2xl)|\(--content-max\)|\[--content-max\]|\[var\(--content-max\)\]|\[\d{4,}px\]|\[(6[3-9]|[7-9]\d|\d{3,})(\.\d+)?rem\])$/;
const FIELDS = new Set(["input", "textarea", "select"]);
const UNSTYLED_INPUTS = new Set(["checkbox", "radio", "hidden", "file", "range", "color", "submit", "button", "reset"]);

/**
 * The element rules. Each gets one element in one of its class lists and returns what is wrong with it, or
 * nothing. `classes` is every class on the element; `own` leaves out what styles a pseudo-element or a child.
 */
const RULES = {
  "page-container": ({ own }) => {
    if (own.includes("container")) return "the container class: the page layouts own the page's width";
    const width = own.filter((c) => PAGE_WIDTH.test(c));
    return width.length && own.includes("mx-auto")
      ? `a page width written by hand (${width.join(" ")} mx-auto): use a page layout from components/layouts`
      : null;
  },
  "page-heading": ({ tag }) =>
    tag === "h1" ? "an <h1> written by the page: the title is the layout header's (`hidden` keeps it for screen readers)" : null,
  "table-recipe": ({ tag }) => (tag === "table" ? "a hand-written <table>: use the Table primitive (the DataTable once C3 brings it)" : null),
  "field-recipe": ({ tag, types, own }) => {
    if (!FIELDS.has(tag) || (types.length > 0 && types.every((t) => UNSTYLED_INPUTS.has(t)))) return null;
    const has = (re) => own.some((c) => re.test(c));
    return has(/^rounded/) && has(/^px?-/) && (has(/^border(-|$)/) || own.some(ringed))
      ? `a <${tag}> styled by hand: use Input, Textarea or Select from components/ui`
      : null;
  },
};

/** The values an attribute can have where they are written out: `type="x"`, `type={a ? "x" : "y"}`. */
const values = (initializer) => [...new Set(classLists(initializer).map((list) => list.text.join("")).filter(Boolean))];

/** Every element finding in one source text. */
function elementFindings(file, source) {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const lines = source.split("\n");
  const found = [];
  const visit = (node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(sf).replace(/^(motion|m)\./, "");
      let lists = [one()];
      let types = [];
      for (const attr of node.attributes.properties) {
        if (!ts.isJsxAttribute(attr)) continue;
        const name = attr.name.getText(sf);
        if (name === "className" && attr.initializer) lists = classLists(attr.initializer);
        else if (name === "type") types = values(attr.initializer);
      }
      const first = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line;
      const last = sf.getLineAndCharacterOfPosition(node.getEnd()).line;
      const excused = lines.slice(Math.max(0, first - 1), last + 1).some((l) => MARK.test(l));
      // A rule is broken when one of the element's class lists breaks it; it is reported once.
      const broken = new Map();
      for (const list of lists) {
        const tokens = list.text.join(" ").split(/\s+/).filter(Boolean).map(split);
        const classes = tokens.map((t) => t.name);
        const own = tokens.filter((t) => !ELSEWHERE.test(t.variants)).map((t) => t.name);
        for (const [rule, test] of Object.entries(RULES)) {
          if (broken.has(rule)) continue;
          const what = test({ tag, types, classes, own });
          if (what) broken.set(rule, what);
        }
      }
      if (!excused) for (const [rule, what] of broken) found.push({ file, line: first + 1, rule, what });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
}

/** The names a file imports from components/layouts. */
function layoutImports(source) {
  const names = new Set();
  for (const m of source.matchAll(/import\s*\{([^}]*)\}\s*from\s*["'](?:@\/components\/layouts|\.{1,2}\/[^"']*layouts)(?:\/[^"']*)?["']/g)) {
    for (const part of m[1].split(",")) {
      const name = part.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0];
      if (LAYOUTS.includes(name)) names.add(name);
    }
  }
  return names;
}
/** A page that renders nothing of its own (no JSX at all): it redirects, on the server or in the browser. */
function rendersNothing(source) {
  const sf = ts.createSourceFile("page.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let jsx = false;
  const visit = (node) => {
    if (jsx) return;
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) jsx = true;
    else ts.forEachChild(node, visit);
  };
  visit(sf);
  return !jsx;
}

/**
 * The page rule: a page.tsx under a layout.tsx that mounts the shell renders one of the five layouts, itself
 * or through a layout.tsx between it and the shell. `read` gives a file's text, or null when it does not exist.
 */
function pageFinding(file, source, read) {
  if (path.basename(file) !== "page.tsx") return null;
  const app = path.join(ROOT, "app");
  if (!file.startsWith(`${app}${path.sep}`)) return null;
  if (MARK.test(source) || rendersNothing(source) || layoutImports(source).size) return null;
  let shelled = false;
  let laidOut = false;
  for (let dir = path.dirname(file); dir.startsWith(app); dir = path.dirname(dir)) {
    const layout = read(path.join(dir, "layout.tsx"));
    if (layout === null) continue;
    if (layoutImports(layout).size) laidOut = true;
    if (/\bShellLayout\b/.test(layout)) shelled = true;
  }
  if (!shelled || laidOut) return null;
  return { file, line: 1, rule: "no-layout", what: `a page with none of the five layouts: render ${LAYOUTS.join(", ")} from components/layouts` };
}

/** The check checks itself: on the wrong sample every rule must fire as often as written here, and on the right one never. */
const WRONG = `
export default function Wrong({ open }) {
  return (
    <div className="mx-auto max-w-7xl px-6">
      <div className={cn("w-full", open && "container")}>
        <h1 className="text-3xl font-bold">Personas</h1>
        <div className="mx-auto max-w-(--content-max)">A width from the token, written by the page</div>
        <table className="w-full"><tbody><tr><td>A row</td></tr></tbody></table>
        <input type="email" className="rounded-lg border border-border px-4 py-3" />
        <textarea className="rounded-md p-4 ring-1 ring-border" />
        <select className={\`rounded-md border px-3 \${open ? "h-10" : "h-9"}\`} />
      </div>
    </div>
  );
}`;
const WRONG_EXPECTED = { "page-container": 3, "page-heading": 1, "table-recipe": 1, "field-recipe": 3 };
const RIGHT = `
export default function Right({ open }) {
  return (
    <ListPage title="Personas" actions={<Button>New persona</Button>}>
      <div className="mx-auto max-w-md text-center">A centred block, not a page</div>
      <h2 className="text-section">A section title</h2>
      <Table><TableBody><TableRow><TableCell>A row</TableCell></TableRow></TableBody></Table>
      <Input type="email" className="pl-9" />
      <input type="checkbox" className="rounded border px-1" />
      <input type={open ? "radio" : "checkbox"} className="rounded border px-1" />
      <input className="w-full bg-transparent outline-none" />
      {/* layout-ok: the calendar grid is a table of days, read as one */}
      <table className="w-full" />
      <div className="[&_table]:mx-auto [&_table]:max-w-7xl">Only what is inside is drawn</div>
    </ListPage>
  );
}`;
const PAGES = {
  "app/w/layout.tsx": `export default function L({ children }) { return <ShellLayout>{children}</ShellLayout>; }`,
  "app/w/a/page.tsx": `export default function P() { return <div>No layout</div>; }`,
  "app/w/b/page.tsx": `import { ListPage } from "@/components/layouts";\nexport default function P() { return <ListPage title="B">x</ListPage>; }`,
  "app/w/c/layout.tsx": `import { SettingsPage } from "@/components/layouts";\nexport default function L({ children }) { return <SettingsPage title="C" sections={[]}>{children}</SettingsPage>; }`,
  "app/w/c/d/page.tsx": `export default function P() { return <form>Under a settings layout</form>; }`,
  "app/w/e/page.tsx": `import { redirect } from "next/navigation";\nexport default function P() { redirect("/w"); }`,
  "app/w/f/page.tsx": `/** /w/<slug> has no view: home is "/". */\nexport default function P() { useEffect(() => router.replace("/"), [router]); return null; }`,
  "app/login/page.tsx": `export default function P() { return <div>Outside the shell</div>; }`,
};
const PAGES_EXPECTED = ["app/w/a/page.tsx"];
function selfTest() {
  const fired = {};
  for (const f of elementFindings("wrong.tsx", WRONG)) fired[f.rule] = (fired[f.rule] || 0) + 1;
  for (const rule of Object.keys(RULES)) {
    if ((fired[rule] || 0) !== WRONG_EXPECTED[rule]) {
      throw new Error(`the rule "${rule}" fired ${fired[rule] || 0} time(s) on the wrong sample, not ${WRONG_EXPECTED[rule]}`);
    }
  }
  const noise = elementFindings("right.tsx", RIGHT);
  if (noise.length) throw new Error(`"${noise[0].rule}" fired on the right sample, line ${noise[0].line}`);
  const read = (full) => PAGES[path.relative(ROOT, full)] ?? null;
  const flagged = Object.keys(PAGES)
    .filter((rel) => pageFinding(path.join(ROOT, rel), PAGES[rel], read))
    .sort();
  if (flagged.join() !== PAGES_EXPECTED.join()) {
    throw new Error(`the rule "no-layout" flagged [${flagged.join(", ")}], not [${PAGES_EXPECTED.join(", ")}]`);
  }
}

function files(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...files(full));
    else if (entry.name.endsWith(".tsx")) out.push(full);
  }
  return out;
}
const isPrimitive = (file) => PRIMITIVES.some((dir) => file.startsWith(`${dir}${path.sep}`));
const readFile = (file) => (fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null);
function check(file) {
  const source = fs.readFileSync(file, "utf8");
  const found = elementFindings(file, source);
  const page = pageFinding(file, source, readFile);
  if (page) found.unshift(page);
  return found;
}

try {
  selfTest();
} catch (error) {
  console.error(`layout:check is broken: ${error.message}`);
  process.exit(2);
}

const flags = process.argv.slice(2).filter((a) => a.startsWith("--"));
const named = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const relative = (file) => path.relative(ROOT, file);
const HINT = "Use a layout from components/layouts and the primitives, or, where the element must stay, say why: {/* layout-ok: reason */}";

if (named.length) {
  // Named files: no baseline, every finding counts. A primitive is exempt either way.
  const asked = named.map((f) => path.resolve(f)).filter((f) => !isPrimitive(f)).sort();
  let total = 0;
  for (const file of asked) {
    for (const f of check(file)) {
      console.log(`${relative(file)}:${f.line}  ${f.rule}  ${f.what}`);
      total++;
    }
  }
  console.log(`layout:check: ${asked.length} files, ${total ? `${total} found` : "nothing found"}`);
  if (total) console.log(HINT);
  process.exit(total ? 1 : 0);
}

// The whole tree, file by file and rule by rule, against the baseline.
const counts = {};
const byFile = {};
for (const file of SOURCES.flatMap((d) => files(path.join(ROOT, d))).filter((f) => !isPrimitive(f)).sort()) {
  const found = check(file);
  if (!found.length) continue;
  const name = relative(file);
  byFile[name] = found;
  counts[name] = {};
  for (const f of found) counts[name][f.rule] = (counts[name][f.rule] ?? 0) + 1;
}
const baseline = fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, "utf8")) : {};

if (flags.includes("--update")) {
  // Lower only: a count that went up stays at its old value, and the run below still fails on it. With no
  // baseline yet, today's counts become the first one.
  const first = !fs.existsSync(BASELINE);
  const next = {};
  for (const [file, rules] of Object.entries(counts)) {
    for (const [rule, n] of Object.entries(rules)) {
      const kept = first ? n : Math.min(n, baseline[file]?.[rule] ?? 0);
      if (kept > 0) (next[file] ??= {})[rule] = kept;
    }
  }
  fs.writeFileSync(BASELINE, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`layout:check: baseline written (${Object.keys(next).length} files)`);
}

const current = fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, "utf8")) : {};
let over = 0;
const totals = {};
for (const [file, rules] of Object.entries(counts)) {
  for (const [rule, n] of Object.entries(rules)) {
    totals[rule] = (totals[rule] ?? 0) + n;
    const allowed = current[file]?.[rule] ?? 0;
    if (n <= allowed) continue;
    over += n - allowed;
    console.log(`${file}: ${n} ${rule}, the baseline allows ${allowed}:`);
    for (const f of byFile[file].filter((x) => x.rule === rule)) console.log(`  ${file}:${f.line}  ${f.what}`);
  }
}
const all = Object.values(totals).reduce((a, b) => a + b, 0);
const summary = Object.entries(totals)
  .map(([rule, n]) => `${rule} ${n}`)
  .join(", ");
console.log(
  `layout:check: ${all} findings in ${Object.keys(counts).length} files${summary ? ` (${summary})` : ""}${over ? `, ${over} more than the baseline` : ", none above the baseline"}`,
);
if (over) console.log(HINT);
process.exit(over ? 1 : 0);
