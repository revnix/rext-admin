"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { NotificationPreferencesForm } from "@/components/notification-settings/notification-preferences";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import { log } from "@/lib/logger";
import {
  defaultNotificationPreferences,
  type NotificationPreferences,
} from "@/schemas/notification-schemas";

export default function NotificationsSettingsPage() {
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
        log.error("[NotificationsSettings] Failed to load preferences:", err);
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
        <h2 className="text-2xl font-bold tracking-tight">
          Notification Preferences
        </h2>
        <p className="text-muted-foreground mt-1">
          Manage how and when you receive notifications
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
          <p className="text-sm text-yellow-800">
            {error}. Using default preferences.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>
            Choose which notifications you want to receive and how often
          </CardDescription>
        </CardHeader>
        <CardContent>
          {preferences && (
            <NotificationPreferencesForm initialPreferences={preferences} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
