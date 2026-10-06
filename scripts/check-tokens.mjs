// Fails when a design value is written outside the token layers of app/globals.css (AGENTS.md, "Styling";
// rext-control design/app-language.md §3 and §12). Ported from the site's scripts/check-tokens.mjs.
//   pnpm tokens:check                    the whole tree, against the baseline (the ratchet below)
//   pnpm tokens:check <file>...          only these files, with no baseline: every finding fails
//   pnpm tokens:check --update           lower the baseline to today's counts (it never raises one; with no
//                                        baseline yet, it writes today's counts as the first)
//   pnpm tokens:check --table            the counts per rule and the files with the most findings
// What it looks for, in app, components, lib, hooks, providers and stores:
//   stock-palette      a class that takes its colour from Tailwind's palette (`text-slate-900`, `bg-white`,
//                      `border-black/10`): name the job instead (`text-foreground`, `bg-surface-raised`)
//   arbitrary-colour   a class with a colour written into it (`bg-[#0366F8]`, `text-[rgb(2_6_23)]`)
//   literal-colour     a hex, rgb(), hsl(), oklch() or oklab() colour anywhere but a primitive in globals.css. A
//                      primitive is a custom property declared in `@theme` under a name outside Tailwind's
//                      namespaces (`--accent-600`, `--neutral-900`); a role points at one with var().
//   inline-colour      a colour property in a style object given one of CSS's named colours
//                      (`style={{ color: "red" }}`)
//   unknown-variable   `var(--color-…)` for a colour that globals.css does not declare. It resolves to nothing
//                      once the palette is off.
//   dark-class         a `dark:` class: the dashboard is light only, and a dark theme comes back as one block of
//                      roles, never as classes in components
//   arbitrary-radius, arbitrary-shadow, arbitrary-size
//                      a radius, shadow or font size written by hand: into a class (`rounded-[7px]`,
//                      `shadow-[0_1px_…]`, `text-[15px]`, `text-[clamp(…)]`, `[font-size:15px]`) or into a
//                      stylesheet rule (`border-radius: 7px`, `font-size: 0.875rem`). A size that can be under
//                      12 px is reported as small-type instead. A value made of tokens passes (`var(--radius)`),
//                      and so does a ring (`box-shadow: 0 0 0 1px var(--ring)`, what Tailwind's ring-1 draws).
//   off-scale          a radius or shadow class outside the language's three of each (`rounded-xl`, `shadow-lg`):
//                      use rounded-sm, rounded-md, rounded-full, shadow-hairline, shadow-overlay or shadow-modal
// The class rules also read `@apply` in the stylesheets. There, the values the language allows (§2 and §3):
//   radius-token       a radius token other than 6 px, 10 px or round
//   shadow-token       a shadow token other than --shadow-hairline, --shadow-overlay and --shadow-modal
//   small-type         a font-size token that can be under 12 px, or whose smallest size cannot be told
//   literal-colour     also a named colour in a colour property or a custom property (`color: red`)
// The ratchet: the tree held about 2,000 findings when the check came in (task B3), so a whole-tree run compares
// each file's count per rule with scripts/tokens-baseline.json and fails when one goes up. The sweep (task B7)
// lowers the counts and runs --update; a new file starts at zero. A line that must stay as it is says why, on it
// or on the line above:   tokens-ok: the reason
// Before it reads the tree, the check runs its rules over samples kept in this file, wrong and right, so a rule
// that stops firing is noticed. Exit status 1 when anything is found, 2 when the check itself is broken.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCES = ["app", "components", "lib", "hooks", "providers", "stores"];
const STYLESHEET = path.join(ROOT, "app/globals.css");
const BASELINE = path.join(ROOT, "scripts/tokens-baseline.json");
const EXTENSIONS = [".ts", ".tsx", ".js", ".mjs", ".css"];

/** The families of Tailwind's own palette: read from the installed version, so a family it adds is covered. */
function stockFamilies() {
  const known =
    "slate|gray|zinc|neutral|stone|mauve|olive|mist|taupe|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
  const names = new Set(known.split("|"));
  try {
    const theme = fs.readFileSync(path.join(ROOT, "node_modules/tailwindcss/theme.css"), "utf8");
    for (const m of theme.matchAll(/^\s*--color-([a-z]+)-\d{2,3}:/gm)) names.add(m[1]);
  } catch {
    // Not installed (a bare checkout): the list above stands.
  }
  return [...names, "white", "black"].join("|");
}
const FAMILIES = stockFamilies();
// Every utility that takes a colour.
const PROPERTIES =
  "bg|text|border|border-[trblxyse]|ring|ring-offset|inset-ring|from|via|to|fill|stroke|divide|outline|shadow|inset-shadow|drop-shadow|text-shadow|accent|caret|decoration|placeholder";
// `text-slate-900`, `hover:bg-white/10`, `border-black`. Not `text-slate-\d{3}` in a pattern, and not a role
// that happens to end in a family's name.
const STOCK = new RegExp(
  `(?<![\\w\\-/.])(?:${PROPERTIES})-(?:${FAMILIES})(?:-\\d{2,3})?(?:/(?:\\d+|\\[[^\\]]+\\]))?!?(?![\\w\\-(\\\\])`,
  "g",
);
const ARBITRARY = new RegExp(
  `(?<![\\w\\-/.])(?:${PROPERTIES})-\\[(?:#|rgba?\\(|hsla?\\(|oklch\\(|oklab\\(|color:)[^\\]]*\\]`,
  "g",
);
// A hex colour: three, four, six or eight digits, not the start of a longer word (`#faq-list`) and not an
// HTML entity (`&#039;`).
const HEX = /(?<!&)#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-zA-Z_-])/g;
const FUNCTIONAL = /\b(?:rgba?|hsla?|oklch|oklab)\(\s*[\d.]/g;
const COLOUR_VARIABLE = /var\(\s*(--color-[\w-]+)/g;
// CSS's named colours (CSS Color 4), all 148. Not transparent or currentColor: they carry no colour of their own.
const NAMED_COLOURS = `aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet
  brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan
  darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred
  darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue
  dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green
  greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon
  lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon
  lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta
  maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen
  mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab
  orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum
  powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna
  silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet
  wheat white whitesmoke yellow yellowgreen`
  .split(/\s+/)
  .join("|");
const INLINE = new RegExp(
  `\\b(?:color|background|backgroundColor|border(?:Top|Right|Bottom|Left)?Color|fill|stroke|outlineColor)\\s*:\\s*["'\`](?:${NAMED_COLOURS})["'\`]`,
  "gi",
);
const NAMED = new RegExp(`(?<![\\w.-])(?:${NAMED_COLOURS})(?![\\w.-])`, "i");
const DARK = /(?<![\w-])dark:[\w[(-]/g;
const ARBITRARY_RADIUS = /(?<![\w-])rounded(?:-(?:t|r|b|l|s|e|tl|tr|bl|br|ss|se|es|ee))?-\[(?!var\()[^\]]+\]/g;
const ARBITRARY_SHADOW = /(?<![\w-])shadow-\[(?!var\()[^\]]+\]/g;
// `text-[15px]`, `text-[8pt]`, `text-[clamp(10px,1vw,16px)]`, `text-[length:1rem]`: a size, so not a colour (the
// colour rules have those) and not a token (`text-[var(--x)]`).
const ARBITRARY_SIZE =
  /(?<![\w-])text-\[(?!#|--|var\(|length:var\(|color:|(?:rgba?|hsla?|oklch|oklab|color-mix)\()([^\]]+)\]/g;
// A declaration written as a class: `[font-size:15px]`, `[border-radius:7px]`, `[box-shadow:0_1px_2px_black]`.
const ARBITRARY_PROPERTY = /(?<![\w-])\[(font-size|font|border(?:-[a-z]+)*-radius|box-shadow):([^\]]+)\]/g;
const RADIUS_CLASS = /(?<![\w-])rounded(?:-([\w\-[\]().%+]+))?(?![\w-])/g;
const SHADOW_CLASS = /(?<![\w-])shadow(?:-([\w\-[\]().%+/]+))?(?![\w-])/g;
const CLASS_CONTEXT = /className|\bclass=|\b(?:cn|cva|clsx|twMerge)\(|@apply\b/;
// The CSS properties that take a colour, for a named colour written into a stylesheet rule.
const COLOUR_PROPERTY =
  /^(?:color|background(?:-color)?|border(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?(?:-color)?|outline(?:-color)?|fill|stroke|text-decoration(?:-color)?|caret-color|accent-color|column-rule(?:-color)?|stop-color|flood-color|lighting-color|scrollbar-color)$/;
const KEYWORD = /^(?:inherit|initial|unset|revert|revert-layer|none|0)$/i;
// A ring, as Tailwind's ring utilities draw one: no offset, no blur, a spread in a token's colour.
const RING = /^(?:inset\s+)?0(?:px)?\s+0(?:px)?\s+0(?:px)?\s+[\d.]+(?:px|rem)?\s+var\([^()]+\)(?:\s+inset)?$/;
const RADII = new Set(["sm", "md", "full", "none", "(--card-radius)", "(--control-radius)"]);
const SHADOWS = new Set(["hairline", "overlay", "modal", "none"]);
const MARK = /tokens-ok:\s*\S/;
/** Tailwind's theme namespaces. A custom property under one of them is a token for utilities, not a primitive. */
const NAMESPACES =
  /^--(color|font|text|font-weight|tracking|leading|breakpoint|container|spacing|radius|shadow|inset-shadow|drop-shadow|blur|perspective|aspect|ease|animate)(-|$)/;

/**
 * A line of code without its comment: nothing for a comment line (`//`, `/*`, ` *`, `{/*`), and without an
 * inline `/* … *\/` or a trailing `// …` (after a space, so the `//` of a URL stays).
 */
function withoutComment(line) {
  if (/^\s*(?:\/\/|\/\*|\*|\{\/\*)/.test(line)) return "";
  const code = line.replace(/\/\*.*?\*\//g, "");
  const at = code.search(/(?<=\s)\/\//);
  return at < 0 ? code : code.slice(0, at);
}

/** The colours globals.css declares: `--color-primary`, `--color-success-600`. */
function declaredColours(sheet) {
  return new Set([...sheet.matchAll(/^\s*(--color-[\w-]+)\s*:/gm)].map((m) => m[1]));
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The findings in one file's text. `stylesheet` strips CSS comments; `primitives` allows literals in `@theme`
 * custom properties outside Tailwind's namespaces (globals.css only); `declared` is the set of colour variables.
 */
function scan(text, { stylesheet = false, primitives = false, declared = null, markup = false } = {}) {
  const found = [];
  const lines = text.split("\n");
  let depth = 0;
  let themeDepth = 0; // the brace depth at which the current `@theme` block opened, or 0
  let inComment = false;
  lines.forEach((raw, i) => {
    const allowed = MARK.test(raw) || (i > 0 && MARK.test(lines[i - 1]));
    let line = raw;
    if (stylesheet) {
      // Comments in the stylesheet describe the tokens and name the classes they replace.
      let out = "";
      for (let c = 0; c < line.length; c++) {
        if (inComment) {
          if (line.startsWith("*/", c)) {
            inComment = false;
            c++;
          }
        } else if (line.startsWith("/*", c)) {
          inComment = true;
          c++;
        } else out += line[c];
      }
      line = out;
    }
    const report = (rule, what) => {
      if (!allowed) found.push({ line: i + 1, rule, what });
    };
    for (const m of line.matchAll(STOCK)) report("stock-palette", m[0]);
    for (const m of line.matchAll(ARBITRARY)) report("arbitrary-colour", m[0]);
    for (const m of line.matchAll(INLINE)) report("inline-colour", m[0]);
    if (declared)
      for (const m of line.matchAll(COLOUR_VARIABLE))
        if (!declared.has(m[1])) report("unknown-variable", `var(${m[1]})`);

    // A comment does not render, so `#338` there is an issue number, not a colour (stylesheet comments are
    // already gone).
    const code = stylesheet ? line : withoutComment(line);
    const literals = [...code.matchAll(HEX), ...code.matchAll(FUNCTIONAL)]
      // A colour inside an arbitrary class is reported once, by the rule above.
      .filter((m) => !new RegExp(`-\\[[^\\]]*${escape(m[0])}`).test(code));
    if (literals.length) {
      let primitive = false;
      if (primitives && themeDepth > 0) {
        const property = line.match(/^\s*(--[\w-]+)\s*:/);
        primitive = Boolean(property) && !NAMESPACES.test(property[1]);
      }
      if (!primitive)
        for (const m of literals)
          report("literal-colour", m[0].startsWith("#") ? m[0] : `${m[0].split("(")[0]}(…)`);
    }
    if (markup || /@apply\b/.test(line)) {
      for (const m of line.matchAll(DARK)) report("dark-class", m[0].slice(0, -1));
      for (const m of line.matchAll(ARBITRARY_RADIUS)) report("arbitrary-radius", m[0]);
      for (const m of line.matchAll(ARBITRARY_SHADOW)) report("arbitrary-shadow", m[0]);
      // In a class, `_` stands for a space.
      for (const m of line.matchAll(ARBITRARY_SIZE)) {
        const found = literal("font-size", m[1].replace(/^length:/, "").replaceAll("_", " "));
        if (found) report(found.rule, m[0]);
      }
      for (const m of line.matchAll(ARBITRARY_PROPERTY)) {
        const found = literal(m[1], m[2].replaceAll("_", " "));
        if (found) report(found.rule, m[0]);
      }
      // The bare words also appear in prose, so `rounded` and `shadow` alone count only where classes are built.
      const classes = CLASS_CONTEXT.test(line);
      for (const m of line.matchAll(RADIUS_CLASS)) {
        const value = (m[1] ?? "").replace(/^(?:t|r|b|l|s|e|tl|tr|bl|br|ss|se|es|ee)-/, "");
        if ((m[1] || classes) && !RADII.has(value) && !value.startsWith("[")) report("off-scale", m[0]);
      }
      for (const m of line.matchAll(SHADOW_CLASS)) {
        const value = m[1] ?? "";
        if ((m[1] || classes) && !SHADOWS.has(value) && !value.startsWith("[")) report("off-scale", m[0]);
      }
    }
    if (stylesheet) {
      for (const ch of line) {
        if (ch === "{") {
          depth++;
          if (themeDepth === 0 && /@theme\b/.test(line)) themeDepth = depth;
        } else if (ch === "}") {
          if (depth === themeDepth) themeDepth = 0;
          depth--;
        }
      }
    }
  });
  return found;
}

/** Every declaration of a stylesheet: name, value, line, and whether it sits inside `@theme`. */
function declarations(sheet) {
  const out = [];
  const stack = [];
  let text = "";
  let line = 1;
  let start = 1;
  for (let i = 0; i < sheet.length; i++) {
    if (sheet.startsWith("/*", i)) {
      const close = sheet.indexOf("*/", i + 2);
      const comment = sheet.slice(i, close < 0 ? sheet.length : close + 2);
      line += (comment.match(/\n/g) || []).length;
      i += comment.length - 1;
      continue;
    }
    const ch = sheet[i];
    if (ch === '"' || ch === "'") {
      const close = sheet.indexOf(ch, i + 1);
      const quoted = sheet.slice(i, close < 0 ? sheet.length : close + 1);
      text += quoted;
      i += quoted.length - 1;
      continue;
    }
    if (ch === "{") {
      stack.push(text.trim().replace(/\s+/g, " "));
      text = "";
    } else if (ch === "}" || ch === ";") {
      const m = text.match(/^\s*(--[\w-]+|-?[a-zA-Z][\w-]*)\s*:\s*([\s\S]*)$/);
      if (m) {
        out.push({
          name: m[1],
          value: m[2].replace(/\s+/g, " ").trim(),
          line: start,
          theme: stack.some((s) => /^@theme\b/.test(s)),
        });
      }
      text = "";
      if (ch === "}") stack.pop();
    } else {
      if (ch === "\n") line++;
      if (!text.trim()) start = line;
      text += ch;
    }
  }
  return out;
}

/** A value with every var() replaced by what it names (or its fallback), as far as the map knows. */
function expand(values, value, depth = 0) {
  if (depth > 20) return value;
  const next = value.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*))?\)/, (whole, name, fallback) =>
    values.has(name) ? values.get(name) : (fallback ?? whole).trim(),
  );
  return next === value ? value : expand(values, next, depth + 1);
}

/** The arguments of a function call, split at its own commas: `clamp(1rem, calc(1px + 2vw), 3rem)` has three. */
function args(inner) {
  const out = [];
  let level = 0;
  let from = 0;
  for (let i = 0; i < inner.length; i++) {
    if (inner[i] === "(") level++;
    else if (inner[i] === ")") level--;
    else if (inner[i] === "," && level === 0) {
      out.push(inner.slice(from, i).trim());
      from = i + 1;
    }
  }
  out.push(inner.slice(from).trim());
  return out;
}

/**
 * The smallest a length can be, in px, or null when it cannot be told: 0.75rem is 12, a clamp() its first
 * value, a calc() of lengths added and subtracted its sum. `em` is what 1em is taken to be (null: unknown).
 */
function smallest(value, em = null) {
  const v = value.trim();
  const length = v.match(/^(-?[\d.]+)(px|rem|pt|em)$/);
  if (length) {
    const unit = { px: 1, rem: 16, pt: 4 / 3, em }[length[2]];
    return unit === null ? null : Number(length[1]) * unit;
  }
  if (/^-?[\d.]+(vw|vh|vi|vb|vmin|vmax|svw|lvw|dvw|cqw|cqi)$/.test(v)) return 0; // a narrow window takes it to nothing
  const sum = v.match(/^calc\(([^()]*)\)$/);
  if (sum) {
    const terms = sum[1].replace(/\s+/g, " ").match(/^(\S+)((?: [+-] \S+)*)$/);
    if (!terms) return null;
    let total = smallest(terms[1], em);
    for (const [, op, term] of terms[2].matchAll(/ ([+-]) (\S+)/g)) {
      const px = smallest(term, em);
      if (total === null || px === null) return null;
      total += op === "+" ? px : -px;
    }
    return total;
  }
  const call = v.match(/^(clamp|max|min)\(([\s\S]*)\)$/);
  if (!call) return null;
  const parts = args(call[2]).map((part) => smallest(part, em));
  if (call[1] === "clamp") return parts[0];
  if (parts.some((p) => p === null)) return null;
  return call[1] === "max" ? Math.max(...parts) : Math.min(...parts);
}

/** A value with every var() taken out, fallbacks and all: what is left was written by hand. */
function handWritten(value) {
  let out = value;
  for (let before = ""; before !== out; ) {
    before = out;
    out = out.replace(/var\([^()]*(?:\([^()]*\)[^()]*)*\)/g, "");
  }
  return out;
}

/** Whether a value holds a number written by hand (a lone 0 does not count). */
const numbered = (value) => /\d/.test(handWritten(value).replace(/(?<![\w.-])0(?![\w.%])/g, ""));

/**
 * The finding for a font size, radius or shadow written by hand into a declaration (a stylesheet rule or a
 * `[property:value]` class), or null when the value comes from the tokens or the property is another one.
 */
function literal(property, value) {
  const name = property.toLowerCase();
  const v = value.replace(/\s*!important\s*$/, "").trim();
  const what = `${name}: ${v}`;
  if (KEYWORD.test(v)) return null;
  if (name === "box-shadow") {
    const drawn = args(v).some((layer) => !RING.test(layer) && numbered(layer));
    return drawn ? { rule: "arbitrary-shadow", what } : null;
  }
  if (/^border(?:-[a-z]+)*-radius$/.test(name)) return numbered(v) ? { rule: "arbitrary-radius", what } : null;
  if (name !== "font-size" && name !== "font") return null;
  // In the shorthand (`600 0.875rem/1.25rem var(--font-sans)`), the size is the first length.
  const size = name === "font" ? handWritten(v).match(/(?<![\w.-])-?[\d.]+(?:px|rem|em|pt|%)/)?.[0] : v;
  if (!size || !numbered(size)) return null;
  const px = smallest(size, 16);
  return { rule: px !== null && px < 12 ? "small-type" : "arbitrary-size", what };
}

/** The named colour in a value, if it holds one: addresses, strings and var() set aside. */
function namedColour(value) {
  const plain = handWritten(value)
    .replace(/url\([^)]*\)/g, "")
    .replace(/"[^"]*"|'[^']*'/g, "");
  return plain.match(NAMED)?.[0];
}

/**
 * The stylesheet's own rules: the radius, shadow and type tokens the language allows, and the sizes and named
 * colours written by hand into its rules. `primitives` as in scan().
 */
function sheetFindings(sheet, { primitives = false } = {}) {
  const lines = sheet.split("\n");
  const excused = (line) => MARK.test(lines[line - 1] ?? "") || MARK.test(lines[line - 2] ?? "");
  const decls = declarations(sheet).filter((d) => !d.name.includes("*"));
  const values = new Map(decls.filter((d) => d.name.startsWith("--")).map((d) => [d.name, d.value]));
  const found = [];
  const report = (d, rule, what) => {
    if (!excused(d.line)) found.push({ line: d.line, rule, what });
  };
  const shadows = new Set(["--shadow-hairline", "--shadow-overlay", "--shadow-modal"]);
  for (const d of decls) {
    const custom = d.name.startsWith("--");
    const colour = namedColour(d.value);
    const primitive = primitives && d.theme && !NAMESPACES.test(d.name);
    if (colour && (custom ? !primitive : COLOUR_PROPERTY.test(d.name.toLowerCase()))) {
      report(d, "literal-colour", `${d.name}: ${colour}`);
    }
    if (!custom) {
      const drawn = literal(d.name, d.value);
      if (drawn) report(d, drawn.rule, drawn.what);
      continue;
    }
    const px = () => smallest(expand(values, d.value));
    if (/^--radius-/.test(d.name) || /-radius$/.test(d.name)) {
      if (![6, 10, 9999].includes(px())) report(d, "radius-token", `${d.name}: ${d.value}`);
    }
    if (
      (/^--(shadow|inset-shadow|drop-shadow|text-shadow)-/.test(d.name) || /-shadow$/.test(d.name)) &&
      !shadows.has(d.name)
    ) {
      report(d, "shadow-token", d.name);
    }
    if (/^--text-[\w-]+$/.test(d.name) && !d.name.slice(2).includes("--")) {
      const size = px();
      if (size === null)
        report(d, "small-type", `${d.name}: ${d.value} (its smallest size cannot be told; write it in rem or px)`);
      else if (size < 12) report(d, "small-type", `${d.name}: ${d.value}`);
    }
  }
  return found;
}

function selfTest() {
  const markup = { markup: true };
  const wrong = [
    ['<p className="text-slate-900 hover:bg-white/10 border-black">', "stock-palette", 3],
    ['<p className="bg-[#0366F8] text-[rgb(2_6_23)]">', "arbitrary-colour", 2],
    ['const ink = "#0A0A0A"; const tint = "rgb(2 6 23 / 0.05)";', "literal-colour", 2],
    ['const ink = "#0A0A0A"; // was #333 before B1', "literal-colour", 1],
    ['<p style={{ color: "red", backgroundColor: "white", fill: "rebeccapurple" }}>', "inline-colour", 3],
    ['<p className="dark:bg-card md:dark:text-foreground">', "dark-class", 2],
    ['<p className="rounded-[7px] rounded-t-[3px] [border-top-left-radius:7px]">', "arbitrary-radius", 3],
    ['<p className="shadow-[0_1px_2px_black] [box-shadow:0_1px_2px_black]">', "arbitrary-shadow", 2],
    [
      '<p className="text-[15px] text-[1.1rem] text-[length:20px] text-[clamp(1rem,2vw,2rem)] [font-size:15px]">',
      "arbitrary-size",
      5,
    ],
    [
      '<p className="text-[10px] text-[0.6rem] text-[8pt] text-[clamp(10px,1vw,16px)] [font-size:0.5em]">',
      "small-type",
      5,
    ],
    ['<p className="rounded-xl rounded-lg shadow-lg shadow md:rounded-2xl">', "off-scale", 5],
    ["// a rounded corner, a soft shadow, and rounded-lg", "off-scale", 1],
  ];
  for (const [sample, rule, count] of wrong) {
    const hits = scan(sample, markup).filter((f) => f.rule === rule).length;
    if (hits !== count) throw new Error(`the rule ${rule} found ${hits} of ${count} in its sample`);
  }
  const declared = new Set(["--color-primary"]);
  const variables = scan('<g stroke="var(--color-white)" fill="var(--color-primary)" />', { declared });
  if (variables.length !== 1 || variables[0].rule !== "unknown-variable") {
    throw new Error("the rule unknown-variable did not find the one undeclared colour in its sample");
  }
  const right = [
    '<p className="text-foreground bg-surface-raised border-border text-success-600 bg-primary/10 rounded-md shadow-overlay">',
    '<p className="rounded-sm rounded-full rounded-(--card-radius) shadow-hairline shadow-none text-body rounded-[var(--x)]">',
    '<a href="#faq">&#039;</a> // text-slate-\\d{3} in a pattern is not a class',
    "// rext-backend G28 (#338 in rext-control) sent each event as a whole frame",
    ' * Fixed in #123; see https://example.com/#456 for the background.',
    'const step = 1; // after #338 {/* and #339 */}',
    '<p className="text-slate-900"> {/* tokens-ok: a sample */}',
    '<p style={{ color: "var(--foreground)" }} className="text-[var(--x)]">',
    '<p className="text-[length:var(--x)] [font-size:var(--text-body)] [box-shadow:0_0_0_1px_var(--ring)]">',
    '<p style={{ color: "transparent", fill: "currentColor" }}>',
  ];
  for (const sample of right) {
    const hits = scan(sample, markup);
    if (hits.length) throw new Error(`a clean sample was reported: ${hits[0].rule} ${hits[0].what}`);
  }
  const sheet =
    "@theme static {\n  --neutral-900: oklch(20% 0 0);\n  --color-primary: var(--neutral-900);\n  --color-odd: #123456;\n}\n.x { color: #123456; } /* text-slate-900 */";
  const hits = scan(sheet, { stylesheet: true, primitives: true });
  if (hits.length !== 2 || hits.some((f) => f.rule !== "literal-colour")) {
    throw new Error(`the stylesheet sample gave ${hits.length} findings, not the two literals outside the primitives`);
  }
  const language = [
    ":root { --radius: 6px; }",
    "@theme inline {",
    "  --radius-sm: var(--radius);",
    "  --radius-md: calc(var(--radius) + 4px);",
    "  --radius-full: 9999px;",
    "  --radius-odd: 22px;",
    "  --shadow-overlay: 0 1px 2px var(--border);",
    "  --shadow-float:",
    "    0 1px 2px var(--border);",
    "  --text-tiny: 0.625rem;",
    "  --text-body: 0.875rem;",
    "  --text-floor: max(10px, 1vw);",
    "  --text-odd: calc(1rem - 2px);",
    "  --text-body--line-height: 1.25rem;",
    "  /* tokens-ok: a sample excused on the line above */",
    "  --text-excused: 0.5rem;",
    "}",
    ":root { --card-radius: 0.75rem; --control-radius: var(--radius); --card-shadow: none; }",
  ].join("\n");
  const want = { "radius-token": 2, "shadow-token": 2, "small-type": 2 };
  const got = {};
  const findings = sheetFindings(language);
  for (const f of findings) got[f.rule] = (got[f.rule] ?? 0) + 1;
  for (const [rule, count] of Object.entries(want)) {
    if (got[rule] !== count) throw new Error(`the rule ${rule} found ${got[rule] ?? 0} of ${count} in its sample`);
  }
  const at = (rule, name) => findings.find((f) => f.rule === rule && f.what.startsWith(name))?.line;
  if (at("shadow-token", "--shadow-float") !== 8) throw new Error("the rule shadow-token reported the wrong line");
  const applied = scan(".x { @apply rounded-xl dark:bg-card; }", { stylesheet: true }).map((f) => f.rule);
  if (applied.sort().join(" ") !== "dark-class off-scale") {
    throw new Error(`the class rules found "${applied.join(" ")}" in an @apply, not dark-class and off-scale`);
  }
  // Rules written by hand: one radius, one shadow, three sizes, two named colours; the rest are tokens or rings.
  const rules = [
    ".a { border-radius: 17px; border-top-left-radius: var(--radius); border-radius: var(--radius) 0 0 var(--radius); }",
    ".b { box-shadow: 0 1px 2px var(--border); }",
    ".c { box-shadow: 0 0 0 1px var(--ring), var(--shadow-overlay); box-shadow: inset 0 0 0 2px var(--ring); }",
    ".d { font-size: 10px; }",
    ".e { font-size: 0.875rem; font: 600 1.5rem/2rem var(--font-sans); }",
    ".f { font-size: var(--text-body); font: inherit; border-radius: 0; box-shadow: none; }",
    ".g { color: rebeccapurple; background: url(red.png) var(--surface); }",
    "@theme static { --neutral-0: white; }",
    ":root { --surface: white; --hairline: 1px solid var(--border); }",
  ].join("\n");
  const expected = {
    "arbitrary-radius": 1,
    "arbitrary-shadow": 1,
    "small-type": 1,
    "arbitrary-size": 2,
    "literal-colour": 2,
  };
  const drawn = {};
  for (const f of sheetFindings(rules, { primitives: true })) drawn[f.rule] = (drawn[f.rule] ?? 0) + 1;
  for (const rule of new Set([...Object.keys(expected), ...Object.keys(drawn)])) {
    if (drawn[rule] !== expected[rule]) {
      throw new Error(`the rule ${rule} found ${drawn[rule] ?? 0} of ${expected[rule] ?? 0} in the rules sample`);
    }
  }
}

function files(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...files(full));
    else if (EXTENSIONS.includes(path.extname(entry.name))) out.push(full);
  }
  return out;
}

/** Every finding of one file. */
function check(file, declared) {
  const text = fs.readFileSync(file, "utf8");
  const css = file.endsWith(".css");
  const primitives = file === STYLESHEET;
  const found = scan(text, { stylesheet: css, primitives, declared, markup: !css });
  if (css) found.push(...sheetFindings(text, { primitives }));
  return found.sort((a, b) => a.line - b.line);
}

try {
  selfTest();
} catch (error) {
  console.error(`tokens:check is broken: ${error.message}`);
  process.exit(2);
}

const flags = process.argv.slice(2).filter((a) => a.startsWith("--"));
const named = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const declared = declaredColours(fs.readFileSync(STYLESHEET, "utf8"));
const relative = (file) => path.relative(ROOT, file);

if (named.length) {
  // Named files: no baseline, every finding counts.
  let total = 0;
  for (const file of named.map((f) => path.resolve(f)).sort()) {
    for (const f of check(file, declared)) {
      console.log(`${relative(file)}:${f.line}  ${f.rule}  ${f.what}`);
      total++;
    }
  }
  console.log(`tokens:check: ${named.length} files, ${total ? `${total} found` : "nothing found"}`);
  process.exit(total ? 1 : 0);
}

// The whole tree, file by file and rule by rule, against the baseline.
const counts = {};
const byFile = {};
for (const file of SOURCES.flatMap((d) => files(path.join(ROOT, d))).sort()) {
  const found = check(file, declared);
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
  console.log(`tokens:check: baseline written (${Object.keys(next).length} files)`);
}

const totals = {};
for (const rules of Object.values(counts))
  for (const [rule, n] of Object.entries(rules)) totals[rule] = (totals[rule] ?? 0) + n;
if (flags.includes("--table")) {
  console.log("| Rule | Findings |\n|---|---|");
  for (const [rule, n] of Object.entries(totals).sort((a, b) => b[1] - a[1])) console.log(`| ${rule} | ${n} |`);
  const top = Object.entries(byFile)
    .map(([file, found]) => [file, found.length])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);
  console.log("\n| File | Findings |\n|---|---|");
  for (const [file, n] of top) console.log(`| \`${file}\` | ${n} |`);
}

const current = fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, "utf8")) : {};
let over = 0;
for (const [file, rules] of Object.entries(counts)) {
  for (const [rule, n] of Object.entries(rules)) {
    const allowed = current[file]?.[rule] ?? 0;
    if (n <= allowed) continue;
    over += n - allowed;
    console.log(`${file}: ${n} ${rule}, the baseline allows ${allowed}:`);
    for (const f of byFile[file].filter((x) => x.rule === rule)) console.log(`  ${file}:${f.line}  ${f.what}`);
  }
}
const all = Object.values(totals).reduce((a, b) => a + b, 0);
console.log(
  `tokens:check: ${all} findings in ${Object.keys(counts).length} files${over ? `, ${over} more than the baseline` : ", none above the baseline"}`,
);
process.exit(over ? 1 : 0);
