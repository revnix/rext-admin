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

/**
 * NotificationPreferencesSection Component
 *
 * Manages user notification preferences including email notifications,
 * in-app notifications, digest settings, and category-specific toggles.
 */
export function NotificationPreferencesSection() {
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
        log.error("[NotificationPreferencesSection] Failed to load:", err);
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
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Manage how and when you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Manage how and when you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 mb-6">
            <p className="text-sm text-yellow-800">
              {error}. Using default preferences.
            </p>
          </div>
        )}
        {preferences && (
          <NotificationPreferencesForm initialPreferences={preferences} />
        )}
      </CardContent>
    </Card>
  );
}
