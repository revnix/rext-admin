"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { log } from "@/lib/logger";
import { useSSE } from "@/providers/sse-provider";
import type { SSEEvent } from "@/types/sse";
import { fetchNotifications } from "@/services/notification-api";
import { useNotificationStore } from "@/stores/notification-store";

const userNotificationsLogger = log.forComponent("useUserNotifications");

/**
 * Hook that automatically subscribes to user-specific notifications
 * and general events when the user is logged in. Fetches notifications from API whenever an event occurs.
 */
export function useUserNotifications() {
  const { data: session, status } = useSession();
  const { subscribe } = useSSE();
  const hasHydrated = useNotificationStore((state) => state.hasHydrated);
  const unsubscribeUserNotificationsRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Only subscribe if user is authenticated and store has hydrated
    if (status !== "authenticated" || !session?.user?.id || !hasHydrated) {
      return;
    }

    const userId = session.user.id;
    const userNotificationsChannelId = `user-notifications-${userId}`;

    // ── Initial fetch on mount ──────────────────────────────────────────
    fetchNotifications()
      .then((incoming) => {
        useNotificationStore.getState().mergeNotifications(incoming);
      })
      .catch((error) => {
        userNotificationsLogger.error("Failed to load initial notifications", {
          userId,
          error,
        });
      });

    // Subscribe to user notification events
    unsubscribeUserNotificationsRef.current = subscribe(
      userNotificationsChannelId,
      (event: SSEEvent) => {
        userNotificationsLogger.debug(
          "Received user notification event, fetching notifications",
          {
            eventId: event.id,
            step: event.step,
            status: event.status,
          },
        );

        // Fetch notifications from API
        fetchNotifications()
          .then((incoming) => {
            useNotificationStore.getState().mergeNotifications(incoming);
          })
          .catch((error) => {
            userNotificationsLogger.error(
              "Failed to refresh user notifications",
              {
                userId,
                error,
              },
            );
          });
      },
      (status) => {
        userNotificationsLogger.debug("User notification connection status", {
          connected: status.connected,
          retryCount: status.retryCount,
          error: status.error,
        });
      },
    );

    // Cleanup on unmount or when user changes
    return () => {
      if (unsubscribeUserNotificationsRef.current) {
        userNotificationsLogger.info("Unsubscribing from user notifications", {
          userId,
        });
        unsubscribeUserNotificationsRef.current();
        unsubscribeUserNotificationsRef.current = null;
      }
    };
  }, [session?.user?.id, status, subscribe, hasHydrated]);
}
