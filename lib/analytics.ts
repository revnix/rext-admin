import { log } from "@/lib/logger";
import { safeJsonParse } from "@/lib/utils";

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
  private user: AnalyticsUser | null = null;

  constructor() {
    this.enabled =
      process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "false" &&
      typeof window !== "undefined";
  }

  /**
   * Identify the current user.
   * Call after login / signup so subsequent events are associated with them.
   */
  identify(user: AnalyticsUser) {
    if (!this.enabled) return;
    this.user = user;

    if (user.id) {
      _posthog?.identify(user.id, {
        email: user.email,
        name: user.name,
        role: user.role,
      });
    }
  }

  /** Track an analytics event. */
  track(event: AnalyticsEvent, properties?: EventProperties) {
    if (!this.enabled) return;

    const eventData = {
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        url: typeof window !== "undefined" ? window.location.href : undefined,
        user_id: this.user?.id,
      },
    };

    _posthog?.capture(event, eventData.properties);

    this.storeEventLocally(eventData);
  }

  /** Track a page view. */
  page(name: string, properties?: EventProperties) {
    this.track("page_view", { page_name: name, ...properties });
  }

  /** Reset analytics state (e.g. on logout). */
  reset() {
    this.user = null;
    _posthog?.reset();
  }

  // ── Internal helpers ───────────────────────────────────────────────────────

  private storeEventLocally(eventData: unknown) {
    if (typeof window === "undefined") return;

    try {
      const key = "wrext_analytics_events";
      const stored = localStorage.getItem(key);
      const events = safeJsonParse<unknown[]>(stored, []) ?? [];

      events.push(eventData);
      const recentEvents = events.slice(-100);
      localStorage.setItem(key, JSON.stringify(recentEvents));
    } catch (error) {
      log.warn("[Analytics] Failed to store event locally:", error);
    }
  }

  getStoredEvents(): unknown[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("wrext_analytics_events");
      return safeJsonParse<unknown[]>(stored, []) ?? [];
    } catch {
      return [];
    }
  }

  clearStoredEvents() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("wrext_analytics_events");
  }
}

export const analytics = new Analytics();
export type { AnalyticsEvent, EventProperties, AnalyticsUser };

// ── Linking a provider ───────────────────────────────────────────────────────
// Linking Google or GitHub from the settings goes through the same OAuth sign-in as logging in, so
// the link button marks it, with its provider, in this tab's session storage (which the provider's
// round trip keeps), and the login record (OAuthLoginRecord, providers/posthog-provider.tsx) records no
// sign-in for it. A login or sign-up started from the OAuth buttons clears the mark, so a link that was
// abandoned can't hide a real sign-in after it.

const OAUTH_LINKING_KEY = "rext-oauth-linking";
/** A mark older than this is from a link that was abandoned, not the login now being recorded. */
const OAUTH_LINKING_MAX_AGE_MS = 10 * 60 * 1000;

/** Called by the link button just before it starts the provider's sign-in. */
export function markOAuthLinking(provider: string): void {
  try {
    window.sessionStorage.setItem(
      OAUTH_LINKING_KEY,
      JSON.stringify({ provider, at: Date.now() }),
    );
  } catch {
    // Storage refused: the link is recorded as a sign-in, as before.
  }
}

/** Called by the login and sign-up OAuth buttons: what they start is never a link. */
export function clearOAuthLinking(): void {
  try {
    window.sessionStorage.removeItem(OAUTH_LINKING_KEY);
  } catch {
    // Storage refused: there is no mark to clear.
  }
}

/**
 * Whether the login being recorded, through `provider`, is a link started in this tab: a mark for the
 * same provider, under ten minutes old. Clears the mark either way.
 */
export function takeOAuthLinking(provider: string): boolean {
  try {
    const raw = window.sessionStorage.getItem(OAUTH_LINKING_KEY);
    window.sessionStorage.removeItem(OAUTH_LINKING_KEY);
    if (!raw) return false;
    const mark = JSON.parse(raw) as { provider?: unknown; at?: unknown };
    return (
      mark.provider === provider &&
      typeof mark.at === "number" &&
      Date.now() - mark.at < OAUTH_LINKING_MAX_AGE_MS
    );
  } catch {
    return false;
  }
}
