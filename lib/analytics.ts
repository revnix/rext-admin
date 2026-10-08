// ── Event catalog ─────────────────────────────────────────────────────────────
// Every event the app sends, by hand (rext-control task 712). The rule for a name: what happened
// to what, in the past tense and lower case, the thing first (`title_selected`,
// `checkout_failed`). A name here is sent somewhere: one that isn't is removed.
//
// The workspace, the plan and the role ride on every event (AnalyticsContextSync,
// providers/posthog-provider.tsx), so a caller adds only what is its own.

type AnalyticsEvent =
  // Signing in and up
  | "user_signed_in"
  | "user_signed_up"
  | "oauth_started"
  | "email_verified"
  // The sign-up and sign-in forms, which are never recorded (lib/analytics-forms.ts)
  | "signup_started"
  | "signup_field_filled"
  | "signup_submitted"
  | "signup_refused"
  | "signin_submitted"
  | "signin_refused"
  | "signin_error_shown"
  // Onboarding
  | "first_login_questions_shown"
  | "first_login_questions_completed"
  | "workspace_created"
  | "onboarding_milestone_completed"
  | "onboarding_completed"
  // Generating an article
  | "generate_step_viewed"
  | "content_generation_started"
  | "keyword_search_completed"
  | "keyword_selected"
  | "content_type_selected"
  | "title_suggestions_generated"
  | "titles_regenerated"
  | "title_selected"
  | "outline_generated"
  | "outline_regenerated"
  | "outline_approved"
  | "content_generation_completed"
  | "content_generation_failed"
  | "content_generation_cancelled"
  // Publishing
  | "content_published"
  | "content_scheduled"
  | "cms_connection_completed"
  | "cms_connection_failed"
  | "cms_publish_attempted"
  | "cms_publish_succeeded"
  | "cms_publish_failed"
  // The article, after it is written
  | "editor_opened"
  | "article_saved"
  | "article_version_restored"
  // Plans
  | "paywall_shown"
  | "checkout_started"
  | "checkout_failed"
  | "subscription_purchased";

type EventProperties = Record<string, string | number | boolean | undefined>;

// ── PostHog bridge ────────────────────────────────────────────────────────────
// The PostHogProvider calls registerPostHog() on mount to wire in posthog-js.
// This avoids importing posthog-js directly here, which keeps analytics.ts
// server-safe (no browser-only globals at module load time).

interface PostHogBridge {
  capture: (event: string, properties?: Record<string, unknown>) => void;
  reset: () => void;
}

let _posthog: PostHogBridge | null = null;

// Events tracked before the person's answer on analytics is known (lib/analytics-consent.ts): held
// in memory, nothing sent, until the provider wires posthog-js in. Someone who says no, or never
// answers, sends none of them; after a no nothing is held either, so a later yes can't send what
// was done while the answer was no.
const pending: Array<{ event: string; properties: Record<string, unknown> }> =
  [];
const PENDING_LIMIT = 100;
let refused = false;

/** Called by the provider once the person allows analytics: the held events go out, in order. */
export function registerPostHog(bridge: PostHogBridge): void {
  _posthog = bridge;
  refused = false;
  for (const held of pending.splice(0)) {
    bridge.capture(held.event, held.properties);
  }
}

/**
 * Called when the provider goes away (a remount in development, a test's end): back to not
 * knowing the person's answer, as on a fresh page.
 */
export function forgetPostHog(): void {
  _posthog = null;
  refused = false;
  pending.length = 0;
}

/** Called by the provider when the person says no: nothing more is sent, held or kept. */
export function unregisterPostHog(): void {
  _posthog = null;
  refused = true;
  pending.length = 0;
}

// ── Impersonation ────────────────────────────────────────────────────────────
// While an admin acts as a customer, nothing goes to analytics: what they open and do in that
// customer's workspaces is neither the admin's own use of the app nor the customer's. The mark is
// in localStorage, shared by the app's tabs, so a tab opened meanwhile is covered from its first
// event; signing out clears it with the rest of the storage.

const IMPERSONATING_KEY = "rext-impersonating";
// This page's own copy: what counts when the browser refuses storage (blocked or full), where
// the banner's check on every page is then the only source.
let impersonatingHere = false;

/** Sent to this page when impersonation starts or stops: a recording stops with it. */
export const IMPERSONATION_EVENT = "rext:impersonation";

/** Called when impersonation starts or stops, and whenever the backend says which it is. */
export function setImpersonating(impersonating: boolean): void {
  const changed = impersonatingHere !== impersonating;
  impersonatingHere = impersonating;
  try {
    if (impersonating) window.localStorage.setItem(IMPERSONATING_KEY, "1");
    else window.localStorage.removeItem(IMPERSONATING_KEY);
  } catch {
    // Storage refused: this page still knows, from the line above.
  }
  if (changed) window.dispatchEvent(new Event(IMPERSONATION_EVENT));
}

export function isImpersonating(): boolean {
  if (impersonatingHere) return true;
  try {
    return window.localStorage.getItem(IMPERSONATING_KEY) === "1";
  } catch {
    return false;
  }
}

// ── Analytics singleton ───────────────────────────────────────────────────────

class Analytics {
  private enabled: boolean;

  constructor() {
    this.enabled =
      process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "false" &&
      typeof window !== "undefined";
    this.clearStoredEvents();
  }

  /**
   * Track an analytics event, with the caller's properties only. PostHog adds the time, the person
   * and the page's address itself, and that address goes out with its credentials redacted
   * (lib/analytics-redact.ts); a second, raw copy of it must never ride along.
   */
  track(event: AnalyticsEvent, properties?: EventProperties) {
    if (!this.enabled || isImpersonating()) return;
    if (_posthog) {
      _posthog.capture(event, { ...properties });
    } else if (!refused && pending.length < PENDING_LIMIT) {
      pending.push({ event, properties: { ...properties } });
    }
  }

  /** Reset analytics state (e.g. on logout). */
  reset() {
    _posthog?.reset();
  }

  /**
   * Removes the copy of recent events an earlier version kept in the browser. It held each event's
   * raw address, so it is deleted when the app loads and again at sign-out.
   */
  clearStoredEvents() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem("wrext_analytics_events");
    } catch {
      // Storage can be unavailable (private mode, blocked site data): nothing is stored then.
    }
  }
}

export const analytics = new Analytics();
export type { AnalyticsEvent, EventProperties };

// ── Linking a provider ───────────────────────────────────────────────────────
// Linking Google or GitHub from the settings goes through the same OAuth sign-in as logging in, so
// the link button marks it, with its provider, and the login record (OAuthLoginRecord,
// providers/posthog-provider.tsx) records no sign-in for it. The mark is in localStorage, shared by the
// app's tabs: another open tab may refresh its session and record the login before the linking tab
// does (C13c), and whichever tab records it first takes the mark. A login or sign-up started from the
// OAuth buttons clears it, so a link that was abandoned can't hide a real sign-in after it.

/** One mark per provider, so two tabs linking Google and GitHub at once don't overwrite each other. */
const OAUTH_LINKING_PREFIX = "rext-oauth-linking:";
/** A mark older than this is from a link that was abandoned, not the login now being recorded. */
const OAUTH_LINKING_MAX_AGE_MS = 10 * 60 * 1000;

/** Called by the link button just before it starts the provider's sign-in. */
export function markOAuthLinking(provider: string): void {
  try {
    window.localStorage.setItem(
      OAUTH_LINKING_PREFIX + provider,
      String(Date.now()),
    );
  } catch {
    // Storage refused: the link is recorded as a sign-in, as before.
  }
}

/** Called by the login and sign-up OAuth buttons: what they start is never a link, for any provider. */
export function clearOAuthLinking(): void {
  try {
    const keys = Object.keys(window.localStorage).filter((key) =>
      key.startsWith(OAUTH_LINKING_PREFIX),
    );
    for (const key of keys) window.localStorage.removeItem(key);
  } catch {
    // Storage refused: there is no mark to clear.
  }
}

/**
 * Whether the login being recorded, through `provider`, is a link: that provider's mark, under ten
 * minutes old. Clears that mark either way, and leaves another provider's alone.
 */
export function takeOAuthLinking(provider: string): boolean {
  try {
    const key = OAUTH_LINKING_PREFIX + provider;
    const at = Number(window.localStorage.getItem(key));
    window.localStorage.removeItem(key);
    return at > 0 && Date.now() - at < OAUTH_LINKING_MAX_AGE_MS;
  } catch {
    return false;
  }
}
