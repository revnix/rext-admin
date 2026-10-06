import { readFileSync } from "node:fs";

/**
 * The pages pr-checks opens. They render without a backend: the signed-out pages, and every primitive
 * in each variant and the five layouts on /dev/primitives (task C6).
 */
export const CI_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/account-recovery",
  "/dev/primitives",
];

/**
 * The pages to check: those of A11Y_ROUTES_FILE when it's given (rext-control's
 * tools/app-shots/routes.txt: one path a line, `#` comments, `{ws}` for the workspace's slug, read from
 * A11Y_WORKSPACE), else CI_ROUTES.
 */
export function routesToCheck(): string[] {
  const file = process.env.A11Y_ROUTES_FILE;
  if (!file) return CI_ROUTES;
  const workspace = process.env.A11Y_WORKSPACE ?? "rext-ai";
  return readFileSync(file, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.replaceAll("{ws}", workspace));
}
