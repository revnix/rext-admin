"use client";

import { NotificationPreferencesForm } from "@/components/notification-settings/notification-preferences";
import { NotificationPreferencesLoadError } from "@/components/notification-settings/notification-preferences-load-error";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotificationPreferences } from "@/hooks/use-notification-preferences";

/**
 * Account settings, Notifications (plans/app/D-pages.md §2.8): the preferences by area, a form with
 * its own sections and Save.
 */
export function NotificationPreferencesSection() {
  const { data: preferences, isLoading, error } = useNotificationPreferences();

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (error) {
    return (
      <NotificationPreferencesLoadError
        message={
          error instanceof Error
            ? error.message
            : "Your notification preferences didn't load. Refresh the page to try again."
        }
      />
    );
  }
  return preferences ? (
    <NotificationPreferencesForm initialPreferences={preferences} />
  ) : null;
}
