import type { Page } from "@playwright/test";

/**
 * What goes wrong on a page, sorted by whose it is.
 *
 * `errors` fail the smoke test: an uncaught exception, an error our own code logged, a request to one
 * of our own hosts that got no answer or a server error, and a policy refusal of something of our own.
 * `warnings` don't: a console line about another company's host being refused or slow (an analytics
 * script the content policy blocks, a widget that didn't load). Those are worth a line in the run, not
 * a red deploy: on 2026-10-08 a deploy went red for exactly one.
 */
export type Seen = { errors: string[]; warnings: string[] };

const ADDRESS = /https?:\/\/[^\s'"<>)]+/g;

/** The hosts that are ours: the dashboard's own, and any other on its site ("api." beside "app."). */
export function isOurs(host: string, base: string): boolean {
  const own = new URL(base).hostname;
  if (host === own) return true;
  const site = own.split(".").slice(-2).join(".");
  return own.includes(".") && host.endsWith(`.${site}`);
}

/**
 * A message with its addresses cut to host and path, and anything that reads like a key or an id cut
 * out of the path: an address in a log line can carry a project key or a signed query.
 */
export function tidy(text: string): string {
  return text
    .replace(ADDRESS, (address) => {
      try {
        const url = new URL(address);
        const path = url.pathname.replace(/[A-Za-z0-9_-]{20,}/g, "…");
        return `${url.origin}${path === "/" ? "" : path}`;
      } catch {
        return "(an address)";
      }
    })
    .slice(0, 300);
}

/** Whose a console error is: "ours" (it fails the test), "theirs" (a warning), or "noise". */
export function whose(text: string, base: string): "ours" | "theirs" | "noise" {
  // The browser's own line for a failed request: the requests themselves are judged below.
  if (text.startsWith("Failed to load resource")) return "noise";
  const hosts = (text.match(ADDRESS) ?? []).flatMap((address) => {
    try {
      return [new URL(address).hostname];
    } catch {
      return [];
    }
  });
  // A line that names only other companies' hosts is about them. A policy refusal also quotes the
  // policy, with every host it allows, so only the first address (what was refused) counts there.
  const named = text.includes("Content Security Policy")
    ? hosts.slice(0, 1)
    : hosts;
  if (named.length > 0 && named.every((host) => !isOurs(host, base))) {
    return "theirs";
  }
  return "ours";
}

export function watchForErrors(page: Page, base: string): Seen {
  const seen: Seen = { errors: [], warnings: [] };
  page.on("pageerror", (error) =>
    seen.errors.push(`uncaught: ${tidy(error.message)}`),
  );
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    const owner = whose(text, base);
    if (owner === "ours") seen.errors.push(`console: ${tidy(text)}`);
    if (owner === "theirs") seen.warnings.push(`console: ${tidy(text)}`);
  });
  // A request to one of our own hosts that failed. A refusal (401 on a signed-out page, 404) is an
  // answer; a server error or no answer at all is not. A request the page itself gave up (it
  // navigated away) is neither.
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (response.status() >= 500 && isOurs(url.hostname, base)) {
      seen.errors.push(`${response.status()} from ${tidy(response.url())}`);
    }
  });
  page.on("requestfailed", (request) => {
    const reason = request.failure()?.errorText ?? "";
    const url = new URL(request.url());
    if (reason.includes("ERR_ABORTED") || !isOurs(url.hostname, base)) return;
    seen.errors.push(`no answer from ${tidy(request.url())} (${reason})`);
  });
  return seen;
}

/** Prints what was only worth a warning, as a line GitHub shows on the run. */
export function reportWarnings(seen: Seen, where: string) {
  for (const warning of [...new Set(seen.warnings)]) {
    process.stdout.write(`::warning::${where}: ${warning}\n`);
  }
}
