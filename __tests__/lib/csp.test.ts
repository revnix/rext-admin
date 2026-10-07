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
