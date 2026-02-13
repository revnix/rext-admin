/**
 * Analytics Tracking Utility
 *
 * Simple, extensible analytics tracking for user behavior and onboarding metrics.
 * Currently logs to console in development, but can be extended to support
 * analytics providers like PostHog, Mixpanel, Google Analytics, etc.
 *
 * Usage:
 * ```tsx
 * import { analytics } from '@/lib/analytics';
 *
 * analytics.track('onboarding_cta_click', {
 *   source: 'dashboard',
 *   destination: '/w/create'
 * });
 * ```
 */

import { log } from "@/lib/logger";
import { safeJsonParse } from "@/lib/utils";

type AnalyticsEvent =
  // Onboarding Events
  | "onboarding_empty_dashboard_view"
  | "onboarding_empty_sidebar_view"
  | "onboarding_empty_switcher_view"
  | "onboarding_cta_click"
  | "onboarding_workspace_created"
  | "onboarding_first_topic_created"
  | "onboarding_first_content_created"
  | "onboarding_completed"
  | "onboarding_milestone_completed"
  | "onboarding_milestone_skipped"
  | "onboarding_dismissed"
  | "onboarding_reset"
  // Empty State Events
  | "dashboard_empty_state_view"
  | "workspace_empty_state_view"
  | "workspace_empty_state_action_click"
  // General Events
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

class Analytics {
  private enabled: boolean;
  private user: AnalyticsUser | null = null;

  constructor() {
    // Enable in all environments for now
    // Can be configured via env var: NEXT_PUBLIC_ANALYTICS_ENABLED
    this.enabled =
      process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "false" &&
      typeof window !== "undefined";
  }

  /**
   * Identify the current user for analytics
   * Should be called after login/authentication
   */
  identify(user: AnalyticsUser) {
    if (!this.enabled) return;

    this.user = user;

    // Future: Call external analytics provider
    // Example: posthog.identify(user.id, { email: user.email, name: user.name });
  }

  /**
   * Track an analytics event
   */
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

    // Future: Send to external analytics provider
    // Example: posthog.capture(event, eventData.properties);
    // Example: mixpanel.track(event, eventData.properties);

    // Store locally for debugging (optional)
    this.storeEventLocally(eventData);
  }

  /**
   * Track page view
   */
  page(name: string, properties?: EventProperties) {
    this.track("page_view", {
      page_name: name,
      ...properties,
    });
  }

  /**
   * Reset analytics (e.g., on logout)
   */
  reset() {
    this.user = null;

    // Future: Reset external analytics
    // Example: posthog.reset();
  }

  /**
   * Store events locally for debugging and future sync
   * Keeps last 100 events in localStorage
   */
  private storeEventLocally(eventData: unknown) {
    if (typeof window === "undefined") return;

    try {
      const key = "wrext_analytics_events";
      const stored = localStorage.getItem(key);
      const events = safeJsonParse<any[]>(stored, []) ?? [];

      events.push(eventData);

      // Keep only last 100 events
      const recentEvents = events.slice(-100);

      localStorage.setItem(key, JSON.stringify(recentEvents));
    } catch (error) {
      // Silent fail - analytics shouldn't break the app
      log.warn("[Analytics] Failed to store event locally:", error);
    }
  }

  /**
   * Get stored events (for debugging)
   */
  getStoredEvents(): unknown[] {
    if (typeof window === "undefined") return [];

    try {
      const stored = localStorage.getItem("wrext_analytics_events");
      return safeJsonParse<unknown[]>(stored, []) ?? [];
    } catch {
      return [];
    }
  }

  /**
   * Clear stored events
   */
  clearStoredEvents() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("wrext_analytics_events");
  }
}

// Export singleton instance
export const analytics = new Analytics();

// Export types for external use
export type { AnalyticsEvent, EventProperties, AnalyticsUser };
