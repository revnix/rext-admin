import type { MetadataRoute } from "next";

/**
 * The installable app's manifest (task B9d). The icons are the marketing site's set, in app/ by
 * Next's file conventions (icon*.png, apple-icon.png, favicon.ico). A manifest can't read a CSS
 * variable, so its two colours are written out: the page's white and the obsidian accent.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rext AI",
    short_name: "Rext AI",
    start_url: "/",
    display: "standalone",
    // tokens-ok: a manifest can't read a CSS variable; the page's white
    background_color: "#ffffff",
    // tokens-ok: a manifest can't read a CSS variable; the obsidian accent (DECISIONS 98b948d)
    theme_color: "#111a17",
    icons: [
      { src: "/icon3.png", sizes: "192x192", type: "image/png" },
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
