"use client";

import {
  AlertCircle,
  Bell,
  Copy,
  Edit2,
  Eye,
  MessageSquare,
  Plus,
  Settings,
  Volume2,
} from "lucide-react";
import { DataTable, type RowAction } from "@/components/data-table";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import type { NotificationData } from "@/types/data-table";

export default function NotificationsPage() {
  const breadcrumbs = [
    { label: "Configuration", href: "#" },
    { label: "Integrations", href: "/integrations" },
    { label: "Notifications" },
  ];

  // Comprehensive notification channels data - ways to alert users about flow status
  const notificationsData = [
    {
      id: "1",
      name: "Primary Email Alerts",
      displayName: "notifications@revnix.com",
      type: "Email",
      channel: "SMTP",
      status: "Active",
      priority: "High",
      config: {
        server: "smtp.gmail.com",
        port: 587,
        encryption: "TLS",
        username: "notifications@revnix.com",
      },
      triggers: [
        "Flow requires human approval",
        "Content generation failed",
        "Budget threshold exceeded",
        "API rate limit reached",
        "Security violation detected",
      ],
      recipients: ["sarah.johnson@revnix.com", "mike.chen@revnix.com"],
      templateId: "flow-status-email",
      deliveryRate: "99.2%",
      avgDeliveryTime: "2.3s",
      sentToday: 47,
      sentThisMonth: 1342,
      lastSent: "2024-01-22 16:45",
      lastMessage: "Flow 'AI Blog Post Generator' requires human approval",
      createdBy: "Sarah Johnson",
      created: "2024-01-01 10:00",
      updated: "2024-01-20 14:30",
      tags: ["primary", "critical", "smtp"],
    },
    {
      id: "2",
      name: "Slack Team Notifications",
      displayName: "#ai-workflows",
      type: "Slack",
      channel: "Webhook",
      status: "Active",
      priority: "High",
      config: {
        webhookUrl: "https://hooks.slack.com/services/T12.../B12.../abc123",
        channel: "#ai-workflows",
        username: "WRextBot",
        iconEmoji: ":robot_face:",
      },
      triggers: [
        "Content ready for review",
        "Flow completed successfully",
        "Human intervention required",
        "Daily performance summary",
        "Error threshold breached",
      ],
      recipients: ["@channel", "@sarah.johnson", "@mike.chen"],
      templateId: "slack-flow-alert",
      deliveryRate: "100%",
      avgDeliveryTime: "0.8s",
      sentToday: 23,
      sentThisMonth: 678,
      lastSent: "2024-01-22 15:30",
      lastMessage:
        "🎉 Flow 'Newsletter Content Creator' completed successfully!",
      createdBy: "Mike Chen",
      created: "2024-01-05 09:15",
      updated: "2024-01-22 11:20",
      tags: ["slack", "team", "real-time"],
    },
    {
      id: "3",
      name: "SMS Critical Alerts",
      displayName: "+1 (555) 123-4567",
      type: "SMS",
      channel: "Twilio",
      status: "Active",
      priority: "Critical",
      config: {
        accountSid: "ACa1b2c3...",
        authToken: "***hidden***",
        fromNumber: "+1-555-WREXT-AI",
        service: "Twilio",
      },
      triggers: [
        "System outage detected",
        "Security breach attempt",
        "Critical flow failure",
        "Budget overspend alert",
        "API service disruption",
      ],
      recipients: ["+1-555-123-4567", "+1-555-987-6543"],
      templateId: "sms-critical-alert",
      deliveryRate: "98.7%",
      avgDeliveryTime: "1.2s",
      sentToday: 3,
      sentThisMonth: 45,
      lastSent: "2024-01-21 08:30",
      lastMessage: "CRITICAL: Budget threshold 90% exceeded. Review spending.",
      createdBy: "Alex Rivera",
      created: "2024-01-08 11:30",
      updated: "2024-01-19 16:45",
      tags: ["sms", "critical", "mobile"],
    },
    {
      id: "4",
      name: "Microsoft Teams Updates",
      displayName: "AI Workflows Team",
      type: "Teams",
      channel: "Webhook",
      status: "Active",
      priority: "Medium",
      config: {
        webhookUrl: "https://outlook.office.com/webhook/abc-123...",
        teamName: "AI Workflows Team",
        channelName: "General",
      },
      triggers: [
        "Weekly performance report",
        "Flow schedule updates",
        "Content calendar changes",
        "Team member mentions",
        "Workflow optimizations",
      ],
      recipients: ["AI Workflows Team"],
      templateId: "teams-update-card",
      deliveryRate: "97.5%",
      avgDeliveryTime: "1.5s",
      sentToday: 12,
      sentThisMonth: 234,
      lastSent: "2024-01-22 14:20",
      lastMessage:
        "📊 Weekly Performance: 1,247 contents generated, 94% success rate",
      createdBy: "Jennifer Taylor",
      created: "2024-01-12 16:40",
      updated: "2024-01-21 10:15",
      tags: ["teams", "weekly", "performance"],
    },
    {
      id: "5",
      name: "Discord Community Bot",
      displayName: "#wrext-alerts",
      type: "Discord",
      channel: "Bot",
      status: "Active",
      priority: "Low",
      config: {
        botToken: "***hidden***",
        channelId: "1234567890123456789",
        guildId: "9876543210987654321",
        botName: "WRext Assistant",
      },
      triggers: [
        "New feature announcements",
        "Community content highlights",
        "User milestone celebrations",
        "Beta feature releases",
        "Maintenance updates",
      ],
      recipients: ["Community Members"],
      templateId: "discord-embed",
      deliveryRate: "99.8%",
      avgDeliveryTime: "0.5s",
      sentToday: 8,
      sentThisMonth: 156,
      lastSent: "2024-01-22 13:45",
      lastMessage: "🎉 New feature: Social media scheduling is now live!",
      createdBy: "David Park",
      created: "2024-01-10 14:20",
      updated: "2024-01-22 09:30",
      tags: ["discord", "community", "announcements"],
    },
    {
      id: "6",
      name: "Custom Webhook Integration",
      displayName: "Internal Dashboard API",
      type: "Webhook",
      channel: "HTTP",
      status: "Active",
      priority: "Medium",
      config: {
        url: "https://dashboard.revnix.com/api/webhooks/notifications",
        method: "POST",
        headers: {
          Authorization: "Bearer ***hidden***",
          "Content-Type": "application/json",
        },
        timeout: 10000,
      },
      triggers: [
        "Real-time analytics updates",
        "Content performance metrics",
        "System health checks",
        "Usage statistics changes",
        "Configuration modifications",
      ],
      recipients: ["Internal Dashboard"],
      templateId: "webhook-payload",
      deliveryRate: "96.8%",
      avgDeliveryTime: "0.9s",
      sentToday: 89,
      sentThisMonth: 2341,
      lastSent: "2024-01-22 16:50",
      lastMessage: "Analytics update: 1,247 requests processed in last hour",
      createdBy: "Carlos Mendez",
      created: "2024-01-15 13:45",
      updated: "2024-01-21 17:20",
      tags: ["webhook", "analytics", "internal"],
    },
    {
      id: "7",
      name: "Push Notifications Mobile",
      displayName: "WRext Mobile App",
      type: "Push",
      channel: "Firebase",
      status: "Testing",
      priority: "Medium",
      config: {
        serverKey: "***hidden***",
        projectId: "wrext-mobile-app",
        service: "Firebase Cloud Messaging",
      },
      triggers: [
        "Content approval requests",
        "Mobile workflow completions",
        "Urgent review notifications",
        "Time-sensitive alerts",
        "Mobile app updates",
      ],
      recipients: ["Mobile App Users"],
      templateId: "push-notification",
      deliveryRate: "89.3%",
      avgDeliveryTime: "2.1s",
      sentToday: 15,
      sentThisMonth: 234,
      lastSent: "2024-01-22 12:20",
      lastMessage:
        "✨ Your content 'Social Media Post #47' is ready for review!",
      createdBy: "Emma Davis",
      created: "2024-01-18 15:00",
      updated: "2024-01-22 08:45",
      tags: ["mobile", "push", "firebase"],
    },
    {
      id: "8",
      name: "Email Digest Weekly",
      displayName: "weekly-digest@revnix.com",
      type: "Email",
      channel: "SMTP",
      status: "Active",
      priority: "Low",
      config: {
        server: "smtp.revnix.com",
        port: 465,
        encryption: "SSL",
        schedule: "Every Monday 9:00 AM",
      },
      triggers: [
        "Weekly performance summary",
        "Content generation statistics",
        "Cost analysis reports",
        "Top performing content",
        "Optimization recommendations",
      ],
      recipients: ["leadership@revnix.com", "team@revnix.com"],
      templateId: "weekly-digest-html",
      deliveryRate: "100%",
      avgDeliveryTime: "3.2s",
      sentToday: 0,
      sentThisMonth: 4,
      lastSent: "2024-01-22 09:00",
      lastMessage: "📈 Weekly Digest: 2,341 contents generated, $156.78 spent",
      createdBy: "Amanda Foster",
      created: "2024-01-01 15:00",
      updated: "2024-01-22 09:00",
      tags: ["weekly", "digest", "leadership"],
    },
    {
      id: "9",
      name: "PagerDuty Incidents",
      displayName: "WRext AI Service",
      type: "PagerDuty",
      channel: "API",
      status: "Active",
      priority: "Critical",
      config: {
        integrationKey: "***hidden***",
        serviceId: "PABCDEF",
        escalationPolicy: "P123ABC",
      },
      triggers: [
        "System downtime detected",
        "API failure threshold exceeded",
        "Critical security events",
        "Data loss incidents",
        "Performance degradation",
      ],
      recipients: ["On-call Engineers"],
      templateId: "pagerduty-incident",
      deliveryRate: "100%",
      avgDeliveryTime: "0.3s",
      sentToday: 1,
      sentThisMonth: 8,
      lastSent: "2024-01-21 02:30",
      lastMessage: "🚨 INCIDENT: API response time exceeded 5s threshold",
      createdBy: "Marcus Johnson",
      created: "2023-12-15 10:20",
      updated: "2024-01-21 02:35",
      tags: ["pagerduty", "incidents", "oncall"],
    },
    {
      id: "10",
      name: "In-App Toast Notifications",
      displayName: "Web Dashboard UI",
      type: "In-App",
      channel: "WebSocket",
      status: "Active",
      priority: "Low",
      config: {
        websocketEndpoint: "wss://api.revnix.com/notifications",
        reconnectInterval: 5000,
        maxReconnectAttempts: 10,
      },
      triggers: [
        "Real-time flow updates",
        "Instant success notifications",
        "Quick error alerts",
        "Progress indicators",
        "User action confirmations",
      ],
      recipients: ["Active Dashboard Users"],
      templateId: "toast-notification",
      deliveryRate: "99.9%",
      avgDeliveryTime: "0.1s",
      sentToday: 342,
      sentThisMonth: 8765,
      lastSent: "2024-01-22 16:55",
      lastMessage:
        "✅ Flow 'Twitter Thread Storyteller' completed successfully",
      createdBy: "Robert Kim",
      created: "2023-11-01 08:00",
      updated: "2024-01-22 16:55",
      tags: ["in-app", "real-time", "websocket"],
    },
  ];

  const columns = [
    { key: "name", header: "Channel Name", width: "220px" },
    { key: "type", header: "Type", width: "100px" },
    { key: "channel", header: "Channel", width: "120px" },
    { key: "status", header: "Status", width: "100px" },
    { key: "priority", header: "Priority", width: "100px" },
    { key: "deliveryRate", header: "Delivery Rate", width: "120px" },
    { key: "sentThisMonth", header: "Monthly Sent", width: "120px" },
    { key: "lastSent", header: "Last Sent", width: "130px" },
  ];

  const emptyActions = [
    {
      label: "Add Channel",
      icon: <Plus className="h-4 w-4" />,
      href: "/notifications/add",
    },
  ];

  const tableActions = (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Add Channel
    </Button>
  );

  // Row click handler
  const handleRowClick = (row: NotificationData) => {
    console.log("Viewing channel:", row.name);
    // In a real app, you'd navigate to `/notifications/${row.id}`
  };

  // Custom row actions specific to notification channels
  const rowActions: RowAction<NotificationData>[] = [
    {
      label: "View Details",
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: NotificationData) =>
        console.log("View channel:", row.name),
    },
    {
      label: "Test Channel",
      icon: <Volume2 className="h-4 w-4" />,
      onClick: (row: NotificationData) =>
        console.log("Test channel:", row.name),
    },
    {
      label: "Configure",
      icon: <Settings className="h-4 w-4" />,
      onClick: (row: NotificationData) =>
        console.log("Configure channel:", row.name),
    },
    {
      label: "View Logs",
      icon: <MessageSquare className="h-4 w-4" />,
      onClick: (row: NotificationData) => console.log("View logs:", row.name),
    },
    {
      label: "Duplicate Channel",
      icon: <Copy className="h-4 w-4" />,
      onClick: (row: NotificationData) =>
        console.log("Duplicate channel:", row.name),
    },
    {
      label: "Edit Channel",
      icon: <Edit2 className="h-4 w-4" />,
      onClick: (row: NotificationData) =>
        console.log("Edit channel:", row.name),
    },
    {
      label: "Disable Channel",
      icon: <AlertCircle className="h-4 w-4" />,
      onClick: (row: NotificationData) =>
        console.log("Disable channel:", row.name),
      variant: "destructive" as const,
    },
  ];

  return (
    <PageLayout
      title="Notifications"
      description="Configure notification channels for Human-in-the-Loop workflow interactions and alerts."
      breadcrumbs={breadcrumbs}
    >
      <DataTable<NotificationData>
        columns={columns}
        // biome-ignore lint/suspicious/noExplicitAny: Sample data with flexible structure
        data={notificationsData as any}
        emptyTitle="No notification channels configured"
        emptyDescription="Set up notification channels to receive alerts when flows require human intervention or approval."
        emptyActions={emptyActions}
        emptyIcon={<Bell className="h-8 w-8 text-muted-foreground" />}
        searchPlaceholder="Search channels by name, type, status..."
        actions={tableActions}
        onRowClick={handleRowClick}
        rowActions={rowActions}
        pageSize={10}
        searchFields={["name", "type", "channel", "status", "priority", "tags"]}
      />
    </PageLayout>
  );
}
