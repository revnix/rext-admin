"use client";

import {
  AlertTriangle,
  CheckCircle,
  Copy,
  Edit2,
  ExternalLink,
  Eye,
  Link as LinkIcon,
  Play,
  Plus,
  RefreshCw,
  Settings,
  Share2,
  Trash2,
  TrendingUp,
  Unlink,
} from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";

export default function SocialAccountsPage() {
  const breadcrumbs = [
    { label: "Configuration", href: "#" },
    { label: "Integrations", href: "/integrations" },
    { label: "Social Accounts" },
  ];

  // Comprehensive social accounts data - connected platform accounts
  const socialAccountsData = [
    {
      id: "1",
      platform: "LinkedIn",
      platformIcon: "🔗",
      account: "@revnix-solutions",
      accountName: "Revnix Solutions",
      accountType: "Company Page",
      status: "Connected",
      connectionHealth: "Excellent",
      authStatus: "Valid",
      followers: "12.4K",
      followersCount: 12400,
      engagement: "3.2%",
      postsPublished: 47,
      lastSync: "2024-01-22 16:30",
      connected: "2023-11-15 09:00",
      connectedBy: "Sarah Johnson",
      permissions: ["Read", "Write", "Analytics"],
      autoPublish: true,
      schedulingEnabled: true,
      analyticsEnabled: true,
      apiRateLimit: "500/hour",
      apiUsage: "23%",
      lastPost: "2024-01-22 10:00",
      lastPostPerformance: {
        views: 2847,
        likes: 156,
        comments: 23,
        shares: 42
      },
      flows: ["Social Media Content Pipeline", "LinkedIn Marketing"],
      tags: ["b2b", "professional", "company"],
    },
    {
      id: "2",
      platform: "Twitter",
      platformIcon: "𝕏",
      account: "@revnix_ai",
      accountName: "Revnix AI Solutions",
      accountType: "Business Account",
      status: "Connected",
      connectionHealth: "Good",
      authStatus: "Valid",
      followers: "8.7K",
      followersCount: 8700,
      engagement: "2.8%",
      postsPublished: 134,
      lastSync: "2024-01-22 15:45",
      connected: "2023-10-20 14:30",
      connectedBy: "Mike Chen",
      permissions: ["Read", "Write", "Analytics"],
      autoPublish: true,
      schedulingEnabled: true,
      analyticsEnabled: true,
      apiRateLimit: "300/15min",
      apiUsage: "67%",
      lastPost: "2024-01-22 13:30",
      lastPostPerformance: {
        views: 1234,
        likes: 89,
        retweets: 23,
        replies: 12
      },
      flows: ["Twitter Thread Storyteller", "Social Media Content Pipeline"],
      tags: ["tech", "ai", "twitter"],
    },
    {
      id: "3",
      platform: "Instagram",
      platformIcon: "📷",
      account: "@revnix_design",
      accountName: "Revnix Design Studio",
      accountType: "Creator Account",
      status: "Connected",
      connectionHealth: "Good",
      authStatus: "Valid",
      followers: "5.2K",
      followersCount: 5200,
      engagement: "4.1%",
      postsPublished: 23,
      lastSync: "2024-01-22 12:20",
      connected: "2024-01-05 11:45",
      connectedBy: "David Park",
      permissions: ["Read", "Write", "Stories"],
      autoPublish: false,
      schedulingEnabled: true,
      analyticsEnabled: true,
      apiRateLimit: "200/hour",
      apiUsage: "12%",
      lastPost: "2024-01-21 15:00",
      lastPostPerformance: {
        views: 892,
        likes: 167,
        comments: 34,
        saves: 45
      },
      flows: ["Visual Content Creator", "Instagram Stories"],
      tags: ["visual", "design", "creative"],
    },
    {
      id: "4",
      platform: "Facebook",
      platformIcon: "📘",
      account: "Revnix Solutions",
      accountName: "Revnix Solutions Official",
      accountType: "Business Page",
      status: "Connected",
      connectionHealth: "Fair",
      authStatus: "Expires Soon",
      followers: "3.8K",
      followersCount: 3800,
      engagement: "1.9%",
      postsPublished: 18,
      lastSync: "2024-01-22 08:15",
      connected: "2023-09-10 16:20",
      connectedBy: "Lisa Wong",
      permissions: ["Read", "Write", "Analytics"],
      autoPublish: true,
      schedulingEnabled: true,
      analyticsEnabled: false,
      apiRateLimit: "600/hour",
      apiUsage: "8%",
      lastPost: "2024-01-20 14:30",
      lastPostPerformance: {
        views: 567,
        likes: 45,
        comments: 8,
        shares: 12
      },
      flows: ["Facebook Marketing", "Social Media Content Pipeline"],
      tags: ["community", "business", "facebook"],
    },
    {
      id: "5",
      platform: "YouTube",
      platformIcon: "📺",
      account: "@RevnixTech",
      accountName: "Revnix Technology Channel",
      accountType: "Brand Channel",
      status: "Connected",
      connectionHealth: "Excellent",
      authStatus: "Valid",
      followers: "15.6K",
      followersCount: 15600,
      engagement: "6.7%",
      postsPublished: 12,
      lastSync: "2024-01-22 17:00",
      connected: "2023-08-15 10:30",
      connectedBy: "Carlos Mendez",
      permissions: ["Read", "Write", "Analytics", "Live"],
      autoPublish: false,
      schedulingEnabled: true,
      analyticsEnabled: true,
      apiRateLimit: "10000/day",
      apiUsage: "3%",
      lastPost: "2024-01-18 20:00",
      lastPostPerformance: {
        views: 4523,
        likes: 234,
        comments: 67,
        subscribers: 45
      },
      flows: ["YouTube Script Writer", "Video Content Creator"],
      tags: ["video", "education", "tech"],
    },
    {
      id: "6",
      platform: "TikTok",
      platformIcon: "🎵",
      account: "@revnix_tips",
      accountName: "Revnix Quick Tips",
      accountType: "Pro Account",
      status: "Connection Error",
      connectionHealth: "Poor",
      authStatus: "Invalid",
      followers: "2.1K",
      followersCount: 2100,
      engagement: "8.9%",
      postsPublished: 8,
      lastSync: "2024-01-20 09:30",
      connected: "2024-01-12 13:45",
      connectedBy: "Amanda Foster",
      permissions: ["Read", "Write"],
      autoPublish: false,
      schedulingEnabled: false,
      analyticsEnabled: false,
      apiRateLimit: "100/day",
      apiUsage: "0%",
      lastPost: "2024-01-19 16:45",
      lastPostPerformance: {
        views: 1567,
        likes: 134,
        comments: 45,
        shares: 23
      },
      flows: ["Short-form Video Creator", "TikTok Marketing"],
      tags: ["short-form", "viral", "tips"],
      errorMessage: "Authentication token expired. Please reconnect.",
    },
    {
      id: "7",
      platform: "Pinterest",
      platformIcon: "📌",
      account: "Revnix Design Ideas",
      accountName: "Revnix Design Studio",
      accountType: "Business Account",
      status: "Connected",
      connectionHealth: "Good",
      authStatus: "Valid",
      followers: "4.3K",
      followersCount: 4300,
      engagement: "3.4%",
      postsPublished: 34,
      lastSync: "2024-01-22 11:45",
      connected: "2023-12-20 15:20",
      connectedBy: "Emma Davis",
      permissions: ["Read", "Write", "Analytics"],
      autoPublish: true,
      schedulingEnabled: true,
      analyticsEnabled: true,
      apiRateLimit: "1000/day",
      apiUsage: "15%",
      lastPost: "2024-01-21 12:30",
      lastPostPerformance: {
        views: 892,
        saves: 67,
        comments: 12,
        clicks: 34
      },
      flows: ["Visual Content Creator", "Pinterest Marketing"],
      tags: ["visual", "inspiration", "design"],
    },
    {
      id: "8",
      platform: "Reddit",
      platformIcon: "🤖",
      account: "u/RevnixSolutions",
      accountName: "Revnix Solutions",
      accountType: "User Account",
      status: "Connected",
      connectionHealth: "Good",
      authStatus: "Valid",
      followers: "892",
      followersCount: 892,
      engagement: "12.3%",
      postsPublished: 15,
      lastSync: "2024-01-22 14:20",
      connected: "2024-01-08 09:15",
      connectedBy: "Jennifer Taylor",
      permissions: ["Read", "Write"],
      autoPublish: false,
      schedulingEnabled: false,
      analyticsEnabled: false,
      apiRateLimit: "60/minute",
      apiUsage: "5%",
      lastPost: "2024-01-22 10:45",
      lastPostPerformance: {
        upvotes: 87,
        comments: 23,
        awards: 2,
        crossposts: 4
      },
      flows: ["Community Content Generator", "Reddit Marketing"],
      tags: ["community", "discussion", "tech"],
    },
    {
      id: "9",
      platform: "Medium",
      platformIcon: "✍️",
      account: "@revnix-solutions",
      accountName: "Revnix Solutions",
      accountType: "Publication",
      status: "Paused",
      connectionHealth: "Good",
      authStatus: "Valid",
      followers: "1.2K",
      followersCount: 1200,
      engagement: "5.8%",
      postsPublished: 6,
      lastSync: "2024-01-15 16:30",
      connected: "2023-11-30 12:00",
      connectedBy: "Marcus Johnson",
      permissions: ["Read", "Write"],
      autoPublish: false,
      schedulingEnabled: false,
      analyticsEnabled: true,
      apiRateLimit: "100/day",
      apiUsage: "0%",
      lastPost: "2024-01-12 14:20",
      lastPostPerformance: {
        views: 2341,
        claps: 156,
        responses: 34,
        highlights: 67
      },
      flows: ["AI Blog Post Generator", "Long-form Content"],
      tags: ["blogging", "thought leadership", "articles"],
    },
    {
      id: "10",
      platform: "Discord",
      platformIcon: "🎮",
      account: "Revnix Community",
      accountName: "Revnix Tech Community",
      accountType: "Server Bot",
      status: "Connected",
      connectionHealth: "Excellent",
      authStatus: "Valid",
      followers: "567",
      followersCount: 567,
      engagement: "34.2%",
      postsPublished: 89,
      lastSync: "2024-01-22 16:45",
      connected: "2023-10-05 14:45",
      connectedBy: "Robert Kim",
      permissions: ["Read", "Write", "Manage"],
      autoPublish: true,
      schedulingEnabled: false,
      analyticsEnabled: false,
      apiRateLimit: "50/second",
      apiUsage: "12%",
      lastPost: "2024-01-22 15:30",
      lastPostPerformance: {
        reactions: 45,
        replies: 23,
        mentions: 12,
        pins: 2
      },
      flows: ["Community Announcements", "Discord Bot"],
      tags: ["community", "discord", "real-time"],
    }
  ];

  const columns = [
    { key: "platform", header: "Platform", width: "120px" },
    { key: "account", header: "Account", width: "200px" },
    { key: "status", header: "Status", width: "120px" },
    { key: "connectionHealth", header: "Health", width: "100px" },
    { key: "followers", header: "Followers", width: "100px" },
    { key: "engagement", header: "Engagement", width: "110px" },
    { key: "postsPublished", header: "Posts", width: "80px" },
    { key: "lastSync", header: "Last Sync", width: "130px" },
    { key: "connected", header: "Connected", width: "120px" },
  ];

  const emptyActions = [
    { label: "Connect Account", icon: <LinkIcon className="h-4 w-4" />, href: "/social-accounts/connect" },
  ];

  const tableActions = (
    <Button>
      <LinkIcon className="h-4 w-4 mr-2" />
      Connect Account
    </Button>
  );

  // Row click handler
  const handleRowClick = (row: Record<string, any>) => {
    console.log("Viewing account:", row.platform, row.account);
    // In a real app, you'd navigate to `/social-accounts/${row.id}`
  };

  // Custom row actions specific to social accounts
  const rowActions = [
    {
      label: "View Details",
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: Record<string, any>) => console.log("View account:", row.platform, row.account),
    },
    {
      label: "View Analytics",
      icon: <TrendingUp className="h-4 w-4" />,
      onClick: (row: Record<string, any>) => console.log("View analytics:", row.platform),
    },
    {
      label: "Test Connection",
      icon: <RefreshCw className="h-4 w-4" />,
      onClick: (row: Record<string, any>) => console.log("Test connection:", row.platform),
    },
    {
      label: "Edit Settings",
      icon: <Settings className="h-4 w-4" />,
      onClick: (row: Record<string, any>) => console.log("Edit settings:", row.platform),
    },
    {
      label: "View Posts",
      icon: <ExternalLink className="h-4 w-4" />,
      onClick: (row: Record<string, any>) => console.log("View posts:", row.platform),
    },
    {
      label: "Duplicate Config",
      icon: <Copy className="h-4 w-4" />,
      onClick: (row: Record<string, any>) => console.log("Duplicate config:", row.platform),
    },
    {
      label: "Pause/Resume",
      icon: <Play className="h-4 w-4" />,
      onClick: (row: Record<string, any>) => console.log(row.status === "Paused" ? "Resume" : "Pause", "account:", row.platform),
    },
    {
      label: "Disconnect",
      icon: <Unlink className="h-4 w-4" />,
      onClick: (row: Record<string, any>) => console.log("Disconnect account:", row.platform),
      variant: "destructive" as const,
    },
  ];

  return (
    <PageLayout
      title="Social Accounts"
      description="Connect and manage your social media accounts for seamless content publishing and engagement."
      breadcrumbs={breadcrumbs}
    >
      <DataTable
        columns={columns}
        data={socialAccountsData}
        emptyTitle="No social accounts connected"
        emptyDescription="Start by connecting your first social media account to begin publishing and managing content."
        emptyActions={emptyActions}
        emptyIcon={<Share2 className="h-8 w-8 text-muted-foreground" />}
        searchPlaceholder="Search accounts by platform, handle, status..."
        actions={tableActions}
        onRowClick={handleRowClick}
        rowActions={rowActions}
        pageSize={10}
        searchFields={["platform", "account", "accountName", "status", "connectionHealth", "tags"]}
      />
    </PageLayout>
  );
}
