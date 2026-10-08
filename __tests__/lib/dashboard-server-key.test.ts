/**
 * The key this server sends with its Google and GitHub sign-in call (revnix/rext-control#892):
 * sent when the setting holds one, left out when it doesn't, and never a setting the browser's
 * code could carry.
 */
import fs from "node:fs";
import path from "node:path";
import {
  DASHBOARD_SERVER_HEADER,
  dashboardServerKeyHeader,
} from "@/lib/auth/dashboard-server-key";

const before = process.env.DASHBOARD_SERVER_KEY;
afterEach(() => {
  if (before === undefined) delete process.env.DASHBOARD_SERVER_KEY;
  else process.env.DASHBOARD_SERVER_KEY = before;
});

it("sends the key in its header when the setting holds one", () => {
  process.env.DASHBOARD_SERVER_KEY =
    "  a-key-of-enough-length-0123456789abcdef  ";

  expect(dashboardServerKeyHeader()).toEqual({
    "X-Rext-Dashboard-Key": "a-key-of-enough-length-0123456789abcdef",
  });
  expect(DASHBOARD_SERVER_HEADER).toBe("X-Rext-Dashboard-Key");
});

it("sends no header when the setting is unset or blank", () => {
  delete process.env.DASHBOARD_SERVER_KEY;
  expect(dashboardServerKeyHeader()).toEqual({});

  process.env.DASHBOARD_SERVER_KEY = "   ";
  expect(dashboardServerKeyHeader()).toEqual({});
});

it("goes with the sign-in call to the backend, and with no other call", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), "auth.config.ts"),
    "utf8",
  );
  const uses = source.split("dashboardServerKeyHeader()").length - 1;
  const call = source.slice(
    source.indexOf("/api/v1/user/oauth/login"),
    source.indexOf("/api/v1/user/oauth/login") + 400,
  );

  expect(uses).toBe(1);
  expect(call).toContain("...dashboardServerKeyHeader()");
});

it("is a server-side setting: nothing reads it under a name the browser's code would carry", () => {
  const env = fs.readFileSync(path.join(process.cwd(), "env.ts"), "utf8");

  expect(env).toContain("DASHBOARD_SERVER_KEY: z");
  expect(env).not.toContain("NEXT_PUBLIC_DASHBOARD_SERVER_KEY");
});
