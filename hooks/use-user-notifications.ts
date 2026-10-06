"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { log } from "@/lib/logger";
import { useSSE } from "@/providers/sse-provider";
import type { SSEEvent } from "@/types/sse";
import { fetchNotifications } from "@/services/notification-api";
import { useNotificationStore } from "@/stores/notification-store";

const userNotificationsLogger = log.forComponent("useUserNotifications");

async function refreshNotificationsWithState(): Promise<void> {
  const store = useNotificationStore.getState();
  store.setFetchState({ isLoading: true, fetchError: null });

  try {
    // The first read reports a failure, so the drawer offers Try again; a refresh after an event
    // (refreshFeed) keeps the feed it has instead.
    const notifications = await fetchNotifications({ throwOnError: true });
    store.mergeNotifications(notifications);
    store.setFetchState({ isLoading: false, fetchError: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    store.setFetchState({ isLoading: false, fetchError: message });
    userNotificationsLogger.error("Failed to refresh notifications", { error });
  }
}

/**
 * Hook that automatically subscribes to user-specific notifications
 * and general events when the user is logged in. Fetches notifications from API whenever an event occurs.
 */
export function useUserNotifications() {
  const { data: session } = useSession();
  // Keyed on the user id alone: a token refresh (session update()) briefly
  // flips `status` to "loading" while the session stays populated, and must
  // not tear down the subscription and reload the list (visible flicker).
  const userId = session?.user?.id;
  const { subscribe } = useSSE();
  const hasHydrated = useNotificationStore((state) => state.hasHydrated);
  const unsubscribeUserNotificationsRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Only subscribe if user is authenticated and store has hydrated
    if (!userId || !hasHydrated) {
      return;
    }

    const userNotificationsChannelId = `user-notifications-${userId}`;
    void refreshNotificationsWithState();

    // A (re)connect replays buffered events in one burst. Coalesce them: while
    // a fetch is in flight, just queue one more, so a burst costs two
    // requests instead of one per event (the endpoint is rate-limited).
    let fetchInFlight = false;
    let fetchQueued = false;
    const refreshFeed = () => {
      if (fetchInFlight) {
        fetchQueued = true;
        return;
      }
      fetchInFlight = true;
      fetchNotifications({ force: true })
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
        })
        .finally(() => {
          fetchInFlight = false;
          if (fetchQueued) {
            fetchQueued = false;
            refreshFeed();
          }
        });
    };

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
        refreshFeed();
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
  }, [userId, subscribe, hasHydrated]);
}
