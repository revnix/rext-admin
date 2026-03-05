"use client";

import { NotificationPreferencesSection } from "@/components/settings/notification-preferences-section";

/**
 * Legacy account-settings notifications tab.
 *
 * Loads backend notification preferences and falls back to schema defaults
 * when the backend payload is unavailable.
 */

export function NotificationsTab() {
  return <NotificationPreferencesSection />;
}
