"use client";

import { Edit3, Eye, Play, Plus, Settings, Shield, Trash2 } from "lucide-react";

import Link from "next/link";
import { DataTable } from "@/components/data-table";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import type { RowAction, RuleData } from "@/types/data-table";

export default function RulesPage() {
  const breadcrumbs = [{ label: "Automation", href: "#" }, { label: "Rules" }];

  // Rules data matching RuleData interface
  const rulesData: RuleData[] = [
    {
      id: "1",
      name: "Auto-publish High-scoring Content",
      category: "Content Management",
      description:
        "Automatically publish content with SEO scores above 85 and human approval",
      status: "Active",
      priority: "High",
      trigger: "Content Score Threshold",
      action: "Auto-publish to designated platforms",
      lastTriggered: "2024-01-22 15:30",
      timesTriggered: 47,
      successRate: "96.8%",
      created: "2024-01-01 09:00",
      author: "Sarah Johnson",
    },
    {
      id: "2",
      name: "Urgent Error Notifications",
      category: "System Monitoring",
      description:
        "Send immediate SMS notifications for critical flow failures",
      status: "Active",
      priority: "Critical",
      trigger: "Flow Error with severity >= Critical",
      action: "Send SMS to on-call team",
      lastTriggered: "2024-01-21 18:45",
      timesTriggered: 12,
      successRate: "100%",
      created: "2023-12-15 14:20",
      author: "Mike Chen",
    },
    {
      id: "3",
      name: "Content Review Assignment",
      category: "Workflow Management",
      description:
        "Assign content to specific reviewers based on content type and complexity",
      status: "Active",
      priority: "Medium",
      trigger: "New content generated",
      action: "Assign to appropriate reviewer",
      lastTriggered: "2024-01-22 14:20",
      timesTriggered: 156,
      successRate: "94.2%",
      created: "2024-01-05 11:30",
      author: "Emma Davis",
    },
    {
      id: "4",
      name: "Social Media Posting Schedule",
      category: "Social Media",
      description:
        "Automatically schedule social posts for optimal engagement times",
      status: "Paused",
      priority: "Medium",
      trigger: "Social content approved",
      action: "Schedule for optimal posting time",
      lastTriggered: "2024-01-20 09:30",
      timesTriggered: 89,
      successRate: "91.7%",
      created: "2024-01-10 16:45",
      author: "David Park",
    },
    {
      id: "5",
      name: "Budget Alert System",
      category: "Financial Management",
      description:
        "Alert when AI model usage costs exceed monthly budget thresholds",
      status: "Active",
      priority: "High",
      trigger: "Monthly costs > 80% of budget",
      action: "Send budget warning to administrators",
      lastTriggered: "2024-01-19 10:15",
      timesTriggered: 3,
      successRate: "100%",
      created: "2024-01-08 13:20",
      author: "Lisa Wong",
    },
    {
      id: "6",
      name: "Quality Control Escalation",
      category: "Quality Assurance",
      description:
        "Escalate content to senior reviewers when quality metrics are below threshold",
      status: "Testing",
      priority: "Medium",
      trigger: "Quality score < 70",
      action: "Escalate to senior reviewer",
      lastTriggered: "2024-01-18 16:30",
      timesTriggered: 23,
      successRate: "87.0%",
      created: "2024-01-12 09:45",
      author: "Carlos Mendez",
    },
  ];

  const columns = [
    { key: "name", header: "Rule Name", width: "250px" },
    { key: "category", header: "Category", width: "150px" },
    { key: "status", header: "Status", width: "100px" },
    { key: "priority", header: "Priority", width: "100px" },
    { key: "timesTriggered", header: "Triggered", width: "90px" },
    { key: "successRate", header: "Success Rate", width: "110px" },
    { key: "lastTriggered", header: "Last Triggered", width: "130px" },
    { key: "author", header: "Author", width: "120px" },
  ];

  const emptyActions = [
    {
      label: "Create Rule",
      icon: <Plus className="h-4 w-4" />,
      href: "/rules/create",
    },
  ];

  const tableActions = (
    <div className="flex items-center gap-2">
      <Button asChild variant="default">
        <Link href="/rules/create">
          <Plus className="h-4 w-4 mr-2" />
          Create Rule
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/rules/settings">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Link>
      </Button>
    </div>
  );

  const rowActions: RowAction<RuleData>[] = [
    {
      label: "View Details",
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: RuleData) => console.log("View rule:", row.name),
    },
    {
      label: "Edit Rule",
      icon: <Edit3 className="h-4 w-4" />,
      onClick: (row: RuleData) => console.log("Edit rule:", row.name),
    },
    {
      label: "Toggle Status",
      icon: <Play className="h-4 w-4" />,
      onClick: (row: RuleData) =>
        console.log(
          row.status === "Active" ? "Pause" : "Activate",
          "rule:",
          row.name,
        ),
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: RuleData) => console.log("Delete rule:", row.name),
      variant: "destructive" as const,
    },
  ];

  return (
    <PageLayout
      title="Business Rules"
      description="Define and manage business rules, automation triggers, and conditional logic for your workflows."
      breadcrumbs={breadcrumbs}
    >
      <DataTable<RuleData>
        columns={columns}
        data={rulesData}
        emptyTitle="No rules created yet"
        emptyDescription="Start by creating your first business rule to automate workflows and processes."
        emptyActions={emptyActions}
        emptyIcon={<Shield className="h-8 w-8 text-muted-foreground" />}
        searchPlaceholder="Search rules by name, category, status, author..."
        actions={tableActions}
        rowActions={rowActions}
        pageSize={10}
        searchFields={["name", "category", "status", "priority", "author"]}
      />
    </PageLayout>
  );
}
