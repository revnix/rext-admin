"use client";

import {
  Calendar,
  Copy,
  Edit3,
  Eye,
  FileText,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";

import Link from "next/link";
import { ContentStatusBadge } from "@/components/content/content-status-badge";
import { DataTable } from "@/components/data-table";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/use-page-title";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";
import { STATUS_FILTER_OPTIONS } from "@/types/content";
import type { ContentData, RowAction } from "@/types/data-table";

export default function WorkspaceContentPage() {
  const { workspace, workspaceId } = useWorkspace();

  const breadcrumbs = [
    { label: "Workspaces", href: "/workspaces" },
    {
      label: workspace?.title || "...",
      href: workspaceRoutes.root(workspaceId),
    },
    { label: "Content" },
  ];

  // Update page title and description
  usePageTitle(
    `Content Library - ${workspace?.title || "Workspace"}`,
    `Manage published and scheduled content for ${workspace?.title || "this workspace"}.`,
  );

  // TODO: Replace with actual content data from API
  const contentData: ContentData[] = [];

  const columns = [
    {
      key: "title",
      header: "Title",
      width: "300px",
      cell: (value: unknown, row: ContentData) => (
        <Link
          href={workspaceRoutes.contentDetail(workspaceId, row.id)}
          className="font-medium text-foreground leading-tight hover:text-primary transition-colors"
        >
          {String(value || "")}
        </Link>
      ),
    },
    { key: "type", header: "Type", width: "120px" },
    {
      key: "status",
      header: "Status",
      width: "120px",
      cell: (_value: unknown, row: ContentData) => (
        <ContentStatusBadge status={row.status} />
      ),
      filterable: true,
      filterType: "select" as const,
      filterOptions: STATUS_FILTER_OPTIONS.map((option) => option.value),
    },
    { key: "publishedTo", header: "Published To", width: "120px" },
    { key: "wordCount", header: "Words", width: "80px" },
    { key: "seoScore", header: "SEO Score", width: "90px" },
    { key: "humanReviewer", header: "Reviewer", width: "120px" },
    { key: "publishDate", header: "Published", width: "130px" },
    { key: "created", header: "Created", width: "130px" },
  ];

  const emptyActions = [
    {
      label: "Create Content",
      icon: <Plus className="h-4 w-4" />,
      href: workspaceRoutes.contentCreate(workspaceId),
    },
  ];

  const tableActions = (
    <div className="flex items-center gap-2">
      <Button asChild variant="default">
        <Link href={workspaceRoutes.contentCreate(workspaceId)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Content
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href={workspaceRoutes.settings(workspaceId)}>
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Link>
      </Button>
    </div>
  );

  const rowActions: RowAction<ContentData>[] = [
    {
      label: "View",
      icon: <Eye className="h-4 w-4" />,
      href: (row: ContentData) =>
        workspaceRoutes.contentDetail(workspaceId, row.id),
      tooltip: "View content details",
    },
    {
      label: "Edit",
      icon: <Edit3 className="h-4 w-4" />,
      onClick: (row: ContentData) => console.log("Edit content:", row.title),
      tooltip: "Edit this content",
    },
    {
      label: "Copy",
      icon: <Copy className="h-4 w-4" />,
      onClick: (row: ContentData) => console.log("Copy content:", row.title),
      tooltip: "Duplicate this content",
    },
    {
      label: "Schedule",
      icon: <Calendar className="h-4 w-4" />,
      onClick: (row: ContentData) =>
        console.log("Schedule content:", row.title),
      tooltip: "Schedule for publication",
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: ContentData) => console.log("Delete content:", row.title),
      variant: "destructive" as const,
      requiresConfirmation: true,
      confirmationTitle: "Delete Content",
      confirmationDescription:
        "Are you sure you want to delete this content? This action cannot be undone.",
    },
  ];

  return (
    <PageLayout
      title="Generated Content"
      description={`View, edit, and manage AI-generated content for ${workspace?.title || "this workspace"}.`}
      breadcrumbs={breadcrumbs}
    >
      <DataTable<ContentData>
        columns={columns}
        data={contentData}
        emptyTitle="No content available"
        emptyDescription="Content will be automatically generated and managed through your configured flows."
        emptyActions={emptyActions}
        emptyIcon={<FileText className="h-8 w-8 text-muted-foreground" />}
        searchPlaceholder="Search content by title, type, status, platform..."
        actions={tableActions}
        rowActions={rowActions}
        pageSize={10}
        searchFields={[
          "title",
          "type",
          "status",
          "publishedTo",
          "humanReviewer",
          "keywords",
        ]}
      />
    </PageLayout>
  );
}
