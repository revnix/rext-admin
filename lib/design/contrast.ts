// Every pair of colour roles the dashboard draws, measured against WCAG 2.2 AA (design/app-language.md §3
// and §12): text at 4.5:1 (1.4.3), a control's edge and the focus ring at 3:1 (1.4.11). The contrast test
// asserts them from app/globals.css; /dev/tokens shows them. A pair that may stay below its minimum is
// named in ACCEPTED with what it measures and why, and nowhere else.
import { contrast, toRgba } from "./colour";
import { readTokens, resolve, type Token } from "./tokens";

export type PairKind = "text" | "edge" | "ring";

export const MINIMUM: Record<PairKind, number> = {
  text: 4.5,
  edge: 3,
  ring: 3,
};

export interface Pair {
  kind: PairKind;
  foreground: string;
  background: string;
}

/**
 * The page, a card or panel, and a hover, table header or field: everything sits on one of the three.
 * `--background` is the page under its shadcn name (the body is `bg-background`), tested in its own right
 * in case it is ever pointed somewhere else.
 */
export const SURFACES = [
  "--surface",
  "--surface-raised",
  "--surface-inset",
  "--background",
];

const onSurfaces = (kind: PairKind, foregrounds: string[]): Pair[] =>
  foregrounds.flatMap((foreground) =>
    SURFACES.map((background) => ({ kind, foreground, background })),
  );

const pair = (
  kind: PairKind,
  foreground: string,
  background: string,
): Pair => ({
  kind,
  foreground,
  background,
});

export const PAIRS: Pair[] = [
  // Text and icons on every surface, links and status text included.
  ...onSurfaces("text", [
    "--foreground",
    "--muted-foreground",
    "--primary",
    "--primary-hover",
    "--success-600",
    "--warning-600",
    "--danger-600",
    "--info-600",
  ]),
  // A field's edge, an invalid field's edge, the focus ring. `--border` is the hairline that separates
  // and carries no meaning, so 1.4.11 does not ask 3:1 of it (language §2.6).
  ...onSurfaces("edge", ["--border-strong", "--input", "--danger-500"]),
  ...onSurfaces("ring", ["--ring"]),
  // Ink on the solid fills.
  pair("text", "--primary-foreground", "--primary"),
  pair("text", "--primary-foreground", "--primary-hover"),
  pair("text", "--destructive-foreground", "--destructive"),
  pair("text", "--sidebar-primary-foreground", "--sidebar-primary"),
  // Status text on its tint (badges, notices).
  pair("text", "--success-700", "--success-50"),
  pair("text", "--warning-700", "--warning-50"),
  pair("text", "--danger-700", "--danger-50"),
  pair("text", "--info-700", "--info-50"),
  // A selected row.
  pair("text", "--foreground", "--table-row-selected"),
  pair("text", "--muted-foreground", "--table-row-selected"),
  // The names components/ui reads, in case one is pointed somewhere else.
  pair("text", "--card-foreground", "--card"),
  pair("text", "--popover-foreground", "--popover"),
  pair("text", "--secondary-foreground", "--secondary"),
  pair("text", "--accent-foreground", "--accent"),
  pair("text", "--muted-foreground", "--muted"),
  pair("text", "--sidebar-foreground", "--sidebar"),
  pair("text", "--sidebar-accent-foreground", "--sidebar-accent"),
  pair("ring", "--sidebar-ring", "--sidebar"),
];

export interface Accepted {
  foreground: string;
  background: string;
  /** What it measures, to two decimals: the test fails when it drifts, so a token cannot slip further. */
  ratio: number;
  reason: string;
}

/**
 * Pairs that stay below their minimum on purpose. The test fails when an entry stops matching a pair,
 * measures something else, or clears its minimum (then it is deleted). Empty: every pair passes.
 */
export const ACCEPTED: Accepted[] = [];

export interface Measured extends Pair {
  ratio: number;
  minimum: number;
  passes: boolean;
  accepted?: Accepted;
}

/** The colour a token resolves to, as CSS with no var() left. */
export function colourOf(tokens: Map<string, Token>, name: string): string {
  const token = tokens.get(name);
  if (!token) throw new Error(`globals.css declares no ${name}`);
  return resolve(tokens, token.value);
}

/** Every pair of PAIRS, measured on the tokens of a globals.css text. */
export function measure(css: string): Measured[] {
  const tokens = readTokens(css);
  return PAIRS.map((p) => {
    const background = toRgba(colourOf(tokens, p.background));
    if (background.alpha < 1) {
      throw new Error(
        `${p.background} is translucent: pair it with the surface under it`,
      );
    }
    const ratio = contrast(toRgba(colourOf(tokens, p.foreground)), background);
    const minimum = MINIMUM[p.kind];
    const accepted = ACCEPTED.find(
      (a) => a.foreground === p.foreground && a.background === p.background,
    );
    return { ...p, ratio, minimum, passes: ratio >= minimum, accepted };
  });
}
