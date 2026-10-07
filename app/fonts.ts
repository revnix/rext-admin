import localFont from "next/font/local";

// The dashboard's three faces, self-hosted as Latin subsets from app/fonts; their licences
// are in public/fonts/licenses. The variables go on <html>, where the theme's --font-display,
// --font-sans and --font-mono in globals.css read them (design/app-language.md §4).

// Manrope for page titles and big numbers, 18 px and up: the site's subset file.
export const manrope = localFont({
  src: "./fonts/manrope-400-800-normal.woff2",
  weight: "200 800",
  variable: "--font-manrope",
  display: "swap",
});

// Inter 4.1 for every UI string: the upstream variable file (wght and opsz) subset to Latin,
// keeping its OpenType features (tabular figures, the slashed zero, the stylistic sets),
// which the Google-hosted build strips.
export const inter = localFont({
  src: [
    { path: "./fonts/inter-variable-latin.woff2", style: "normal" },
    { path: "./fonts/inter-variable-italic-latin.woff2", style: "italic" },
  ],
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
});

// IBM Plex Mono for data, timers and code: the site's subset files.
export const plexMono = localFont({
  src: [
    {
      path: "./fonts/ibm-plex-mono-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/ibm-plex-mono-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-plex-mono",
  display: "swap",
  // A metric-matched Arial would be the wrong fallback for a monospace face; the theme
  // falls back to the system's monospace instead.
  adjustFontFallback: false,
});

/** The three faces' variables, for <html>. */
export const fontVariables = `${manrope.variable} ${inter.variable} ${plexMono.variable}`;
