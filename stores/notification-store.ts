// Replace/Add at line 1:
import type { OperationNotification } from "@/types/sse";
import { create } from "zustand";
import {
  markAllNotificationsAsRead,
  markNotificationsAsRead,
} from "@/services/notification-api";
import { log } from "@/lib/logger";
import { NOTIFICATION_CONSTANTS } from "@/constants/notifications";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

interface NotificationStore {
  notifications: OperationNotification[];
  unreadCount: number;
  isDrawerOpen: boolean;
  hasHydrated: boolean;

  isLoading: boolean;
  fetchError: string | null;

  setFetchState: (state: {
    isLoading: boolean;
    fetchError: string | null;
  }) => void;
  setHasHydrated: (value: boolean) => void;
  addNotification: (notification: OperationNotification) => void;
  mergeNotifications: (notifications: OperationNotification[]) => void;
  setNotificationRead: (id: string, read: boolean) => void;
  setAllNotificationsRead: (unreadIds?: string[]) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setDrawerOpen: (open: boolean) => void;
}

/* ------------------------------
   Helpers
--------------------------------*/

const calculateUnread = (notifications: OperationNotification[]) =>
  notifications.reduce((count, n) => (n.read ? count : count + 1), 0);

const updateState = (notifications: OperationNotification[]) => ({
  notifications,
  unreadCount: calculateUnread(notifications),
});

const markOneRead = (notifications: OperationNotification[], id: string) =>
  notifications.map((n) => (n.id === id ? { ...n, read: true } : n));

const revertOneRead = (notifications: OperationNotification[], id: string) =>
  notifications.map((n) => (n.id === id ? { ...n, read: false } : n));

const markAllRead = (notifications: OperationNotification[]) =>
  notifications.map((n) => ({ ...n, read: true }));

const revertAllRead = (
  notifications: OperationNotification[],
  unreadIds: string[],
) =>
  notifications.map((n) =>
    unreadIds.includes(n.id) ? { ...n, read: false } : n,
  );

/* ------------------------------
   Store Implementation
--------------------------------*/

export const useNotificationStore = create<NotificationStore>()(
  devtools(
    persist(
      (set, get) => ({
        notifications: [],
        unreadCount: 0,
        isDrawerOpen: false,
        hasHydrated: false,
        isLoading: false,
        fetchError: null,

        setFetchState: ({ isLoading, fetchError }) =>
          set({ isLoading, fetchError }),

        setHasHydrated: (value) => set({ hasHydrated: value }),

        addNotification: (notification) =>
          set((state) => {
            if (state.notifications.some((n) => n.id === notification.id)) {
              return state;
            }

            const next = [notification, ...state.notifications].slice(
              0,
              NOTIFICATION_CONSTANTS.MAX_NOTIFICATIONS,
            );

            return updateState(next);
          }),

        mergeNotifications: (incoming) =>
          set((state) => {
            const merged = new Map(
              state.notifications.map((item) => [item.id, item]),
            );
            for (const item of incoming) {
              merged.set(item.id, item);
            }

            const next = Array.from(merged.values())
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              )
              .slice(0, NOTIFICATION_CONSTANTS.MAX_NOTIFICATIONS);

            return updateState(next);
          }),

        setNotificationRead: (id, read) =>
          set((state) => {
            const next = read
              ? markOneRead(state.notifications, id)
              : revertOneRead(state.notifications, id);
            return updateState(next);
          }),

        setAllNotificationsRead: (revertUnreadIds) =>
          set((state) => {
            if (revertUnreadIds) {
              return updateState(
                revertAllRead(state.notifications, revertUnreadIds),
              );
            }
            return {
              notifications: markAllRead(state.notifications),
              unreadCount: 0,
            };
          }),

        markAsRead: async (id: string) => {
          set((state) => updateState(markOneRead(state.notifications, id)));
          try {
            await markNotificationsAsRead([id]);
          } catch (error) {
            log.error("Failed to mark notification as read", error);
            set((state) => updateState(revertOneRead(state.notifications, id)));
          }
        },

        markAllAsRead: async () => {
          const current = get().notifications;
          const unreadIds = current.filter((n) => !n.read).map((n) => n.id);
          if (unreadIds.length === 0) return;

          set((state) => ({
            notifications: markAllRead(state.notifications),
            unreadCount: 0,
          }));

          try {
            await markAllNotificationsAsRead();
          } catch (error) {
            log.error("Failed to mark all notifications as read", error);
            set((state) =>
              updateState(revertAllRead(state.notifications, unreadIds)),
            );
          }
        },

        removeNotification: (id: string) =>
          set((state) => {
            const next = state.notifications.filter((n) => n.id !== id);
            return updateState(next);
          }),

        clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
        setDrawerOpen: (open: boolean) => set({ isDrawerOpen: open }),
      }),
      {
        name: "notification-store",
        storage: createJSONStorage(() =>
          typeof window !== "undefined" ? localStorage : sessionStorage,
        ),

        partialize: (state) => ({
          notifications: state.notifications.slice(
            0,
            NOTIFICATION_CONSTANTS.MAX_NOTIFICATIONS,
          ),
        }),

        merge: (persisted, current) => {
          // `persisted` is undefined on a first visit (nothing stored yet).
          // Throwing here aborts hydration, hasHydrated never flips, and the
          // notification feed never loads or subscribes.
          const persistedState = (persisted ?? {}) as Partial<NotificationStore>;
          const notifications =
            persistedState.notifications ?? current.notifications;

          return {
            ...current,
            ...persistedState,
            notifications,
            unreadCount: calculateUnread(notifications),
          };
        },

        onRehydrateStorage: () => (state) => {
          state?.setHasHydrated(true);
        },
      },
    ),
    {
      name: "notification-store",
      enabled: process.env.NODE_ENV === "development",
    },
  ),
);
