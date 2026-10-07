/**
 * What analytics may know of an address. Links in our emails carry credentials in their query
 * (an unsubscribe, verification, reset or invitation token) and sign-in pages carry an email, so
 * those values are replaced before an event leaves the browser: PostHog adds the current address
 * to every event it sends, not only to page views (rext-control#541, Codex on revnix/rext-admin#601).
 */

/** Query parameters whose values never go to analytics. */
const SECRET_PARAMS = new Set([
  "token",
  "code",
  "state",
  "email",
  "access_token",
  "refresh_token",
  "id_token",
]);

/**
 * The event properties PostHog fills with an address. The session-entry ones ride on every event
 * of a session that began on an emailed link (posthog.com/docs/data/sessions, session entry
 * properties); the rest of PostHog's session and initial properties hold a path, a host or a
 * campaign tag, never a query.
 */
const URL_PROPERTIES = [
  "$current_url",
  "$referrer",
  "$initial_current_url",
  "$initial_referrer",
  "$session_entry_url",
  "$session_entry_referrer",
];

/** The address with every secret parameter's value replaced by "redacted". */
export function redactUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  let changed = false;
  for (const key of [...parsed.searchParams.keys()]) {
    if (SECRET_PARAMS.has(key.toLowerCase())) {
      parsed.searchParams.set(key, "redacted");
      changed = true;
    }
  }
  return changed ? parsed.toString() : url;
}

type PropertyBag = Record<string, unknown> | undefined;

/** PostHog's before_send: redacts the addresses in an event's properties, $set and $set_once. */
export function redactEventUrls<
  T extends {
    properties?: PropertyBag;
    $set?: PropertyBag;
    $set_once?: PropertyBag;
  },
>(event: T | null): T | null {
  if (!event) return event;
  for (const bag of [event.properties, event.$set, event.$set_once]) {
    if (!bag) continue;
    for (const key of URL_PROPERTIES) {
      const value = bag[key];
      if (typeof value === "string") bag[key] = redactUrl(value);
    }
  }
  return event;
}
