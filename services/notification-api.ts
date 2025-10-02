import { authenticatedFetch } from "@/lib/auth-utils";
import type { NotificationPreferences } from "@/schemas/notification-schemas";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:2024";

/**
 * Get current user's notification preferences
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/v1/user/preferences/notifications`,
  );
  return response.json();
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  preferences: NotificationPreferences,
): Promise<{ message: string }> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/v1/user/preferences/notifications`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preferences),
    },
  );
  return response.json();
}
