/**
 * The pages that open without a session are listed twice: in `proxy.ts`, which lets a visitor
 * in, and in lib/auth-routes.ts, which lets a request leave such a page without a token
 * (revnix/rext-control#858). A page added to the first and not the second would open and then
 * refuse to load its own data.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import {
  AUTH_PAGE_PATHS,
  opensWithoutSession,
  PAGES_WITHOUT_SESSION,
} from "@/lib/auth-routes";

const proxySource = readFileSync(path.join(process.cwd(), "proxy.ts"), "utf8");

/** The paths written out in the proxy's `publicRoutes` list. */
function proxyPublicPaths(): string[] {
  const list = proxySource.match(/const publicRoutes = \[([\s\S]*?)\n {2}\];/);
  if (!list) throw new Error("proxy.ts no longer has a publicRoutes list");
  const withoutComments = list[1].replace(/\/\/.*$/gm, "");
  return [...withoutComments.matchAll(/"(\/[^"]*)"/g)].map((match) => match[1]);
}

describe("the pages that open without a session", () => {
  it("are the proxy's public routes", () => {
    expect(proxySource).toContain("...AUTH_PAGE_PATHS,");
    const fromProxy = [...AUTH_PAGE_PATHS, ...proxyPublicPaths()];
    expect(fromProxy.length).toBeGreaterThan(AUTH_PAGE_PATHS.length);
    expect([...PAGES_WITHOUT_SESSION].sort()).toEqual([...fromProxy].sort());
  });

  it.each([
    "/login",
    "/signup",
    "/verify-email",
    "/invitations/accept",
    "/account-recovery",
    "/unsubscribe",
    "/legal/privacy",
    "/legal/terms",
    "/legal/refund-policy",
    "/legal/subscription-terms",
  ])("counts %s", (pathname) => {
    expect(opensWithoutSession(pathname)).toBe(true);
  });

  it.each(["/", "/w/create", "/w/acme/generate", "/settings", "/admin/users"])(
    "does not count %s",
    (pathname) => {
      expect(opensWithoutSession(pathname)).toBe(false);
    },
  );
});
