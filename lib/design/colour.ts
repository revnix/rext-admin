// Colour maths for the token checks (/dev/tokens and the contrast test): a CSS colour as sRGB, and the
// WCAG 2 contrast ratio between two. It reads what app/globals.css writes: oklch(), hex, transparent and
// color-mix() in oklch or srgb. OKLab's matrices are Björn Ottosson's (https://bottosson.github.io/posts/oklab/).

/** Gamma-encoded sRGB, each channel 0 to 1, as a browser composites it. */
export interface Rgba {
  r: number;
  g: number;
  b: number;
  alpha: number;
}

/** A hue of null is missing (`none`, or an achromatic colour's): a mix takes the other colour's. */
interface Oklch {
  l: number;
  c: number;
  h: number | null;
  alpha: number;
}

type Colour = ({ space: "oklch" } & Oklch) | ({ space: "srgb" } & Rgba);

const clip = (c: number) => Math.min(1, Math.max(0, c));
const toLinear = (c: number) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const toGamma = (c: number) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;

/** OKLCH to sRGB, clipped to the sRGB gamut channel by channel. */
function oklchToRgba({ l, c, h, alpha }: Oklch): Rgba {
  const angle = ((h ?? 0) * Math.PI) / 180;
  const a = c * Math.cos(angle);
  const b = c * Math.sin(angle);
  const l3 = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m3 = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s3 = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const gamma = (linear: number) => clip(toGamma(clip(linear)));
  return {
    r: gamma(4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3),
    g: gamma(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3),
    b: gamma(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3),
    alpha,
  };
}

function rgbaToOklch({ r, g, b, alpha }: Rgba): Oklch {
  const [lr, lg, lb] = [r, g, b].map(toLinear);
  const l = Math.cbrt(
    0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb,
  );
  const m = Math.cbrt(
    0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb,
  );
  const s = Math.cbrt(
    0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb,
  );
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const c = Math.hypot(a, bb);
  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    c,
    h: c < 1e-4 ? null : ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360,
    alpha,
  };
}

const asRgba = (colour: Colour): Rgba =>
  colour.space === "srgb" ? colour : oklchToRgba(colour);
const asOklch = (colour: Colour): Oklch =>
  colour.space === "oklch" ? colour : rgbaToOklch(colour);

/** The arguments of a function call, split at its own commas. */
function splitArgs(inner: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let from = 0;
  for (let i = 0; i < inner.length; i++) {
    if (inner[i] === "(") depth++;
    else if (inner[i] === ")") depth--;
    else if (inner[i] === "," && depth === 0) {
      out.push(inner.slice(from, i).trim());
      from = i + 1;
    }
  }
  out.push(inner.slice(from).trim());
  return out;
}

const number = (text: string, percentOf = 1) =>
  text.endsWith("%")
    ? (Number(text.slice(0, -1)) / 100) * percentOf
    : Number(text);

/** `oklch(L C H)` or `oklch(L C H / alpha)`, L and alpha as a number or a percentage. */
function parseOklch(inner: string): Colour {
  const [channels, alphaText] = inner.split("/").map((part) => part.trim());
  const [l, c, h] = channels.split(/\s+/);
  return {
    space: "oklch",
    l: l === "none" ? 0 : number(l),
    c: c === "none" ? 0 : number(c, 0.4),
    h: h === "none" ? null : Number(h),
    alpha: alphaText ? clip(number(alphaText)) : 1,
  };
}

function parseHex(hex: string): Colour {
  const digits = hex.length <= 4 ? [...hex].map((d) => d + d).join("") : hex;
  const channel = (i: number) =>
    Number.parseInt(digits.slice(i, i + 2), 16) / 255;
  return {
    space: "srgb",
    r: channel(0),
    g: channel(2),
    b: channel(4),
    alpha: digits.length === 8 ? channel(6) : 1,
  };
}

/**
 * `color-mix(in oklch, A p%, B q%)` as CSS Color 5 defines it: the percentages normalised, the colours
 * premultiplied by their alpha, the hue on the shorter arc, a missing hue taken from the other colour.
 */
function parseMix(inner: string): Colour {
  const [method, first, second] = splitArgs(inner);
  const space = method.replace(/^in\s+/, "").trim();
  if (space !== "oklch" && space !== "srgb") {
    throw new Error(`color-mix in ${space} is not supported`);
  }
  const part = (text: string) => {
    const m = text.match(/^([\s\S]*?)(?:\s+([\d.]+%))?$/);
    return {
      colour: parse(m?.[1] ?? text),
      share: m?.[2] ? number(m[2]) : null,
    };
  };
  const a = part(first);
  const b = part(second);
  let p = a.share ?? (b.share === null ? 0.5 : 1 - b.share);
  let q = b.share ?? 1 - p;
  const sum = p + q;
  const scale = sum < 1 ? sum : 1;
  p /= sum;
  q /= sum;
  if (space === "srgb") {
    const x = asRgba(a.colour);
    const y = asRgba(b.colour);
    const alpha = x.alpha * p + y.alpha * q;
    const channel = (k: "r" | "g" | "b") =>
      alpha === 0 ? 0 : (x[k] * x.alpha * p + y[k] * y.alpha * q) / alpha;
    return {
      space: "srgb",
      r: channel("r"),
      g: channel("g"),
      b: channel("b"),
      alpha: alpha * scale,
    };
  }
  const x = asOklch(a.colour);
  const y = asOklch(b.colour);
  const alpha = x.alpha * p + y.alpha * q;
  const channel = (k: "l" | "c") =>
    alpha === 0 ? 0 : (x[k] * x.alpha * p + y[k] * y.alpha * q) / alpha;
  let h: number | null = x.h ?? y.h;
  if (x.h !== null && y.h !== null) {
    let delta = y.h - x.h;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    h = (x.h + delta * q + 360) % 360;
  }
  return {
    space: "oklch",
    l: channel("l"),
    c: channel("c"),
    h,
    alpha: alpha * scale,
  };
}

/** A colour, written as CSS, with no var() left in it. */
function parse(text: string): Colour {
  const value = text.trim().toLowerCase();
  if (value === "transparent")
    return { space: "srgb", r: 0, g: 0, b: 0, alpha: 0 };
  if (value === "white") return { space: "srgb", r: 1, g: 1, b: 1, alpha: 1 };
  if (value === "black") return { space: "srgb", r: 0, g: 0, b: 0, alpha: 1 };
  const hex = value.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/);
  if (hex) return parseHex(hex[1]);
  const call = value.match(/^([a-z-]+)\(([\s\S]*)\)$/);
  if (call?.[1] === "oklch") return parseOklch(call[2]);
  if (call?.[1] === "color-mix") return parseMix(call[2]);
  throw new Error(`not a colour this check reads: ${text}`);
}

/** A CSS colour as sRGB. Throws on what it does not read, so a new notation in globals.css is noticed. */
export function toRgba(text: string): Rgba {
  return asRgba(parse(text));
}

/** `colour` laid over an opaque `backdrop`, as the browser composites it (in gamma-encoded sRGB). */
export function over(colour: Rgba, backdrop: Rgba): Rgba {
  const mix = (k: "r" | "g" | "b") =>
    colour[k] * colour.alpha + backdrop[k] * (1 - colour.alpha);
  return { r: mix("r"), g: mix("g"), b: mix("b"), alpha: 1 };
}

/** WCAG 2's relative luminance. */
export function luminance({ r, g, b }: Rgba): number {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** WCAG 2's contrast ratio of a foreground on an opaque background, a translucent foreground composited first. */
export function contrast(foreground: Rgba, background: Rgba): number {
  const ink = luminance(over(foreground, background));
  const ground = luminance(background);
  return (Math.max(ink, ground) + 0.05) / (Math.min(ink, ground) + 0.05);
}

/** The colour as `#rrggbb` (its alpha dropped). */
export function toHex({ r, g, b }: Rgba): string {
  return `#${[r, g, b]
    .map((c) =>
      Math.round(clip(c) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}
