/**
 * Notification API Service
 *
 * Handles marking notifications as read via the backend API.
 */

import { resolveApiBaseUrl } from "@/lib/api-base-url";
import { authenticatedFetch } from "@/lib/auth-utils";
import { log } from "@/lib/logger";
import { buildUrl } from "@/lib/url-utils";
import type { ApiNotification } from "@/types/notifications";
import type { OperationNotification } from "@/types/sse";

function getNotificationApiBaseUrl(): string {
  return resolveApiBaseUrl({ allowWindowOriginFallback: true });
}
export async function fetchNotifications(): Promise<OperationNotification[]> {
  try {
    const res = await authenticatedFetch(
      `${getNotificationApiBaseUrl()}/api/v1/notifications`,
    );
    if (!res.ok) {
      throw new Error(`Failed to fetch notifications: ${res.status}`);
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error("Notification API returned success=false");
    }

    const notifications: ApiNotification[] = json.data.notifications;

    return [...notifications].map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: mapStatusToType(n.status),
      read: n.is_read,
      createdAt: n.created_at,
    }));
  } catch (err) {
    const normalizedError = err instanceof Error ? err : new Error(String(err));
    log.error("Error fetching notifications", { error: normalizedError });
    throw normalizedError;
  }
}

function mapStatusToType(status: string): OperationNotification["type"] {
  switch (status) {
    case "success":
      return "success";
    case "failed":
      return "error";
    case "warning":
      return "warning";
    default:
      return "info";
  }
}

/**
 * Mark specific notifications as read
 *
 * @param notificationIds - Array of notification IDs to mark as read
 * @returns Success response
 */
export async function markNotificationsAsRead(
  notificationIds: string[],
): Promise<{ success: boolean; message: string }> {
  const url = buildUrl(
    `${getNotificationApiBaseUrl()}/api/v1/notifications/mark-as-read`,
    {
      notification_ids: notificationIds,
    },
  );

  const response = await authenticatedFetch(url, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to mark notifications as read: ${response.statusText}`,
    );
  }

  return response.json();
}

/**
 * Mark all notifications as read
 *
 * @returns Success response
 */
export async function markAllNotificationsAsRead(): Promise<{
  success: boolean;
  message: string;
}> {
  const url = buildUrl(
    `${getNotificationApiBaseUrl()}/api/v1/notifications/mark-as-read`,
    {
      mark_all: true,
    },
  );

  const response = await authenticatedFetch(url, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to mark all notifications as read: ${response.statusText}`,
    );
  }

  return response.json();
}

/**
 * Notification API Service
 */
export const NotificationApiService = {
  markNotificationsAsRead,
  markAllNotificationsAsRead,
};
