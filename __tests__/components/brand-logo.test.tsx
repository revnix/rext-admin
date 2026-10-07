import fs from "node:fs";
import path from "node:path";
import { render, screen } from "@testing-library/react";

import { Logo, LogoMark } from "@/components/brand-logo";

const fills = (svg: Element | null) =>
  [...(svg?.querySelectorAll("path") ?? [])].map((p) =>
    p.getAttribute("class"),
  );

describe("the logo (the marketing site's drawing)", () => {
  it("draws the nib and the name, hidden from screen readers, which hear the name", () => {
    const { container } = render(<Logo className="h-9" />);

    expect(screen.getByText("Rext AI")).toHaveClass("sr-only");
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("viewBox", "0 0 154 27");
    expect(svg).toHaveClass("h-9");
    // The nib's lower piece and the name in ink; the upper piece in the accent's lime.
    expect(fills(svg)).toEqual([
      "fill-foreground",
      "fill-(--accent-on-fill)",
      "fill-foreground",
    ]);
  });

  it("draws the nib alone for the mark", () => {
    const { container } = render(<LogoMark className="size-4" />);

    expect(screen.getByText("Rext AI")).toHaveClass("sr-only");
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("viewBox", "0 0 27.3 27");
    expect(svg).toHaveClass("size-4");
    expect(fills(svg)).toEqual(["fill-foreground", "fill-(--accent-on-fill)"]);
  });
});

describe("the icons app/ serves and the emails' logo", () => {
  // Next reads proxy.ts's matcher as a literal at build time, so the test reads it from the file.
  const source = fs.readFileSync(path.join(process.cwd(), "proxy.ts"), "utf8");
  const literal = source.match(/matcher: \[[^"]*"((?:[^"\\]|\\.)+)"/)?.[1];
  const matched = new RegExp(`^${JSON.parse(`"${literal}"`)}$`);

  it("pass the sign-in check, so the login page has its tab icon", () => {
    for (const icon of [
      "/favicon.ico",
      "/icon",
      "/icon.png",
      "/icon0.svg",
      "/icon3.png",
      "/apple-icon",
      "/apple-icon.png",
      "/manifest.webmanifest",
      "/brand/rext-logo.png",
    ]) {
      expect({ icon, matched: matched.test(icon) }).toEqual({
        icon,
        matched: false,
      });
    }
  });

  it("leave every page under the sign-in check", () => {
    for (const page of [
      "/",
      "/login",
      "/w/acme/content",
      "/icons-guide",
      "/iconic",
      "/branding",
    ]) {
      expect({ page, matched: matched.test(page) }).toEqual({
        page,
        matched: true,
      });
    }
  });
});
