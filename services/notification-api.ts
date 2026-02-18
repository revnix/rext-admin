/**
 * Notification API Service
 *
 * Handles marking notifications as read via the backend API.
 */

import { authenticatedFetch } from "@/lib/auth-utils";
import { log } from "@/lib/logger";
import { buildUrl } from "@/lib/url-utils";
import { useNotificationStore } from "@/stores/notification-store";
import type { ApiNotification } from "@/types/notifications";
import type { OperationNotification } from "@/types/sse";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://127.0.0.1:2024";

export async function fetchNotifications() {
  try {
    const res = await authenticatedFetch(
      `${API_BASE_URL}/api/v1/notifications`,
    );
    if (!res.ok) throw new Error("Failed to fetch notifications");

    const json = await res.json();
    if (!json.success) return;

    const notifications: ApiNotification[] = json.data.notifications;
    const store = useNotificationStore.getState();

    // API returns notifications from newest to oldest
    // Add them in reverse order so the newest ends up first in the store
    [...notifications].reverse().forEach((n) => {
      store.addNotification({
        id: n.id,
        title: n.title,
        message: n.message,
        type: mapStatusToType(n.status),
        read: n.is_read,
        createdAt: n.created_at,
      });
    });
  } catch (err) {
    log.error("Error fetching notifications:", err);
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
  const url = buildUrl(`${API_BASE_URL}/api/v1/notifications/mark-as-read`, {
    notification_ids: notificationIds,
  });

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
  const url = buildUrl(`${API_BASE_URL}/api/v1/notifications/mark-as-read`, {
    mark_all: true,
  });

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
