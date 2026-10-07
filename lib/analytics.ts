// ── Event catalog ─────────────────────────────────────────────────────────────

type AnalyticsEvent =
  // Auth events
  | "user_signed_in"
  | "user_signed_up"
  | "oauth_started"
  | "email_verified"
  // Onboarding events
  | "onboarding_empty_dashboard_view"
  | "onboarding_empty_sidebar_view"
  | "onboarding_empty_switcher_view"
  | "onboarding_cta_click"
  | "onboarding_workspace_created"
  | "workspace_created"
  | "onboarding_first_content_created"
  | "onboarding_completed"
  | "onboarding_milestone_completed"
  | "onboarding_milestone_skipped"
  | "onboarding_dismissed"
  | "onboarding_reset"
  // Empty state events
  | "dashboard_empty_state_view"
  | "workspace_empty_state_view"
  | "workspace_empty_state_action_click"
  // Content generation events
  | "keyword_search_completed"
  | "keyword_selected"
  | "title_suggestions_generated"
  | "title_selected"
  | "outline_generated"
  | "outline_approved"
  | "content_generation_started"
  | "content_generation_completed"
  | "content_generation_failed"
  // Content publish events
  | "content_published"
  | "content_scheduled"
  // CMS events
  | "cms_connection_completed"
  | "cms_connection_failed"
  | "cms_publish_attempted"
  | "cms_publish_succeeded"
  | "cms_publish_failed"
  // Subscription events
  | "checkout_started"
  | "subscription_purchased"
  | "payment_failed"
  // General events
  | "page_view"
  | "button_click"
  | "form_submit";

type EventProperties = Record<string, string | number | boolean | undefined>;

interface AnalyticsUser {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
}

// ── PostHog bridge ────────────────────────────────────────────────────────────
// The PostHogProvider calls registerPostHog() on mount to wire in posthog-js.
// This avoids importing posthog-js directly here, which keeps analytics.ts
// server-safe (no browser-only globals at module load time).

interface PostHogBridge {
  identify: (
    distinctId: string,
    properties?: Record<string, string | undefined>,
  ) => void;
  capture: (event: string, properties?: Record<string, unknown>) => void;
  reset: () => void;
}

let _posthog: PostHogBridge | null = null;

export function registerPostHog(bridge: PostHogBridge): void {
  _posthog = bridge;
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
   * Identify the current user.
   * Call after login / signup so subsequent events are associated with them.
   */
  identify(user: AnalyticsUser) {
    if (!this.enabled) return;

    if (user.id) {
      _posthog?.identify(user.id, {
        email: user.email,
        name: user.name,
        role: user.role,
      });
    }
  }

  /**
   * Track an analytics event, with the caller's properties only. PostHog adds the time, the person
   * and the page's address itself, and that address goes out with its credentials redacted
   * (lib/analytics-redact.ts); a second, raw copy of it must never ride along.
   */
  track(event: AnalyticsEvent, properties?: EventProperties) {
    if (!this.enabled) return;
    _posthog?.capture(event, { ...properties });
  }

  /** Track a page view. */
  page(name: string, properties?: EventProperties) {
    this.track("page_view", { page_name: name, ...properties });
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
export type { AnalyticsEvent, EventProperties, AnalyticsUser };

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
