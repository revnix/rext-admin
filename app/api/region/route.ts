/**
 * Whether this person is asked before the app measures how they use it.
 *
 * GET /api/region -> { "region": "eea" | "other" }, and the `rext-region` cookie
 *
 * Vercel sends the visitor's country in `x-vercel-ip-country`. The analytics provider asks here
 * once, when the browser has neither a choice nor a region yet. A missing country (a local run)
 * counts as the EEA, so the person is asked. The answer is never cached: one country's answer must
 * not be served to another.
 */

import { REGION_COOKIE, regionForCountry } from "@/lib/analytics-consent";

export const dynamic = "force-dynamic";

/** A day: a person who travels is asked about the new place soon enough. */
const REGION_MAX_AGE = 60 * 60 * 24;

export function GET(request: Request) {
  const region = regionForCountry(request.headers.get("x-vercel-ip-country"));
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return Response.json(
    { region },
    {
      headers: {
        "Cache-Control": "private, no-store",
        // Read by the page, so not HttpOnly.
        "Set-Cookie": `${REGION_COOKIE}=${region}; Max-Age=${REGION_MAX_AGE}; Path=/; SameSite=Lax${secure}`,
      },
    },
  );
}
