import type { OperationNotification } from "@/types/sse";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { NotificationApiService } from "@/services/notification-api";
import { log } from "@/lib/logger";

const MAX_NOTIFICATIONS = 50;

interface NotificationStore {
  notifications: OperationNotification[];
  unreadCount: number;

  addNotification: (notification: OperationNotification) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
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
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notification) =>
        set((state) => {
          // Skip if ID already exists
          if (state.notifications.some((n) => n.id === notification.id))
            return state;

          const next = [notification, ...state.notifications].slice(
            0,
            MAX_NOTIFICATIONS,
          );

          return updateState(next);
        }),

      markAsRead: async (id: string) => {
        // Optimistic update
        set((state) => updateState(markOneRead(state.notifications, id)));

        try {
          await NotificationApiService.markNotificationsAsRead([id]);
        } catch (error) {
          log.error("Failed to mark notification as read", error);
          // Revert
          set((state) => updateState(revertOneRead(state.notifications, id)));
        }
      },

      markAllAsRead: async () => {
        const current = get().notifications;
        const unreadIds = current.filter((n) => !n.read).map((n) => n.id);
        if (unreadIds.length === 0) return;

        // Optimistic update
        set((state) => ({
          notifications: markAllRead(state.notifications),
          unreadCount: 0,
        }));

        try {
          await NotificationApiService.markAllNotificationsAsRead();
        } catch (error) {
          log.error("Failed to mark all notifications as read", error);
          // Revert
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
    }),
    {
      name: "notification-store",
      enabled: process.env.NODE_ENV === "development", // good hygiene
    },
  ),
);
