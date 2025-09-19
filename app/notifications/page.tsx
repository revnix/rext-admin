"use client";

import {
  Bell,
  Edit3,
  Eye,
  Plus,
  Settings,
  TestTube,
  Trash2,
} from "lucide-react";

import Link from "next/link";
import { DataTable } from "@/components/data-table";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import type { NotificationData, RowAction } from "@/types/data-table";

export default function NotificationsPage() {
  const breadcrumbs = [
    { label: "Configuration", href: "#" },
    { label: "Notifications" },
  ];

  // Notifications data matching NotificationData interface
  const notificationsData: NotificationData[] = [
    {
      id: "1",
      name: "Email Alerts",
      type: "Email",
      status: "Active",
      lastNotification: "2024-01-22 15:30",
      totalNotifications: 247,
      successRate: "98.8%",
      description: "Email notifications for flow completions and errors",
      platform: "SMTP",
      configuration: {
        email: {
          recipients: ["admin@revnix.com", "alerts@revnix.com"],
          subject: "Flow Notification",
          template: "default",
        },
        enabled: true,
        retryCount: 3,
        timeout: 30000,
      },
    },
    {
      id: "2",
      name: "Slack Integration",
      type: "Webhook",
      status: "Active",
      lastNotification: "2024-01-22 12:45",
      totalNotifications: 156,
      successRate: "96.2%",
      description: "Slack channel notifications for important events",
      platform: "Slack",
      configuration: {
        slack: {
          channel: "#alerts",
          webhook: "https://hooks.slack.com/services/...",
          mentions: ["@channel"],
        },
        enabled: true,
        retryCount: 2,
      },
    },
    {
      id: "3",
      name: "Discord Webhook",
      type: "Webhook",
      status: "Inactive",
      lastNotification: "2024-01-20 09:15",
      totalNotifications: 43,
      successRate: "91.7%",
      description: "Discord server notifications for team updates",
      platform: "Discord",
      configuration: {
        discord: {
          webhookUrl: "https://discord.com/api/webhooks/...",
          username: "Wrext Notifications",
          avatarUrl: "https://example.com/avatar.png",
        },
        enabled: false,
        retryCount: 1,
      },
    },
    {
      id: "4",
      name: "SMS Alerts",
      type: "SMS",
      status: "Active",
      lastNotification: "2024-01-21 18:30",
      totalNotifications: 12,
      successRate: "100%",
      description: "Critical error SMS notifications",
      platform: "Twilio",
      configuration: {
        sms: {
          phoneNumbers: ["+1987654321"],
          provider: "Twilio",
        },
        enabled: true,
        retryCount: 1,
        timeout: 10000,
      },
    },
    {
      id: "5",
      name: "Microsoft Teams",
      type: "Webhook",
      status: "Testing",
      lastNotification: "2024-01-22 10:20",
      totalNotifications: 8,
      successRate: "87.5%",
      description: "Teams channel for project notifications",
      platform: "Microsoft Teams",
      configuration: {
        webhook: {
          url: "https://outlook.office.com/webhook/...",
          method: "POST",
        },
        enabled: true,
        retryCount: 2,
      },
    },
  ];

  const columns = [
    { key: "name", header: "Channel Name", width: "200px" },
    { key: "type", header: "Type", width: "100px" },
    { key: "platform", header: "Platform", width: "120px" },
    { key: "status", header: "Status", width: "100px" },
    { key: "totalNotifications", header: "Sent", width: "80px" },
    { key: "successRate", header: "Success Rate", width: "110px" },
    { key: "lastNotification", header: "Last Sent", width: "130px" },
  ];

  const emptyActions = [
    {
      label: "Add Channel",
      icon: <Plus className="h-4 w-4" />,
      href: "/notifications/create",
    },
  ];

  const tableActions = (
    <div className="flex items-center gap-2">
      <Button asChild variant="default">
        <Link href="/notifications/create">
          <Plus className="h-4 w-4 mr-2" />
          Add Channel
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/notifications/settings">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Link>
      </Button>
    </div>
  );

  const rowActions: RowAction<NotificationData>[] = [
    {
      label: "View Details",
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: NotificationData) =>
        console.log("View notification:", row.name),
    },
    {
      label: "Edit Channel",
      icon: <Edit3 className="h-4 w-4" />,
      onClick: (row: NotificationData) =>
        console.log("Edit notification:", row.name),
    },
    {
      label: "Test Channel",
      icon: <TestTube className="h-4 w-4" />,
      onClick: (row: NotificationData) =>
        console.log("Test notification:", row.name),
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: NotificationData) =>
        console.log("Delete notification:", row.name),
      variant: "destructive" as const,
    },
  ];

  return (
    <PageLayout
      title="Notifications"
      description="Configure notification channels to receive alerts when flows require human intervention or approval."
      breadcrumbs={breadcrumbs}
    >
      <DataTable<NotificationData>
        columns={columns}
        data={notificationsData}
        emptyTitle="No notification channels configured"
        emptyDescription="Set up notification channels to receive alerts when flows require human intervention or approval."
        emptyActions={emptyActions}
        emptyIcon={<Bell className="h-8 w-8 text-muted-foreground" />}
        searchPlaceholder="Search channels by name, type, platform, status..."
        actions={tableActions}
        rowActions={rowActions}
        pageSize={10}
        searchFields={["name", "type", "platform", "status"]}
      />
    </PageLayout>
  );
}
