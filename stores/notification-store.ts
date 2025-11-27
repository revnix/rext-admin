/**
 * Notification Store
 *
 * Centralized state for real-time operation notifications emitted via SSE.
 * Provides a single source of truth for unread counts, list management, and
 * lifecycle helpers (mark as read, clear, prune, etc.).
 */

import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import type { OperationNotification } from "@/types/sse";

const MAX_NOTIFICATIONS = 50;

type NotificationInput = Omit<OperationNotification, "read" | "createdAt"> &
  Partial<Pick<OperationNotification, "read" | "createdAt">>;

interface NotificationStore {
  notifications: OperationNotification[];
  unreadCount: number;

  addNotification: (notification: NotificationInput) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const initialState: Pick<NotificationStore, "notifications" | "unreadCount"> = {
  notifications: [],
  unreadCount: 0,
};

const calculateUnread = (notifications: OperationNotification[]) =>
  notifications.reduce((count, notification) => {
    return notification.read ? count : count + 1;
  }, 0);

const noopStorage: Storage = {
  get length() {
    return 0;
  },
  clear: () => undefined,
  getItem: () => null,
  key: (_index: number) => null,
  removeItem: () => undefined,
  setItem: () => undefined,
};

export const useNotificationStore = create<NotificationStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        addNotification: (notification) => {
          set((state) => {
            // Prevent duplicates when SSE replays identical events.
            if (state.notifications.some((n) => n.id === notification.id)) {
              return state;
            }

            const normalized: OperationNotification = {
              ...notification,
              createdAt: notification.createdAt ?? new Date().toISOString(),
              read: notification.read ?? false,
            };

            const nextNotifications = [
              normalized,
              ...state.notifications,
            ].slice(0, MAX_NOTIFICATIONS);

            return {
              notifications: nextNotifications,
              unreadCount: calculateUnread(nextNotifications),
            };
          });
        },

        markAsRead: (id) =>
          set((state) => {
            const nextNotifications = state.notifications.map((notification) =>
              notification.id === id ? { ...notification, read: true } : notification,
            );

            return {
              notifications: nextNotifications,
              unreadCount: calculateUnread(nextNotifications),
            };
          }),

        markAllAsRead: () =>
          set((state) => {
            if (state.unreadCount === 0) {
              return state;
            }

            const nextNotifications = state.notifications.map((notification) =>
              notification.read ? notification : { ...notification, read: true },
            );

            return {
              notifications: nextNotifications,
              unreadCount: 0,
            };
          }),

        removeNotification: (id) =>
          set((state) => {
            const nextNotifications = state.notifications.filter(
              (notification) => notification.id !== id,
            );

            return {
              notifications: nextNotifications,
              unreadCount: calculateUnread(nextNotifications),
            };
          }),

        clearNotifications: () => set(initialState),
      }),
      {
        name: "notification-cache",
        partialize: (state) => ({
          notifications: state.notifications,
          unreadCount: state.unreadCount,
        }),
        storage: createJSONStorage(() =>
          typeof window === "undefined" ? noopStorage : window.localStorage,
        ),
      },
    ),
    {
      name: "notification-store",
    },
  ),
);

