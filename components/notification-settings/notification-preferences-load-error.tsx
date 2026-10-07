"use client";

import { Notice } from "@/components/ui/notice";

interface NotificationPreferencesLoadErrorProps {
  message: string;
}

/**
 * Standardized error display for notification preferences loading failures
 *
 * Provides consistent error UX across all notification preference surfaces
 * through a danger Notice.
 */
export function NotificationPreferencesLoadError({
  message,
}: NotificationPreferencesLoadErrorProps) {
  return <Notice tone="danger">{message}</Notice>;
}
