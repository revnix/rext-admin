"use client";

import {
  LinkIcon,
  MoreVertical,
  Plus,
  Settings,
  Share2,
  Unlink,
} from "lucide-react";

import Link from "next/link";
import { DataTable, type RowAction } from "@/components/data-table";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import type { SocialAccountData } from "@/types/data-table";

export default function SocialAccountsPage() {
  const breadcrumbs = [
    { label: "Configuration", href: "#" },
    { label: "Integrations", href: "/integrations" },
    { label: "Social Accounts" },
  ];

  // Comprehensive social accounts data - connected platform accounts
  const socialAccountsData: SocialAccountData[] = [
    {
      id: "1",
      platform: "LinkedIn",
      account: "@revnix-solutions",
      status: "Connected",
      connected: "2023-11-15 09:00",
      lastPost: "2024-01-22 10:00",
      followers: "12.4K",
      engagement: "3.2%",
      posts: 47,
      reach: "2.8K",
    },
    {
      id: "2",
      platform: "Twitter",
      account: "@revnix_ai",
      status: "Connected",
      connected: "2023-10-20 14:30",
      lastPost: "2024-01-22 13:30",
      followers: "8.7K",
      engagement: "2.8%",
      posts: 134,
      reach: "1.2K",
    },
    {
      id: "3",
      platform: "Instagram",
      account: "@revnix_design",
      status: "Connected",
      connected: "2024-01-05 11:45",
      lastPost: "2024-01-21 15:00",
      followers: "5.2K",
      engagement: "4.1%",
      posts: 23,
      reach: "892",
    },
    {
      id: "4",
      platform: "Facebook",
      account: "Revnix Solutions",
      status: "Connected",
      connected: "2023-09-10 16:20",
      lastPost: "2024-01-20 14:30",
      followers: "3.8K",
      engagement: "1.9%",
      posts: 18,
      reach: "567",
    },
    {
      id: "5",
      platform: "YouTube",
      account: "@RevnixTech",
      status: "Connected",
      connected: "2023-08-15 10:30",
      lastPost: "2024-01-18 20:00",
      followers: "15.6K",
      engagement: "6.7%",
      posts: 12,
      reach: "4.5K",
    },
    {
      id: "6",
      platform: "TikTok",
      account: "@revnix_tips",
      status: "Connection Error",
      connected: "2024-01-12 13:45",
      lastPost: "2024-01-19 16:45",
      followers: "2.1K",
      engagement: "8.9%",
      posts: 8,
      reach: "1.6K",
    },
    {
      id: "7",
      platform: "Pinterest",
      account: "Revnix Design Ideas",
      status: "Connected",
      connected: "2023-12-20 15:20",
      lastPost: "2024-01-22 09:15",
      followers: "4.3K",
      engagement: "3.4%",
      posts: 34,
      reach: "723",
    },
    {
      id: "8",
      platform: "Snapchat",
      account: "@revnixsnaps",
      status: "Connected",
      connected: "2024-01-08 12:10",
      lastPost: "2024-01-22 12:30",
      followers: "1.8K",
      engagement: "12.3%",
      posts: 15,
      reach: "234",
    },
    {
      id: "9",
      platform: "Discord",
      account: "Revnix Community",
      status: "Connected",
      connected: "2023-07-12 19:30",
      lastPost: "2024-01-22 15:30",
      followers: "892",
      engagement: "25.4%",
      posts: 67,
      reach: "456",
    },
  ];

  const columns = [
    { key: "platform", header: "Platform", width: "120px" },
    { key: "account", header: "Account", width: "200px" },
    { key: "status", header: "Status", width: "120px" },
    { key: "followers", header: "Followers", width: "100px" },
    { key: "engagement", header: "Engagement", width: "110px" },
    { key: "posts", header: "Posts", width: "80px" },
    { key: "lastPost", header: "Last Post", width: "130px" },
    { key: "connected", header: "Connected", width: "120px" },
    { key: "reach", header: "Reach", width: "100px" },
  ];

  const emptyActions = [
    {
      label: "Connect Account",
      icon: <LinkIcon className="h-4 w-4" />,
      href: "/social-accounts/connect",
    },
  ];

  const tableActions = (
    <div className="flex items-center gap-2">
      <Button asChild variant="default">
        <Link href="/social-accounts/connect">
          <Plus className="h-4 w-4 mr-2" />
          Connect Account
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/social-accounts/settings">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Link>
      </Button>
    </div>
  );

  const handleRowClick = (row: SocialAccountData) => {
    console.log("Clicked row:", row);
  };

  const rowActions: RowAction<SocialAccountData>[] = [
    {
      label: "Configure",
      icon: <Settings className="h-4 w-4" />,
      onClick: (row: SocialAccountData) =>
        console.log("Configure account:", row.platform),
    },
    {
      label: "View Analytics",
      icon: <MoreVertical className="h-4 w-4" />,
      onClick: (row: SocialAccountData) =>
        console.log("View analytics for:", row.platform),
    },
    {
      label: "Share",
      icon: <Share2 className="h-4 w-4" />,
      onClick: (row: SocialAccountData) =>
        console.log("Share account:", row.platform),
    },
    {
      label: "Disconnect",
      icon: <Unlink className="h-4 w-4" />,
      onClick: (row: SocialAccountData) =>
        console.log("Disconnect account:", row.platform),
      variant: "destructive" as const,
    },
  ];

  return (
    <PageLayout
      title="Social Accounts"
      description="Connect and manage your social media accounts for seamless content publishing and engagement."
      breadcrumbs={breadcrumbs}
    >
      <DataTable<SocialAccountData>
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
        searchFields={["platform", "account", "status"]}
      />
    </PageLayout>
  );
}
