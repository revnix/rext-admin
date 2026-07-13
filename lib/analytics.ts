import { log } from "@/lib/logger";
import { safeJsonParse } from "@/lib/utils";

// ── Event catalog ─────────────────────────────────────────────────────────────

type AnalyticsEvent =
  // Auth events
  | "user_signed_in"
  | "user_signed_up"
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
