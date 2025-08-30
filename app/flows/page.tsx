"use client";

import {
  Copy,
  Eye,
  Pause,
  Play,
  Plus,
  Settings,
  Trash2,
  Workflow,
} from "lucide-react";

import Link from "next/link";
import { DataTable, type RowAction } from "@/components/data-table";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import type { FlowData } from "@/types/data-table";

export default function FlowsPage() {
  const breadcrumbs = [{ label: "Automation", href: "#" }, { label: "Flows" }];

  // Flow data matching FlowData interface
  const flowsData: FlowData[] = [
    {
      id: "1",
      name: "AI Blog Post Generator",
      description:
        "Generates comprehensive blog posts from topics using GPT-4 and Claude",
      status: "Active",
      trigger: "Manual",
      lastRun: "2024-01-22 15:30",
      totalRuns: 247,
      successRate: "98.8%",
      avgRunTime: "2.3 minutes",
      category: "Content Creation",
      created: "2024-01-01 09:00",
      lastModified: "2024-01-20 14:30",
    },
    {
      id: "2",
      name: "Social Media Content Pipeline",
      description:
        "Creates and schedules social media content across LinkedIn, Twitter, and Facebook",
      status: "Active",
      trigger: "Scheduled",
      lastRun: "2024-01-22 12:00",
      totalRuns: 156,
      successRate: "96.2%",
      avgRunTime: "1.8 minutes",
      category: "Social Media",
      created: "2023-12-15 10:30",
      lastModified: "2024-01-18 11:45",
    },
    {
      id: "3",
      name: "Customer Feedback Analyzer",
      description:
        "Analyzes customer feedback and extracts actionable insights using sentiment analysis",
      status: "Active",
      trigger: "Webhook",
      lastRun: "2024-01-22 16:45",
      totalRuns: 89,
      successRate: "100%",
      avgRunTime: "45 seconds",
      category: "Analytics",
      created: "2024-01-10 13:20",
      lastModified: "2024-01-22 09:15",
    },
    {
      id: "4",
      name: "Email Newsletter Generator",
      description:
        "Compiles weekly newsletter from trending topics and company updates",
      status: "Paused",
      trigger: "Scheduled",
      lastRun: "2024-01-15 10:00",
      totalRuns: 12,
      successRate: "91.7%",
      avgRunTime: "3.1 minutes",
      category: "Email Marketing",
      created: "2024-01-08 16:00",
      lastModified: "2024-01-15 10:30",
    },
    {
      id: "5",
      name: "Competitive Research Flow",
      description:
        "Monitors competitor websites and analyzes pricing, features, and marketing strategies",
      status: "Active",
      trigger: "Scheduled",
      lastRun: "2024-01-22 08:00",
      totalRuns: 43,
      successRate: "95.3%",
      avgRunTime: "4.2 minutes",
      category: "Market Research",
      created: "2024-01-12 11:30",
      lastModified: "2024-01-21 14:20",
    },
    {
      id: "6",
      name: "SEO Content Optimizer",
      description:
        "Optimizes existing content for search engines and suggests improvements",
      status: "Testing",
      trigger: "Manual",
      lastRun: "2024-01-21 14:30",
      totalRuns: 8,
      successRate: "87.5%",
      avgRunTime: "1.9 minutes",
      category: "SEO",
      created: "2024-01-20 09:45",
      lastModified: "2024-01-21 15:00",
    },
    {
      id: "7",
      name: "Press Release Writer",
      description:
        "Creates professional press releases from product announcements and company news",
      status: "Active",
      trigger: "Manual",
      lastRun: "2024-01-19 11:15",
      totalRuns: 5,
      successRate: "100%",
      avgRunTime: "2.7 minutes",
      category: "Public Relations",
      created: "2024-01-15 13:45",
      lastModified: "2024-01-19 11:30",
    },
  ];

  const columns = [
    { key: "name", header: "Flow Name", width: "250px" },
    { key: "status", header: "Status", width: "100px" },
    { key: "category", header: "Category", width: "150px" },
    { key: "trigger", header: "Trigger", width: "100px" },
    { key: "totalRuns", header: "Runs", width: "80px" },
    { key: "successRate", header: "Success Rate", width: "110px" },
    { key: "avgRunTime", header: "Avg Runtime", width: "120px" },
    { key: "lastRun", header: "Last Run", width: "130px" },
    { key: "lastModified", header: "Modified", width: "130px" },
  ];

  const emptyActions = [
    {
      label: "Create Flow",
      icon: <Plus className="h-4 w-4" />,
      href: "/flows/create",
    },
  ];

  const tableActions = (
    <div className="flex items-center gap-2">
      <Button asChild variant="default">
        <Link href="/flows/create">
          <Plus className="h-4 w-4 mr-2" />
          Create Flow
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/flows/settings">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Link>
      </Button>
    </div>
  );

  const handleRowClick = (row: FlowData) => {
    console.log("Clicked flow:", row);
  };

  const rowActions: RowAction<FlowData>[] = [
    {
      label: "View Details",
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: FlowData) => console.log("View flow:", row.name),
    },
    {
      label: "Run Flow",
      icon: <Play className="h-4 w-4" />,
      onClick: (row: FlowData) => console.log("Run flow:", row.name),
    },
    {
      label: "Copy Flow",
      icon: <Copy className="h-4 w-4" />,
      onClick: (row: FlowData) => console.log("Copy flow:", row.name),
    },
    {
      label: "Toggle Status",
      icon: <Pause className="h-4 w-4" />,
      onClick: (row: FlowData) =>
        console.log(
          row.status === "Active" ? "Pause" : "Activate",
          "flow:",
          row.name,
        ),
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: FlowData) => console.log("Delete flow:", row.name),
      variant: "destructive" as const,
    },
  ];

  return (
    <PageLayout
      title="Flows"
      description="Create, manage, and monitor your automated workflows for content generation, analysis, and business processes."
      breadcrumbs={breadcrumbs}
    >
      <DataTable<FlowData>
        columns={columns}
        data={flowsData}
        emptyTitle="No flows configured"
        emptyDescription="Create your first automated flow to streamline content creation and business processes."
        emptyActions={emptyActions}
        emptyIcon={<Workflow className="h-8 w-8 text-muted-foreground" />}
        searchPlaceholder="Search flows by name, category, status, trigger..."
        actions={tableActions}
        onRowClick={handleRowClick}
        rowActions={rowActions}
        pageSize={10}
        searchFields={["name", "category", "status", "trigger"]}
      />
    </PageLayout>
  );
}
