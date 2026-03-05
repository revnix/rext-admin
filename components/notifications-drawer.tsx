"use client";

import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle,
  Info,
  Mail,
  Settings,
  User,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useNotificationStore } from "@/stores/notification-store";
import { log } from "@/lib/logger";
import type { OperationNotification } from "@/types/sse";
import {
  markAllNotificationsAsRead,
  markNotificationsAsRead,
} from "@/services/notification-api";

interface NotificationsDrawerProps {
  open: boolean;
  onClose: () => void;
}

const getNotificationIcon = (type: OperationNotification["type"]) => {
  switch (type) {
    case "success":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case "error":
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    case "info":
      return <Info className="h-5 w-5 text-blue-500" />;
    case "user":
      return <User className="h-5 w-5 text-purple-500" />;
    case "system":
      return <Settings className="h-5 w-5 text-gray-500" />;
    default:
      return <Mail className="h-5 w-5 text-gray-500" />;
  }
};

const getNotificationBadgeColor = (type: OperationNotification["type"]) => {
  switch (type) {
    case "success":
      return "bg-green-100 text-green-800";
    case "warning":
      return "bg-yellow-100 text-yellow-800";
    case "error":
      return "bg-red-100 text-red-800";
    case "info":
      return "bg-blue-100 text-blue-800";
    case "user":
      return "bg-purple-100 text-purple-800";
    case "system":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export function NotificationsDrawer({
  open,
  onClose,
}: NotificationsDrawerProps) {
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

  const handleMarkAsRead = async (id: string) => {
    // Optimistic update
    setNotificationRead(id, true);

    try {
      await markNotificationsAsRead([id]);
    } catch (error) {
      log.error("Failed to mark notification as read", error);
      // Revert
      setNotificationRead(id, false);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    // Optimistic update
    setAllNotificationsRead();

    try {
      await markAllNotificationsAsRead();
    } catch (error) {
      log.error("Failed to mark all notifications as read", error);
      // Revert
      setAllNotificationsRead(unreadIds);
    }
  };

  const getRelativeTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return "";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-96 p-0 data-[state=closed]:duration-200 data-[state=open]:duration-300">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle className="flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                {unreadCount} new
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            Stay updated with your latest notifications
          </SheetDescription>
        </SheetHeader>

        <ScrollArea
          aria-busy={isLoading}
          className="h-[calc(100vh-180px)] px-6"
        >
          {isLoading ? (
            <div className="flex h-full items-center justify-center py-8 text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : fetchError ? (
            <div className="flex h-full items-center justify-center py-8 text-sm text-destructive">
              Failed to load notifications. Please try again.
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-8 text-center text-muted-foreground">
              <Bell className="h-10 w-10 text-muted-foreground/70" />
              <div>
                <p className="font-medium text-foreground">
                  You're all caught up
                </p>
                <p className="text-sm">
                  We'll let you know when new operations complete.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border transition-all hover:bg-muted/50 ${
                    !notification.read
                      ? "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
                      : "bg-background border-border dark:bg-background dark:border-border"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4
                          className={`text-sm font-medium ${
                            !notification.read
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {notification.title}
                        </h4>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getNotificationBadgeColor(notification.type)}`}
                        >
                          {notification.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {getRelativeTime(notification.createdAt)}
                        </span>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="h-6 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-6 pt-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleMarkAllAsRead()}
            disabled={unreadCount === 0}
          >
            Mark All as Read ({unreadCount})
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
