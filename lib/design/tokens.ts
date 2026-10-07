// The tokens app/globals.css declares, read from its text: the custom properties of its top-level
// `@theme` blocks (primitives, type, radii, shadows) and its `:root` block (roles and component tokens).

export type TokenBlock = "@theme static" | "@theme inline" | "@theme" | ":root";

export interface Token {
  name: string;
  /** As written, var() and all. */
  value: string;
  block: TokenBlock;
}

/** Every custom property of the top-level `@theme` and `:root` blocks, in the order written. */
export function readTokens(css: string): Map<string, Token> {
  const tokens = new Map<string, Token>();
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  let depth = 0;
  let block: TokenBlock | null = null;
  let buffer = "";
  for (const ch of text) {
    if (ch === "{") {
      if (depth === 0) {
        const selector = buffer.trim().replace(/\s+/g, " ");
        block =
          selector === ":root" || /^@theme( static| inline)?$/.test(selector)
            ? (selector as TokenBlock)
            : null;
      }
      depth++;
      buffer = "";
    } else if (ch === ";" || ch === "}") {
      const declaration = buffer.match(/^\s*(--[\w-]+)\s*:\s*([\s\S]*?)\s*$/);
      if (block && depth === 1 && declaration) {
        tokens.set(declaration[1], {
          name: declaration[1],
          value: declaration[2].replace(/\s+/g, " "),
          block,
        });
      }
      buffer = "";
      if (ch === "}") {
        depth--;
        if (depth === 0) block = null;
      }
    } else {
      buffer += ch;
    }
  }
  return tokens;
}

/** A value with every var() replaced by the token it names (or its fallback), all the way down. */
export function resolve(tokens: Map<string, Token>, value: string): string {
  let out = value;
  for (let round = 0; round < 20; round++) {
    const next = out.replace(
      /var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*))?\)/g,
      (whole, name: string, fallback?: string) =>
        tokens.get(name)?.value ?? fallback?.trim() ?? whole,
    );
    if (next === out) return out;
    out = next;
  }
  throw new Error(`a var() in ${value} does not settle (a cycle?)`);
}
