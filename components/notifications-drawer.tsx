"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, isSameDay, subDays } from "date-fns";
import {
  AlertTriangle,
  Bell,
  CreditCard,
  FileText,
  type LucideIcon,
  Settings,
  User,
  Users,
} from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { log } from "@/lib/logger";
import { workspaceQueries } from "@/lib/query-keys";
import { workspaceRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import {
  clearReadNotifications,
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationsAsRead,
} from "@/services/notification-api";
import { useNotificationStore } from "@/stores/notification-store";
import type { OperationNotification } from "@/types/sse";
import type { Workspace } from "@/types/workspace";

interface NotificationsDrawerProps {
  open: boolean;
  onClose: () => void;
}

/** One neutral icon per kind (design/app-language.md §2): what it's about, never a colour. */
const KIND_ICON: Record<string, LucideIcon> = {
  workspace: Users,
  billing: CreditCard,
  content: FileText,
  generation: FileText,
  system: Settings,
  user: User,
};

function iconFor(notification: OperationNotification): LucideIcon {
  if (notification.type === "error") return AlertTriangle;
  const source = notification.metadata?.source;
  if (typeof source === "string" && KIND_ICON[source]) return KIND_ICON[source];
  return KIND_ICON[notification.type] ?? Bell;
}

/** "Today", "Yesterday", or the day itself: "Monday, October 5" (with the year when it isn't this one). */
export function dayLabel(date: Date, now = new Date()) {
  // A malformed timestamp gets a group of its own rather than a formatting error.
  if (Number.isNaN(date.getTime())) return "Earlier";
  if (isSameDay(date, now)) return "Today";
  if (isSameDay(date, subDays(now, 1))) return "Yesterday";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  }).format(date);
}

/** The notifications by day, newest day first, in the order they came. */
export function groupByDay(
  notifications: OperationNotification[],
  now = new Date(),
) {
  const groups: { label: string; items: OperationNotification[] }[] = [];
  for (const notification of notifications) {
    const label = dayLabel(new Date(notification.createdAt), now);
    const group = groups.at(-1);
    if (group?.label === label) group.items.push(notification);
    else groups.push({ label, items: [notification] });
  }
  return groups;
}

/** A path inside the app, or null: `//host` and `/\host` lead elsewhere, so the origin is compared. */
function internalPath(href: unknown) {
  if (typeof href !== "string" || !href.startsWith("/")) return null;
  const base = "https://app.invalid";
  try {
    const url = new URL(href, base);
    return url.origin === base
      ? `${url.pathname}${url.search}${url.hash}`
      : null;
  } catch {
    return null;
  }
}

/**
 * Where a notification leads: the link it carries, or a finished article's page in its workspace.
 * Only a path inside the app counts.
 */
export function notificationHref(
  notification: OperationNotification,
  workspaces: Pick<Workspace, "id" | "slug">[] = [],
) {
  const href = internalPath(notification.metadata?.href);
  if (href) return href;
  const { contentId, workspaceId } = notification.metadata ?? {};
  if (typeof contentId !== "string" || typeof workspaceId !== "string") {
    return null;
  }
  const workspace = workspaces.find((w) => w.id === workspaceId);
  return workspace
    ? workspaceRoutes.contentDetail(workspace.slug, contentId)
    : null;
}

function relativeTime(timestamp: string) {
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  } catch {
    return "";
  }
}

/**
 * The notifications drawer (plans/app/D-pages.md §2.8): a plain list in a Sheet, grouped by day.
 * Each row is an icon for its kind, one sentence, when it came, and a link where it leads somewhere.
 * There are no cards and no colours per kind.
 */
export function NotificationsDrawer({
  open,
  onClose,
}: NotificationsDrawerProps) {
  const router = useRouter();
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const isLoading = useNotificationStore((state) => state.isLoading);
  const fetchError = useNotificationStore((state) => state.fetchError);
  const setNotificationRead = useNotificationStore(
    (state) => state.setNotificationRead,
  );
  const setAllNotificationsRead = useNotificationStore(
    (state) => state.setAllNotificationsRead,
  );
  const removeNotification = useNotificationStore(
    (state) => state.removeNotification,
  );
  const mergeNotifications = useNotificationStore(
    (state) => state.mergeNotifications,
  );
  const setFetchState = useNotificationStore((state) => state.setFetchState);
  // A finished article links to its page, which needs its workspace's address.
  const { data: workspaceList } = useQuery({
    ...workspaceQueries.list(),
    enabled: open,
  });
  const workspaces = workspaceList?.workspaces ?? [];
  const readCount = notifications.length - unreadCount;

  const handleMarkAsRead = async (id: string) => {
    setNotificationRead(id, true);
    try {
      await markNotificationsAsRead([id]);
    } catch (error) {
      log.error("Failed to mark notification as read", error);
      setNotificationRead(id, false);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setAllNotificationsRead();
    try {
      await markAllNotificationsAsRead();
    } catch (error) {
      log.error("Failed to mark all notifications as read", error);
      setAllNotificationsRead(unreadIds);
    }
  };

  const handleClearRead = async () => {
    const readItems = notifications.filter((n) => n.read);
    if (readItems.length === 0) return;
    for (const n of readItems) removeNotification(n.id);
    try {
      await clearReadNotifications();
    } catch {
      mergeNotifications(readItems);
    }
  };

  const handleOpen = async (notification: OperationNotification) => {
    const href = notificationHref(notification, workspaces);
    if (!href) return;
    if (!notification.read) {
      // A run's own notice lives only in this browser; the rest are the backend's.
      if (notification.metadata?.kind === "content_generation") {
        setNotificationRead(notification.id, true);
      } else {
        await handleMarkAsRead(notification.id);
      }
    }
    onClose();
    router.push(href as Route);
  };

  const retry = async () => {
    setFetchState({ isLoading: true, fetchError: null });
    try {
      mergeNotifications(
        await fetchNotifications({ force: true, throwOnError: true }),
      );
      setFetchState({ isLoading: false, fetchError: null });
    } catch (error) {
      setFetchState({
        isLoading: false,
        fetchError: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="gap-3 border-b p-4 pr-12">
          <div className="flex flex-col gap-1">
            <SheetTitle>Notifications</SheetTitle>
            <SheetDescription>
              {unreadCount > 0 ? `${unreadCount} unread` : "All read"}
            </SheetDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark all read
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearRead}
              disabled={readCount === 0}
            >
              Clear read
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea aria-busy={isLoading} className="min-h-0 flex-1">
          {isLoading && notifications.length === 0 ? (
            <div className="flex flex-col gap-4 p-4">
              {[0, 1, 2, 3].map((row) => (
                <div key={row} className="flex gap-3">
                  <Skeleton className="size-4 shrink-0" />
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : fetchError ? (
            <div className="p-4">
              <Notice
                tone="danger"
                title="Your notifications didn't load"
                action={
                  <Button variant="outline" size="sm" onClick={retry}>
                    Try again
                  </Button>
                }
              >
                Try again, or refresh the page.
              </Notice>
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState
              title="You're all caught up"
              description="We'll tell you here when an article is ready or something needs you."
              className="p-4"
            />
          ) : (
            <div className="flex flex-col gap-6 p-4">
              {groupByDay(notifications).map((group) => (
                <section key={group.label} className="flex flex-col gap-1">
                  <h3 className="text-label text-muted-foreground">
                    {group.label}
                  </h3>
                  <ul className="flex flex-col">
                    {group.items.map((notification) => (
                      <NotificationRow
                        key={notification.id}
                        notification={notification}
                        href={notificationHref(notification, workspaces)}
                        onOpen={() => handleOpen(notification)}
                        onMarkRead={() => handleMarkAsRead(notification.id)}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function NotificationRow({
  notification,
  href,
  onOpen,
  onMarkRead,
}: {
  notification: OperationNotification;
  href: string | null;
  onOpen: () => void;
  onMarkRead: () => void;
}) {
  const Icon = iconFor(notification);
  const sentence = notification.message || notification.title;
  const body = (
    <>
      <Icon
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn(
            "text-sm",
            notification.read ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {!notification.read && <span className="sr-only">Unread: </span>}
          {sentence}
        </span>
        <span className="text-xs text-muted-foreground">
          {relativeTime(notification.createdAt)}
        </span>
      </span>
      {!notification.read && (
        <span
          aria-hidden
          className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
        />
      )}
    </>
  );

  return (
    <li className="flex items-start gap-2">
      {href ? (
        <button
          type="button"
          onClick={onOpen}
          className="-mx-2 flex min-w-0 flex-1 items-start gap-3 rounded-sm px-2 py-2 text-left hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
        >
          {body}
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 items-start gap-3 py-2">{body}</div>
      )}
      {!href && !notification.read && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-1 shrink-0"
          onClick={onMarkRead}
        >
          Mark read
        </Button>
      )}
    </li>
  );
}
