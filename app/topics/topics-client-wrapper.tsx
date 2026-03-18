"use client";

import { Eye, Lightbulb, Loader2, PenTool, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/data-table";
import {
  CategoryDisplay,
  DateDisplay,
  TitleDisplay,
} from "@/components/ui/topic-cell-formatters";
import { useTopicDeleteServerAction } from "@/hooks/use-topic-mutations-server-actions";
import { logger } from "@/lib/logger";
import { useWorkspaceOptional } from "@/providers/workspace-provider";
import { useWorkspacePermission } from "@/hooks/use-permission";
import type { Column, RowAction, TopicData } from "@/types/data-table";
import { useState } from "react";
import type { Route } from "next";

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
  const topicsLogger = logger.forComponent("TopicsClientWrapper");
  const [deletingTopicId, setDeletingTopicId] = useState<string | null>(null);

  // Get workspace context
  const workspaceContext = useWorkspaceOptional();
  const workspaceSlug = workspaceContext?.workspaceSlug;

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
      topicsLogger.error("Failed to delete topic", {
        topic_id: topicId,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setDeletingTopicId(null);
    }
  };

  // Column definitions - simplified for content-only tracker
  const columns: Column<TopicData>[] = [
    {
      key: "topic_name",
      header: "Topic Title",
      width: "400px",
      cell: (value, row) => (
        <TitleDisplay
          value={value}
          row={row}
          href={
            workspaceSlug
              ? `/w/${workspaceSlug}/topics/${row.id}`
              : (`/topics/${row.id}` as Route)
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
      key: "created",
      header: "Saved",
      width: "120px",
      cell: (value) => <DateDisplay value={value} />,
      searchable: false,
    },
  ];

  // Row actions specific to topics
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
    {
      label: "Write Content",
      icon: <PenTool className="h-4 w-4" />,
      onClick: (row: TopicData) => {
        topicsLogger.info("Create content clicked", {
          topic_id: row.id,
          topic_name: row.topic_name,
        });

        if (workspaceSlug && row.id) {
          router.push(
            `/w/${workspaceSlug}/content/create?topicId=${row.id}` as Route,
          );
        }
      },
      tooltip: "Create content from this topic",
      variant: "default" as const,
      showLabel: true,
      primary: true,
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
              if (!deletingTopicId) handleTopicDelete(row.id, row.topic_name);
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
      emptyDescription="Find and save interesting content ideas to your library."
      emptyActions={emptyActions}
      emptyIcon={<Lightbulb className="h-8 w-8 text-muted-foreground" />}
      searchPlaceholder="Search topics by title or description..."
      actions={tableActions}
      rowActions={rowActions}
      pageSize={15}
      searchFields={columns
        .filter((col) => col.searchable)
        .map((col) => col.key)}
    />
  );
}
