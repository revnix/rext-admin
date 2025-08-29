"use client";

import {
  AlertTriangle,
  CheckCircle,
  Info,
  Mail,
  Settings,
  User,
  Check,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface NotificationAction {
  label: string;
  variant?: "default" | "outline" | "secondary" | "destructive";
  onClick: () => void;
}

interface Notification {
  id: string;
  type: "success" | "warning" | "error" | "info" | "system" | "user";
  title: string;
  message: string;
  time: string;
  read: boolean;
  actions?: NotificationAction[];
}

const sampleNotifications: Notification[] = [
  {
    id: "1",
    type: "success",
    title: "Idea Created Successfully",
    message:
      "Your new idea 'AI-Powered Marketing Tool' has been created and is ready for review.",
    time: "2 minutes ago",
    read: false,
  },
  {
    id: "2",
    type: "warning",
    title: "Flow Execution Warning",
    message:
      "Your automation flow 'Email Campaign' completed with warnings. Check the logs for details.",
    time: "15 minutes ago",
    read: false,
    actions: [
      {
        label: "View Logs",
        variant: "outline",
        onClick: () => console.log("Opening logs for flow"),
      },
      {
        label: "Retry Flow",
        variant: "default",
        onClick: () => console.log("Retrying flow execution"),
      },
    ],
  },
  {
    id: "3",
    type: "error",
    title: "Integration Failed",
    message:
      "Failed to connect to Slack workspace. Please check your credentials and try again.",
    time: "1 hour ago",
    read: false,
    actions: [
      {
        label: "Retry Connection",
        variant: "default",
        onClick: () => console.log("Retrying Slack connection"),
      },
      {
        label: "Update Credentials",
        variant: "outline",
        onClick: () => console.log("Opening credentials update"),
      },
    ],
  },
  {
    id: "4",
    type: "info",
    title: "New Feature Available",
    message:
      "We've added new AI model options to help improve your content generation.",
    time: "2 hours ago",
    read: true,
  },
  {
    id: "5",
    type: "user",
    title: "Team Member Added",
    message:
      "John Doe has been added to your workspace and can now access shared projects.",
    time: "3 hours ago",
    read: true,
  },
  {
    id: "6",
    type: "system",
    title: "System Maintenance",
    message:
      "Scheduled maintenance will occur tonight from 2:00 AM to 4:00 AM EST.",
    time: "4 hours ago",
    read: true,
  },
  {
    id: "7",
    type: "success",
    title: "Export Complete",
    message:
      "Your ideas export has been completed successfully. Download link expires in 24 hours.",
    time: "5 hours ago",
    read: true,
    actions: [
      {
        label: "Download",
        variant: "default",
        onClick: () => console.log("Downloading export file"),
      },
    ],
  },
  {
    id: "8",
    type: "warning",
    title: "Storage Limit Warning",
    message:
      "You're approaching 80% of your storage limit. Consider upgrading your plan.",
    time: "6 hours ago",
    read: true,
    actions: [
      {
        label: "Upgrade Plan",
        variant: "default",
        onClick: () => console.log("Opening upgrade plan"),
      },
      {
        label: "Manage Storage",
        variant: "outline",
        onClick: () => console.log("Opening storage management"),
      },
    ],
  },
  {
    id: "9",
    type: "info",
    title: "Weekly Report Ready",
    message:
      "Your weekly productivity report is ready for review. Check out your progress!",
    time: "1 day ago",
    read: true,
  },
  {
    id: "10",
    type: "error",
    title: "API Rate Limit",
    message:
      "You've exceeded the API rate limit for OpenAI integration. Resets in 1 hour.",
    time: "1 day ago",
    read: true,
  },
  {
    id: "11",
    type: "user",
    title: "Profile Updated",
    message: "Your profile information has been updated successfully.",
    time: "2 days ago",
    read: true,
  },
  {
    id: "12",
    type: "system",
    title: "Security Alert",
    message:
      "New login detected from Chrome on Windows. If this wasn't you, please secure your account.",
    time: "2 days ago",
    read: true,
  },
  {
    id: "13",
    type: "success",
    title: "Payment Processed",
    message:
      "Your subscription payment has been processed successfully. Receipt sent via email.",
    time: "3 days ago",
    read: true,
  },
  {
    id: "14",
    type: "info",
    title: "Feature Update",
    message:
      "New collaboration features are now available in your workspace settings.",
    time: "3 days ago",
    read: true,
  },
  {
    id: "15",
    type: "warning",
    title: "Inactive Project",
    message:
      "Project 'Q4 Campaign Ideas' hasn't been updated in 30 days. Archive or continue?",
    time: "4 days ago",
    read: true,
    actions: [
      {
        label: "Continue Project",
        variant: "default",
        onClick: () => console.log("Continue project"),
      },
      {
        label: "Archive",
        variant: "destructive",
        onClick: () => console.log("Archive project"),
      },
    ],
  },
];

interface NotificationsDrawerProps {
  open: boolean;
  onClose: () => void;
}

const getNotificationIcon = (type: Notification["type"]) => {
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

const getNotificationBadgeColor = (type: Notification["type"]) => {
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
  const [notifications, setNotifications] =
    useState<Notification[]>(sampleNotifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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

        <ScrollArea className="h-[calc(100vh-180px)] px-6">
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border transition-all hover:bg-muted/50 ${
                  !notification.read
                    ? "bg-blue-50 border-blue-200"
                    : "bg-background border-border"
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

                    {notification.actions &&
                      notification.actions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {notification.actions.map((action, index) => (
                            <Button
                              key={index}
                              variant={action.variant || "outline"}
                              size="sm"
                              onClick={action.onClick}
                              className="h-7 text-xs px-3"
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {notification.time}
                      </span>
                      <div className="flex items-center gap-2">
                        {!notification.read ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="h-6 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Mark as read
                          </Button>
                        ) : (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            Read
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t p-6 pt-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark All as Read ({unreadCount})
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
