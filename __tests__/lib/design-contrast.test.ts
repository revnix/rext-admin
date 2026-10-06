import fs from "node:fs";
import path from "node:path";
import { contrast, toHex, toRgba } from "@/lib/design/colour";
import {
  ACCEPTED,
  colourOf,
  MINIMUM,
  measure,
  PAIRS,
} from "@/lib/design/contrast";
import { readTokens } from "@/lib/design/tokens";

// The roles of app/globals.css against WCAG 2.2 AA (design/app-language.md §3): text 4.5:1, a control's
// edge and the focus ring 3:1, the accepted exceptions in ACCEPTED (lib/design/contrast.ts) only.
const CSS = fs.readFileSync(
  path.resolve(__dirname, "../../app/globals.css"),
  "utf8",
);
const label = (m: { foreground: string; background: string }) =>
  `${m.foreground} on ${m.background}`;

describe("the colour maths", () => {
  it("converts OKLCH and hex to sRGB", () => {
    expect(toHex(toRgba("oklch(62.8% 0.2577 29.23)"))).toBe("#ff0000");
    expect(toHex(toRgba("oklch(1 0 0)"))).toBe("#ffffff");
    expect(toHex(toRgba("oklch(0% 0 none)"))).toBe("#000000");
    expect(toHex(toRgba("#abc"))).toBe("#aabbcc");
    // As lightningcss converts them: the brand blue (--accent-ring), --accent-fill and --neutral-400.
    expect(toHex(toRgba("oklch(56.8% 0.237 270)"))).toBe("#465fff");
    expect(toHex(toRgba("oklch(50.5% 0.26 270)"))).toBe("#3641f5");
    expect(toHex(toRgba("oklch(64% 0 0)"))).toBe("#8c8c8c");
  });

  it("mixes in oklch with alpha, as color-mix() does", () => {
    const tint = toRgba("color-mix(in oklch, oklch(20% 0 0) 8%, transparent)");
    expect(tint.alpha).toBeCloseTo(0.08, 6);
    expect(toHex(tint)).toBe(toHex(toRgba("oklch(20% 0 0)")));
    expect(toHex(toRgba("color-mix(in srgb, #000 50%, #fff)"))).toBe("#808080");
  });

  it("gives WCAG 2's ratios", () => {
    expect(contrast(toRgba("#000"), toRgba("#fff"))).toBeCloseTo(21, 6);
    expect(contrast(toRgba("#777"), toRgba("#777"))).toBeCloseTo(1, 6);
    // #767676 is the classic grey that just clears 4.5:1 on white.
    expect(contrast(toRgba("#767676"), toRgba("#fff"))).toBeCloseTo(4.54, 2);
    // A translucent ink is composited first: black at 128/255 on white is #7f7f7f.
    expect(contrast(toRgba("#00000080"), toRgba("#fff"))).toBeCloseTo(
      contrast(toRgba("#7f7f7f"), toRgba("#fff")),
      2,
    );
  });

  it("refuses a notation it cannot read", () => {
    expect(() => toRgba("lab(50% 20 30)")).toThrow(/not a colour/);
  });
});

describe("the tokens' contrast", () => {
  const measured = measure(CSS);

  it("reads every colour the utilities use", () => {
    const tokens = readTokens(CSS);
    const colours = [...tokens.values()].filter(
      (t) => t.block === "@theme inline" && t.name.startsWith("--color-"),
    );
    expect(colours.length).toBeGreaterThan(30);
    for (const token of colours) {
      expect(() => toRgba(colourOf(tokens, token.name))).not.toThrow();
    }
  });

  it.each(measured.map((m) => [label(m), m.kind, m] as const))(
    "%s clears its minimum (%s)",
    (_name, _kind, m) => {
      if (m.accepted) return;
      expect(m.ratio).toBeGreaterThanOrEqual(m.minimum);
    },
  );

  it("keeps each accepted exception honest", () => {
    for (const a of ACCEPTED) {
      const m = measured.find(
        (x) => x.foreground === a.foreground && x.background === a.background,
      );
      expect(m).toBeDefined();
      expect(Number(m?.ratio.toFixed(2))).toBe(a.ratio);
      expect(m?.ratio).toBeLessThan(m?.minimum ?? 0);
    }
  });

  it("gives every primitive a value of its own, which /dev/tokens draws as it is", () => {
    const primitives = [...readTokens(CSS).values()].filter(
      (t) => t.block === "@theme static",
    );
    expect(primitives.map((t) => t.name)).toEqual(
      expect.arrayContaining([
        "--accent-fill",
        "--accent-fill-hover",
        "--accent-ring",
        "--accent-on-fill",
      ]),
    );
    for (const t of primitives) {
      expect(() => toRgba(t.value)).not.toThrow();
    }
  });

  it("fails a mid-tone accent", () => {
    const wrong = CSS.replace(
      /--accent-fill:[^;]+;/,
      "--accent-fill: oklch(70% 0.15 270);",
    );
    expect(wrong).not.toBe(CSS);
    const failing = measure(wrong)
      .filter((m) => !m.passes)
      .map(label);
    expect(failing).toEqual(
      expect.arrayContaining([
        "--primary-foreground on --primary",
        "--primary on --surface",
      ]),
    );
  });

  // The schemes task B5 showed the founder (rext-control looks/app/B5): a swap edits the four accent
  // lines and nothing else, and every role pair still clears its minimum. The values are literal, as
  // every primitive's is: /dev/tokens draws each primitive from its own value.
  const SCHEMES = {
    "lime on obsidian": {
      "--accent-fill": "oklch(20.8% 0.015 172.4)",
      "--accent-fill-hover": "oklch(27.6% 0.026 157.8)",
      "--accent-ring": "oklch(59.3% 0.139 127.9)",
      "--accent-on-fill": "oklch(92.6% 0.144 125.8)",
    },
    "neutral near-black": {
      "--accent-fill": "oklch(20.5% 0 0)",
      "--accent-fill-hover": "oklch(26.9% 0 0)",
      "--accent-ring": "oklch(55.6% 0 0)",
      "--accent-on-fill": "oklch(100% 0 0)",
    },
  };

  it.each(Object.entries(SCHEMES))(
    "swaps to %s by the accent lines alone",
    (_name, lines) => {
      let swapped = CSS;
      for (const [name, value] of Object.entries(lines)) {
        const line = new RegExp(`${name}:[^;]+;`);
        expect(swapped).toMatch(line);
        swapped = swapped.replace(line, `${name}: ${value};`);
      }
      const failing = measure(swapped)
        .filter((m) => !m.passes && !m.accepted)
        .map(label);
      expect(failing).toEqual([]);
    },
  );

  it("covers each kind", () => {
    for (const kind of Object.keys(MINIMUM)) {
      expect(PAIRS.some((p) => p.kind === kind)).toBe(true);
    }
  });
});
