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
 * one of the app's own words; nothing here can add a person's.
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

const ESCAPES: Record<string, string> = {
  n: "\n",
  t: "\t",
  r: "\r",
  b: "\b",
  f: "\f",
  v: "\v",
  0: "\0",
};

/** A string literal's value: `\"`, `\n`, `…` and the like. */
function unescapeLiteral(body: string): string {
  return body.replace(
    /\\(?:u\{([0-9a-f]+)\}|u([0-9a-f]{4})|x([0-9a-f]{2})|(\r?\n)|([\s\S]))/gi,
    (
      _whole,
      braced?: string,
      four?: string,
      two?: string,
      newline?: string,
      one?: string,
    ) => {
      const hex = braced ?? four ?? two;
      if (hex) {
        const code = Number.parseInt(hex, 16);
        return code <= 0x10ffff ? String.fromCodePoint(code) : "";
      }
      if (newline) return "";
      return ESCAPES[one ?? ""] ?? one ?? "";
    },
  );
}

// A double-quoted, a single-quoted or a backtick string with nothing put into it.
const LITERAL =
  /"((?:[^"\\\n]|\\[\s\S])*)"|'((?:[^'\\\n]|\\[\s\S])*)'|`((?:[^`\\$]|\\[\s\S]|\$(?!\{))*)`/g;
// The text between a tag or an expression and the next one: `>Save<`, `>Delete {`, `} now<`.
const JSX_TEXT = /[>}]([^<>{}]+)(?=[<{])/g;
// Code that sits between the same characters: an arrow function's body, a comparison.
const CODE = /=>|&&|\|\||[=!]==|[;=]|^\s*[(.?:,)\]]/;
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

/**
 * Every text written in one source file: the text between JSX tags, and the string literals (a
 * label can sit in a list of menu items, far from where it is shown). Rough on purpose: it reads
 * the file as text, so it also returns scraps of code. They are harmless, since no person's text
 * equals `items.length > 0 ?`, and whatever it misses is only hidden.
 */
export function wordsInSource(source: string): string[] {
  const found = new Set<string>();
  const keep = (text: string) => {
    const words = normalizeWords(text);
    if (isWords(words)) found.add(words);
  };
  for (const match of source.matchAll(JSX_TEXT)) {
    // Decoded first: an entity's own `;` is not code's.
    const text = decodeEntities(match[1]);
    if (!CODE.test(text)) keep(text);
  }
  for (const match of source.matchAll(LITERAL)) {
    const text = normalizeWords(
      unescapeLiteral(match[1] ?? match[2] ?? match[3] ?? ""),
    );
    if (!looksLikeCode(text)) keep(text);
  }
  return [...found];
}
