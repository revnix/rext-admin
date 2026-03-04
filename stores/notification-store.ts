import { log } from "@/lib/logger";
import { NotificationApiService } from "@/services";
import type { OperationNotification } from "@/types/sse";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

const MAX_NOTIFICATIONS = 50;

interface NotificationStore {
  notifications: OperationNotification[];
  unreadCount: number;
  isDrawerOpen: boolean;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  addNotification: (notification: OperationNotification) => void;
  mergeNotifications: (incoming: OperationNotification[]) => void;
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
        setHasHydrated: (value) => set({ hasHydrated: value }),

        addNotification: (notification) =>
          set((state) => {
            if (state.notifications.some((n) => n.id === notification.id)) {
              return state;
            }

            const next = [notification, ...state.notifications].slice(
              0,
              MAX_NOTIFICATIONS,
            );

            return updateState(next);
          }),

        mergeNotifications: (incoming) =>
          set((state) => {
            const map = new Map(state.notifications.map((n) => [n.id, n]));

            for (const item of incoming) {
              map.set(item.id, item);
            }

            const merged = Array.from(map.values())
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              )
              .slice(0, MAX_NOTIFICATIONS);

            return updateState(merged);
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
            await NotificationApiService.markNotificationsAsRead([id]);
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
            await NotificationApiService.markAllNotificationsAsRead();
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
          notifications: state.notifications.slice(0, MAX_NOTIFICATIONS),
        }),

        merge: (persisted, current) => {
          const persistedState = persisted as Partial<NotificationStore>;
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
