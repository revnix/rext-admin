"use client";

import {
  CheckCircle,
  Eye,
  Lightbulb,
  Loader2,
  PenTool,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/data-table";
import {
  AudienceFitDisplay,
  CategoryDisplay,
  DateDisplay,
  EnhancedScoreDisplay,
  StatusDisplay,
  TagsList,
  TitleDisplay,
} from "@/components/ui/topic-cell-formatters";
import {
  useTopicApproveServerAction,
  useTopicDeleteServerAction,
} from "@/hooks/use-topic-mutations-server-actions";
import { logger } from "@/lib/logger";
import { useWorkspaceOptional } from "@/providers/workspace-provider";
// import { TOPIC_PERMISSIONS } from "@/lib/permissions";
import { useWorkspacePermission } from "@/hooks/use-permission";
import type { Column, RowAction, TopicData } from "@/types/data-table";
import { useState } from "react";

interface TopicsClientWrapperProps {
  data: TopicData[];
  emptyActions: Array<{
    label: string;
    icon: React.ReactNode;
    href: string;
  }>;
  tableActions: React.ReactNode;
}

export function TopicsClientWrapper({
  data,
  emptyActions,
  tableActions,
}: TopicsClientWrapperProps) {
  const router = useRouter();
  // Mutations using modern server actions
  const deleteMutation = useTopicDeleteServerAction();
  const approveMutation = useTopicApproveServerAction();
  const topicsLogger = logger.forComponent("TopicsClientWrapper");
  const [approvingTopicId, setApprovingTopicId] = useState<string | null>(null);
  const [deletingTopicId, setDeletingTopicId] = useState<string | null>(null);

  // Get workspace context (optional because this component is used in both workspace and legacy routes)
  const workspaceContext = useWorkspaceOptional();
  const workspaceSlug = workspaceContext?.workspaceSlug;
  // const workspaceId = workspaceContext?.workspaceId;

  // Permission: can the current user delete topics in this workspace?
  const { hasPermission: canDelete } = useWorkspacePermission(
    "topic.delete",
    workspaceSlug,
  );

  // Handle topic deletion using server actions
  const handleTopicDelete = async (topicId: string, _topicName: string) => {
    try {
      setDeletingTopicId(topicId);
      await deleteMutation.mutateAsync([topicId]);
    } catch (error) {
      // Error handling is done by the mutation hook
      topicsLogger.error("Failed to delete topic", {
        topic_id: topicId,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setDeletingTopicId(null);
    }
  };

  // Handle topic approval using server actions
  const handleTopicApproval = async (topicId: string, topicName: string) => {
    try {
      setApprovingTopicId(topicId);
      await approveMutation.mutateAsync(topicId);
    } catch (error) {
      // Error handling is done by the mutation hook
      topicsLogger.error("Failed to approve topic", {
        topic_id: topicId,
        topic_name: topicName,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setApprovingTopicId(null);
    }
  };

  // Column definitions moved to client component to avoid serialization issues
  const columns: Column<TopicData>[] = [
    {
      key: "name",
      header: "Topic Title",
      width: "320px",
      cell: (value, row) => (
        <TitleDisplay
          value={value}
          row={row}
          href={
            workspaceSlug
              ? `/w/${workspaceSlug}/topics/${row.id}`
              : `/topics/${row.id}`
          }
        />
      ),
      searchable: true,
    },
    {
      key: "category",
      header: "Categories",
      width: "140px",
      cell: (value, row) => <CategoryDisplay value={value} row={row} />,
      searchable: true,
    },
    {
      key: "audience_fit",
      header: "Audience",
      width: "120px",
      cell: (value) => <AudienceFitDisplay value={value} />,
      searchable: true,
    },
    {
      key: "tags",
      header: "Tags",
      width: "100px",
      cell: (value, row) => <TagsList value={value} row={row} />,
      searchable: true,
    },
    {
      key: "score",
      header: "Overall Score",
      width: "180px",
      cell: (value, row) => <EnhancedScoreDisplay value={value} row={row} />,
      searchable: false,
    },
    {
      key: "status",
      header: "Status",
      width: "220px",
      cell: (value, row) => <StatusDisplay value={value} row={row} />,
      searchable: false,
    },
    {
      key: "created",
      header: "Saved",
      width: "120px",
      cell: (value) => <DateDisplay value={value} />,
      searchable: false,
    },
  ];

  // Row actions specific to topics with client-side interactions
  const rowActions: RowAction<TopicData>[] = [
    {
      label: "View",
      icon: <Eye className="h-4 w-4" />,
      href: (row: TopicData) =>
        workspaceSlug
          ? `/w/${workspaceSlug}/topics/${row.id}`
          : `/topics/${row.id}`,
      tooltip: "View topic details",
      showLabel: true,
    },
    // Approve button - only shown for non-approved topics
    {
      label: (row: TopicData) =>
        row.id === approvingTopicId ? "Loading…" : "Approve",
      icon: (row: TopicData) =>
        row.id === approvingTopicId ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle className="h-4 w-4" />
        ),
      onClick: (row: TopicData) => {
        if (!approvingTopicId) handleTopicApproval(row.id, row.name);
      },
      tooltip: "Approve this topic for content creation",
      variant: "default" as const,
      showLabel: true,
      primary: true,
      disabled: (row: TopicData) =>
        approvingTopicId === row.id ||
        row.status?.toLowerCase() === "approved" ||
        row.status?.toLowerCase() === "saved" ||
        (row && "approved" in row && row.approved === true),
    },
    // Write Content button - only shown for approved topics
    {
      label: "Write Content",
      icon: <PenTool className="h-4 w-4" />,
      onClick: (row: TopicData) => {
        topicsLogger.info("Create content clicked", {
          topic_id: row.id,
          topic_name: row.name,
        });

        // Navigate to content creation with topic prefilled
        if (workspaceSlug && row.id) {
          router.push(`/w/${workspaceSlug}/content/create?topicId=${row.id}`);
        } else {
          topicsLogger.error(
            "Cannot navigate: Missing workspace slug or topic ID",
          );
        }
      },
      tooltip: "Create content from this topic",
      variant: "default" as const,
      showLabel: true,
      primary: true,
      disabled: (row: TopicData) =>
        row.status?.toLowerCase() !== "approved" &&
        row.status?.toLowerCase() !== "saved" &&
        !(row && "approved" in row && row.approved === true),
    },
    //  Conditionally include Remove only if permission granted
    ...(canDelete
      ? [
          {
            label: (row: TopicData) =>
              row.id === deletingTopicId ? "Removing…" : "Remove",
            icon: (row: TopicData) =>
              row.id === deletingTopicId ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              ),
            onClick: (row: TopicData) => {
              if (!deletingTopicId) handleTopicDelete(row.id, row.name);
            },
            variant: "destructive" as const,
            requiresConfirmation: true,
            confirmationTitle: "Remove Topic",
            confirmationDescription:
              "Are you sure you want to remove this topic? This action cannot be undone.",
            tooltip: "Remove this topic permanently",
            disabled: (row: TopicData) => row.id === deletingTopicId,
            showLabel: true,
          } satisfies RowAction<TopicData>,
        ]
      : []),
  ];

  return (
    <DataTable<TopicData>
      columns={columns}
      data={data}
      emptyTitle="No topics yet"
      emptyDescription="Generate your first collection of AI-powered topics. Use the topic builder to create engaging content topics tailored to your audience."
      emptyActions={emptyActions}
      emptyIcon={<Lightbulb className="h-8 w-8 text-muted-foreground" />}
      searchPlaceholder="Search topics by title, category, content type..."
      actions={tableActions}
      rowActions={rowActions}
      pageSize={15}
      searchFields={columns
        .filter((col) => col.searchable)
        .map((col) => col.key)}
    />
  );
}
