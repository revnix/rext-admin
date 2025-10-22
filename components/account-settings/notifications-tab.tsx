"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { NotificationPreferencesForm } from "@/components/notification-settings/notification-preferences";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiClient } from "@/lib/api-client";
import { log } from "@/lib/logger";
import {
  defaultNotificationPreferences,
  type NotificationPreferences,
} from "@/schemas/notification-schemas";

export function NotificationsTab() {
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const data = await apiClient.notifications.getPreferences();
        setPreferences(data);
      } catch (err) {
        log.error("[NotificationsTab] Failed to load preferences:", err);
        setError("Failed to load notification preferences");
        // Set defaults if backend not ready
        setPreferences(defaultNotificationPreferences);
      } finally {
        setIsLoading(false);
      }
    }

    loadPreferences();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Notification Preferences</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Manage how and when you receive notifications
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error}. Using default preferences.
          </AlertDescription>
        </Alert>
      )}

      {preferences && (
        <NotificationPreferencesForm initialPreferences={preferences} />
      )}
    </div>
  );
}
