/**
 * Sets the person's analytics choice as a cookie from the server.
 *
 * POST /api/consent { "choice": "granted" | "denied" } -> 204 and the `rext-consent` cookie
 *
 * The page writes the cookie itself at once and then asks here, because Safari keeps a cookie
 * written by a script for seven days only; one set by the app's own server lasts the six months
 * it asks for. Only a JSON request from the app itself is answered, so another site cannot change
 * a person's choice with a form. The cookie holds the choice and nothing about the person. On
 * rext.ai's hosts it is the one cookie the website and the app share, and the one this host kept
 * for itself before that is taken away with it.
 */

import {
  consentCookies,
  fromThisSite,
  isConsentChoice,
} from "@/lib/analytics-consent";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const sameSite = fromThisSite(request.headers.get("origin"), url.host);
  const json = (request.headers.get("content-type") ?? "").startsWith(
    "application/json",
  );
  const body = json && sameSite ? await request.json().catch(() => null) : null;
  const choice = (body as { choice?: unknown } | null)?.choice;
  if (!isConsentChoice(choice)) {
    return new Response(null, {
      status: 400,
      headers: { "Cache-Control": "no-store" },
    });
  }
  const headers = new Headers({ "Cache-Control": "no-store" });
  for (const cookie of consentCookies(
    choice,
    url.protocol === "https:",
    url.hostname,
  )) {
    headers.append("Set-Cookie", cookie);
  }
  return new Response(null, { status: 204, headers });
}
