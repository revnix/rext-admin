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
});
