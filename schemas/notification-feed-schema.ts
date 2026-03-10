import { z } from "zod";
import {
  NOTIFICATION_CATEGORY_VALUES,
  NOTIFICATION_STATUS_VALUES,
  NOTIFICATION_TYPE_VALUES,
  type ApiNotification,
} from "@/types/notifications";
import { log } from "@/lib/logger";

const apiNotificationSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
  type: z.enum(NOTIFICATION_TYPE_VALUES),
  category: z.union([z.enum(NOTIFICATION_CATEGORY_VALUES), z.string().min(1)]),
  status: z.enum(NOTIFICATION_STATUS_VALUES),
  is_read: z.boolean(),
  created_at: z.string(),
});

const apiNotificationListSchema = z.array(apiNotificationSchema);

export function parseApiNotifications(payload: unknown): ApiNotification[] {
  if (!payload || !Array.isArray(payload)) {
    log.warn("[parseApiNotifications] Payload is not an array:", payload);
    return [];
  }

  try {
    return apiNotificationListSchema.parse(payload);
  } catch (error) {
    log.error("[parseApiNotifications] Zod error:", error);
    // Return empty array instead of throwing to avoid application-wide crashes
    // if the notification format changes on the backend.
    return [];
  }
}
