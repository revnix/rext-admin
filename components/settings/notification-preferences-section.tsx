"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { NotificationPreferencesForm } from "@/components/notification-settings/notification-preferences";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
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
              {error instanceof Error ? error.message : "An error occurred"}.
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
