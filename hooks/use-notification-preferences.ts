"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { NotificationPreferencesApiResponse } from "@/schemas/notification-schemas";

export function useNotificationPreferences() {
    return useQuery<NotificationPreferencesApiResponse>({
        queryKey: ["notification-preferences"],
        queryFn: () => apiClient.notifications.getPreferences(),
        retry: 1,
    });
}