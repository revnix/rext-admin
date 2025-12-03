"use client";

import { useUserNotifications } from "@/hooks/use-user-notifications";

/**
 * Component that automatically subscribes to user notifications
 * Must be rendered inside SSEProvider
 */
export function UserNotificationsListener() {
  useUserNotifications();
  return null;
}
