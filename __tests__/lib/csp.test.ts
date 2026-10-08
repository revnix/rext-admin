import { getCSPHeader } from "@/lib/csp";

const directive = (name: string) =>
  getCSPHeader("")
    .split("; ")
    .find((d) => d.startsWith(`${name} `)) ?? "";

describe("getCSPHeader", () => {
  it("lets the browser reach the password breach check", () => {
    expect(directive("connect-src").split(" ")).toContain(
      "https://api.pwnedpasswords.com",
    );
  });

  it("keeps everything else it connects to", () => {
    const connect = directive("connect-src").split(" ");
    expect(connect).toEqual(
      expect.arrayContaining(["'self'", "https://app.lemonsqueezy.com"]),
    );
    expect(directive("frame-ancestors")).toBe("frame-ancestors 'none'");
  });

  it("lets analytics send and read its settings, and loads no code from PostHog", () => {
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
    try {
      expect(directive("connect-src").split(" ")).toEqual(
        expect.arrayContaining([
          "https://eu.i.posthog.com",
          "https://eu-assets.i.posthog.com",
        ]),
      );
      expect(directive("script-src")).not.toContain("posthog");
    } finally {
      if (host !== undefined) process.env.NEXT_PUBLIC_POSTHOG_HOST = host;
    }
  });

  it("lets PostHog's toolbar in only when asked to, and never otherwise", () => {
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
    const withToolbar = (name: string) =>
      (
        getCSPHeader("", { posthogToolbar: true })
          .split("; ")
          .find((d) => d.startsWith(`${name} `)) ?? ""
      ).split(" ");
    try {
      for (const name of [
        "script-src",
        "style-src",
        "font-src",
        "connect-src",
      ]) {
        expect(withToolbar(name)).toEqual(
          expect.arrayContaining([
            "https://eu-assets.i.posthog.com",
            "https://eu.posthog.com",
          ]),
        );
      }
      // Still nobody's frame, and nothing else gained.
      expect(withToolbar("frame-ancestors")).toEqual([
        "frame-ancestors",
        "'none'",
      ]);
      expect(withToolbar("frame-src").join(" ")).not.toContain("posthog");

      // Everyone else: no code from PostHog, and no calls to its app.
      expect(directive("script-src")).not.toContain("posthog");
      expect(directive("style-src")).not.toContain("posthog");
      expect(directive("connect-src").split(" ")).not.toContain(
        "https://eu.posthog.com",
      );
      expect(getCSPHeader("", { posthogToolbar: false })).toBe(
        getCSPHeader(""),
      );
    } finally {
      if (host !== undefined) process.env.NEXT_PUBLIC_POSTHOG_HOST = host;
    }
  });

  it("has no toolbar to let in where analytics goes through a host of our own", () => {
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://stats.example.com";
    try {
      expect(getCSPHeader("", { posthogToolbar: true })).toBe(getCSPHeader(""));
    } finally {
      if (host === undefined) delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
      else process.env.NEXT_PUBLIC_POSTHOG_HOST = host;
    }
  });

  it("names a host of our own once, when analytics goes through one", () => {
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://stats.example.com";
    try {
      const connect = directive("connect-src").split(" ");
      expect(
        connect.filter((source) => source === "https://stats.example.com"),
      ).toHaveLength(1);
      expect(directive("connect-src")).not.toContain("assets");
    } finally {
      if (host === undefined) delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
      else process.env.NEXT_PUBLIC_POSTHOG_HOST = host;
    }
  });

  it("lets the support chat load, from Crisp's published list (#711)", () => {
    const crisp = "https://*.crisp.chat";
    for (const name of [
      "script-src",
      "style-src",
      "font-src",
      "media-src",
      "frame-src",
    ]) {
      expect(directive(name).split(" ")).toContain(crisp);
    }
    expect(directive("connect-src").split(" ")).toEqual(
      expect.arrayContaining([
        crisp,
        "wss://*.relay.crisp.chat",
        "wss://*.relay.rescue.crisp.chat",
      ]),
    );
    expect(directive("worker-src").split(" ")).toEqual(
      expect.arrayContaining(["'self'", "blob:", crisp]),
    );
  });
});
