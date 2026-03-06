"use client";

import { Loader2 } from "lucide-react";
import { NotificationPreferencesForm } from "@/components/notification-settings/notification-preferences";
import { NotificationPreferencesLoadError } from "@/components/notification-settings/notification-preferences-load-error";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNotificationPreferences } from "@/hooks/use-notification-preferences";

/**
 * NotificationPreferencesSection Component
 *
 * Manages user notification preferences including email notifications,
 * in-app notifications, digest settings, and category-specific toggles.
 */
export function NotificationPreferencesSection() {
  const { data: preferences, isLoading, error } = useNotificationPreferences();

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

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Manage how and when you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationPreferencesLoadError
            message={
              error instanceof Error
                ? error.message
                : "Failed to load notification preferences. Please refresh the page and try again."
            }
          />
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
        {preferences && (
          <NotificationPreferencesForm initialPreferences={preferences} />
        )}
      </CardContent>
    </Card>
  );
}
