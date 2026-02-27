"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { log } from "@/lib/logger";
import {
    transformToApiResponse,
    type NotificationPreferencesApiResponse,
} from "@/schemas/notification-schemas";

const notificationPreferencesLogger = log.forComponent(
    "useNotificationPreferences"
);

/**
 * Query options for notification preferences
 *
 * Centralizes the query configuration for loading notification preferences
 * with consistent caching, error handling, and fallback behavior.
 */
export const notificationPreferencesQueryOptions = queryOptions({
    queryKey: ["notification-preferences"],
    queryFn: async (): Promise<NotificationPreferencesApiResponse> => {
        try {
            return await apiClient.notifications.getPreferences();
        } catch (error) {
            notificationPreferencesLogger.error(
                "Failed to load notification preferences",
                error
            );
            // Re-throw error so React Query sets error state for UI display
            throw error;
        }
    },
    staleTime: 60_000, // 60 seconds
    retry: 1,
});

/**
 * Hook to fetch notification preferences
 *
 * Provides a consistent interface for all components that need to load
 * and display notification preferences. Handles loading, errors, and
 * fallback behavior centrally.
 *
 * @returns Query result including data, isLoading, and error state
 */
export function useNotificationPreferences() {
    return useQuery(notificationPreferencesQueryOptions);
}