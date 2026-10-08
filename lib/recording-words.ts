/**
 * The app's own words, for a session recording (rext-control task 712, step E).
 *
 * A recording may show a text only when the app itself wrote it: a button's "Save", a table
 * header's "Status". What a person typed, and what the app generated for them, is not in the app's
 * source, so it can't be on this list and is never shown, whichever element it sits in. Nobody has
 * to remember to mark a screen.
 *
 * The list is read from the source when the app is built (app/api/recording-words/route.ts) and
 * fetched by the browser of a person who is recorded (lib/analytics-recording.ts). A text missing
 * from it is hidden, so every shortcut below errs towards a shorter list: reading too little hides
 * one of the app's own words. Comments and the sample pages under app/dev are not read: they hold
 * examples, and an example can be a real person's name.
 */

/** The longest text listed: a button, a menu item, a label or a table header is shorter. */
const LONGEST = 80;

/** A text as the list holds it: runs of white space as one space, none at the ends. */
export function normalizeWords(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Worth listing: two characters or more, one of them a letter, and not a paragraph. */
export function isWords(text: string): boolean {
  return text.length >= 2 && text.length <= LONGEST && /\p{L}/u.test(text);
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  apos: "'",
  quot: '"',
  lt: "<",
  gt: ">",
  nbsp: " ",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  middot: "·",
  rarr: "→",
  larr: "←",
  times: "×",
  copy: "©",
};

/** JSX text as the page shows it: `Don&rsquo;t` is "Don’t". An entity not known here stays. */
function decodeEntities(text: string): string {
  return text.replace(
    /&(#x[0-9a-f]+|#\d+|[a-z]+);/gi,
    (whole, name: string) => {
      if (name[0] !== "#") return ENTITIES[name] ?? whole;
      const code =
        name[1].toLowerCase() === "x"
          ? Number.parseInt(name.slice(2), 16)
          : Number.parseInt(name.slice(1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    },
  );
}

// A string made only of class names, keys or paths says nothing a recording would show.
const NOT_PROSE = /^[a-z0-9!_:[\]/.%()#,&>*=+@~^$|-]+$/;
const MARKS_OF_CODE = /[-_:[\]/.]|\d/;
// One name of the app's own, as an attribute holds it: `sidebar-menu-button`, `outline`.
const NAME = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

/**
 * Class lists, object keys, import paths: every word looks like code and one surely is. A single
 * name is kept, because the page's attributes carry such names (`data-slot`, a variant) and the
 * styles are written against them.
 */
function looksLikeCode(text: string): boolean {
  if (NAME.test(text)) return false;
  const tokens = text.split(" ");
  return (
    tokens.every((token) => NOT_PROSE.test(token)) &&
    tokens.some((token) => MARKS_OF_CODE.test(token))
  );
}

/** The TypeScript compiler, handed in by the caller: only the build has it. */
type Compiler = typeof import("typescript");

/**
 * Every text written in one source file: the text between JSX tags, and the string literals (a
 * label can sit in a list of menu items, far from where it is shown). The file is read by the
 * compiler's own parser, so a comment is never taken for text: comments hold examples, and an
 * example can be somebody's name. A template with a value put into it is left out, since what
 * the page shows then is not written in the source.
 */
export function wordsInSource(
  ts: Compiler,
  fileName: string,
  source: string,
): string[] {
  const found = new Set<string>();
  const keep = (text: string) => {
    const words = normalizeWords(text);
    if (isWords(words)) found.add(words);
  };
  const file = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const visit = (node: import("typescript").Node): void => {
    if (ts.isJsxText(node)) {
      keep(decodeEntities(node.text));
    } else if (
      (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      // Not the path of an import: `from "@lexical/react/LexicalComposer"` is nobody's label.
      !(
        node.parent &&
        (ts.isImportDeclaration(node.parent) ||
          ts.isExportDeclaration(node.parent))
      )
    ) {
      // An attribute's value in JSX is shown with its entities read, like the text between tags.
      const text =
        node.parent && ts.isJsxAttribute(node.parent)
          ? decodeEntities(node.text)
          : node.text;
      if (!looksLikeCode(normalizeWords(text))) keep(text);
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return [...found];
}
