/**
 * Notification API Service
 *
 * Handles marking notifications as read via the backend API.
 */

import { resolveApiBaseUrl } from "@/lib/api-base-url";
import { authenticatedFetch } from "@/lib/auth-utils";
import { log } from "@/lib/logger";
import { buildUrl } from "@/lib/url-utils";
import type { OperationNotification } from "@/types/sse";
import { parseApiNotifications } from "@/schemas/notification-feed-schema";
import type {
  ApiNotificationStatus,
  ApiNotificationType,
} from "@/types/notifications";

function mapApiNotificationToUiType(
  status: ApiNotificationStatus,
  sourceType: ApiNotificationType,
): OperationNotification["type"] {
  if (status === "error" || status === "failed") {
    return "error";
  }

  if (status === "success") {
    return "success";
  }

  if (status === "warning") {
    return "warning";
  }

  if (sourceType === "system" || sourceType === "user") {
    return sourceType;
  }

  return "info";
}

function getNotificationApiBaseUrl(): string {
  return resolveApiBaseUrl({ allowWindowOriginFallback: true });
}

/**
 * Fetch notifications from the backend and merge them into the notification store.
 *
 * Side effects:
 * - Reads auth context via `authenticatedFetch`
 * - Writes notifications to `useNotificationStore`
 * - Logs and swallows errors (does not throw)
 */

let inFlightNotificationsFetch: Promise<OperationNotification[]> | null = null;
let lastNotificationsFetchTime = 0;
let cachedNotifications: OperationNotification[] = [];
const NOTIFICATIONS_CACHE_TTL_MS = 15_000;

export async function fetchNotifications(options?: {
  force?: boolean;
  /** Throw on a failed read instead of returning nothing (the drawer's Try again needs to know). */
  throwOnError?: boolean;
}): Promise<OperationNotification[]> {
  if (
    !options?.force &&
    cachedNotifications.length > 0 &&
    Date.now() - lastNotificationsFetchTime < NOTIFICATIONS_CACHE_TTL_MS
  ) {
    return cachedNotifications;
  }

  if (inFlightNotificationsFetch) {
    return inFlightNotificationsFetch;
  }

  inFlightNotificationsFetch = (async () => {
    try {
      const res = await authenticatedFetch(
        `${getNotificationApiBaseUrl()}/api/v1/notifications`,
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch notifications: ${res.status}`);
      }

      const json = await res.json();
      if (!json.success) {
        log.error("Notification API error: success=false", { json });
        throw new Error("Notification API returned success=false");
      }

      // Attempt to handle both { data: { notifications: [] } } and { data: [] }
      const rawNotifications = json.data?.notifications || json.data;

      if (!rawNotifications) {
        log.warn("No notifications found in API response", { json });
        return [];
      }

      const notifications = parseApiNotifications(rawNotifications);

      log.info(`Fetched ${notifications.length} notifications`, {
        source: json.data?.notifications ? "data.notifications" : "data",
      });

      const mapped = notifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: mapApiNotificationToUiType(n.status, n.type),
        read: n.is_read,
        createdAt: n.created_at,
        // The drawer's icon (by `source`, the backend's kind) and link (`href`, or a finished
        // article's page from `contentId` in its workspace).
        metadata: {
          source: n.type,
          category: n.category,
          href: n.action_url ?? undefined,
          contentId:
            typeof n.payload?.content_id === "string"
              ? n.payload.content_id
              : undefined,
          workspaceId: n.workspace_id ?? undefined,
        },
      }));

      cachedNotifications = mapped;
      lastNotificationsFetchTime = Date.now();
      return mapped;
    } catch (err) {
      const normalizedError =
        err instanceof Error ? err : new Error(String(err));
      log.error("Error fetching notifications", { error: normalizedError });
      if (options?.throwOnError) throw normalizedError;
      return []; // Return empty instead of throwing to avoid breaking the layout
    } finally {
      inFlightNotificationsFetch = null;
    }
  })();

  return inFlightNotificationsFetch;
}

// function mapStatusToType(status: string): OperationNotification["type"] {
//   switch (status) {
//     case "success":
//       return "success";
//     case "failed":
//       return "error";
//     case "warning":
//       return "warning";
//     default:
//       return "info";
//   }
// }

/**
 * Mark specific notifications as read.
 * Throws when the backend request fails.
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
 * Clear (soft delete) all read notifications.
 * Throws when the backend request fails.
 */
export async function clearReadNotifications(): Promise<{
  success: boolean;
  message: string;
}> {
  const url = buildUrl(
    `${getNotificationApiBaseUrl()}/api/v1/notifications/clear`,
    { clear_all_read: true },
  );

  const response = await authenticatedFetch(url, { method: "POST" });

  if (!response.ok) {
    throw new Error(`Failed to clear notifications: ${response.statusText}`);
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
