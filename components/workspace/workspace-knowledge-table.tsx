"use client";

import { format } from "date-fns";
import { FileText, Globe, Pencil, Trash2, Type } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import type { Column, RowAction } from "@/types/data-table";
import type {
  FileKnowledge,
  TextKnowledge,
  WebKnowledge,
} from "@/types/workspace";

/**
 * Unified knowledge item type for table display
 */
export type KnowledgeItem = {
  id: string;
  type: "web" | "file" | "text";
  name: string;
  description?: string;
  itemCount?: number;
  status?: string;
  created_at: string;
  updated_at?: string;
  metadata?: Record<string, unknown>;
};

interface WorkspaceKnowledgeTableProps {
  items: KnowledgeItem[];
  onEdit: (item: KnowledgeItem) => void;
  /** Omit when the caller lacks the delete permission — the Delete action is then not rendered. */
  onDelete?: (item: KnowledgeItem) => void;
  isLoading?: boolean;
}

/**
 * Workspace Knowledge Table Component
 *
 * Displays all knowledge items (web, file, text) in a unified table format.
 * Uses the DataTable component for consistency with topics and knowledge bases tables.
 *
 * Features:
 * - Type-based icons and badges
 * - Status indicators
 * - Created/updated timestamps
 * - Edit and delete actions
 * - Search and pagination
 * - Empty and loading states
 */
export function WorkspaceKnowledgeTable({
  items,
  onEdit,
  onDelete,
  isLoading,
}: WorkspaceKnowledgeTableProps) {
  const getTypeIcon = (type: string) => {
    const icons = {
      web: Globe,
      file: FileText,
      text: Type,
    };
    const Icon = icons[type as keyof typeof icons] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      // A source's type is an attribute, so a neutral word (language §10).
      web: "bg-surface-inset text-foreground",
      file: "bg-surface-inset text-foreground",
      text: "bg-surface-inset text-foreground",
    };

    const labels = {
      web: "Website",
      file: "File",
      text: "Text",
    };

    return (
      <Badge
        className={styles[type as keyof typeof styles] || styles.file}
        variant="secondary"
      >
        {labels[type as keyof typeof labels] || type}
      </Badge>
    );
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;

    const variants: Record<string, "default" | "secondary" | "outline"> = {
      completed: "default",
      pending: "secondary",
      processing: "secondary",
      failed: "outline",
    };

    return (
      <Badge variant={variants[status.toLowerCase()] || "secondary"}>
        {status}
      </Badge>
    );
  };

  // Define columns for DataTable
  const columns: Column<KnowledgeItem>[] = [
    {
      key: "name",
      header: "Name",
      width: "350px",
      cell: (value, row) => (
        <div className="flex items-center gap-2">
          {getTypeIcon(row.type)}
          <div className="flex flex-col min-w-0">
            <span className="font-medium truncate">{value as string}</span>
            {row.description && (
              <span className="text-xs text-muted-foreground truncate max-w-md">
                {row.description}
              </span>
            )}
          </div>
        </div>
      ),
      searchable: true,
    },
    {
      key: "type",
      header: "Type",
      width: "120px",
      cell: (value) => getTypeBadge(value as string),
      searchable: true,
    },
    {
      key: "status",
      header: "Status",
      width: "120px",
      cell: (value) => getStatusBadge(value as string | undefined),
      searchable: false,
    },
    {
      key: "created_at",
      header: "Created",
      width: "140px",
      cell: (value) => {
        if (!value)
          return (
            <span className="inline-block px-6 text-sm text-muted-foreground">
              -
            </span>
          );
        const date = new Date(value as string);
        return (
          <span className="text-sm text-muted-foreground">
            {Number.isNaN(date.getTime()) ? "-" : format(date, "MMM d, yyyy")}
          </span>
        );
      },
      searchable: false,
    },
    {
      key: "updated_at",
      header: "Last Updated",
      width: "140px",
      cell: (value) => {
        if (!value)
          return (
            <span className="inline-block px-6 text-sm text-muted-foreground">
              -
            </span>
          );
        const date = new Date(value as string);
        return (
          <span className="text-sm text-muted-foreground">
            {Number.isNaN(date.getTime()) ? "-" : format(date, "MMM d, yyyy")}
          </span>
        );
      },
      searchable: false,
    },
  ];

  // Define row actions - similar to topics table
  const rowActions: RowAction<KnowledgeItem>[] = [
    {
      label: "Edit",
      icon: <Pencil className="h-4 w-4" />,
      onClick: (row) => onEdit(row),
      tooltip: "Edit this knowledge item",
      variant: "default" as const,
      showLabel: true,
      primary: true,
    },
    // Delete is only offered when the caller passes a handler, i.e. when the
    // user holds the permission the backend enforces for knowledge deletion.
    ...(onDelete
      ? [
          {
            label: "Delete",
            icon: <Trash2 className="h-4 w-4" />,
            onClick: (row: KnowledgeItem) => onDelete(row),
            variant: "destructive" as const,
            requiresConfirmation: true,
            confirmationTitle: "Delete Knowledge Item",
            confirmationDescription:
              "Are you sure you want to delete this knowledge item? This action cannot be undone.",
            tooltip: "Delete this knowledge item permanently",
            showLabel: true,
          },
        ]
      : []),
  ];

  return (
    <DataTable
      columns={columns}
      data={items}
      isLoading={isLoading}
      rowActions={rowActions}
      emptyTitle="No knowledge items yet"
      emptyDescription="Add your first knowledge item to this knowledge base"
      emptyIcon={<FileText className="h-12 w-12" />}
      searchPlaceholder="Search knowledge items..."
      searchFields={["name", "type", "description"]}
      pageSize={15}
      pageSizeOptions={[10, 15, 25, 50]}
      tableId="workspace-knowledge-items"
    />
  );
}

/**
 * Helper function to convert knowledge items to unified format
 */
export function convertToKnowledgeItems(
  webKnowledge: WebKnowledge[],
  fileKnowledge: FileKnowledge[],
  textKnowledge: TextKnowledge[],
): KnowledgeItem[] {
  const items: KnowledgeItem[] = [];

  // Convert web knowledge
  webKnowledge.forEach((web) => {
    items.push({
      id: web.id,
      type: "web",
      name: web.title || web.url,
      description: web.url,
      status: web.status,
      created_at: web.created_at,
      updated_at: web.updated_at,
      metadata: web.metadata,
    });
  });

  // Convert file knowledge
  fileKnowledge.forEach((file) => {
    items.push({
      id: file.id,
      type: "file",
      name: file.name,
      description: `${file.type} • ${(file.size / 1024).toFixed(1)} KB`,
      status: file.status,
      created_at: file.created_at,
      updated_at: file.updated_at,
      metadata: file.metadata,
    });
  });

  // Convert text knowledge
  textKnowledge.forEach((text) => {
    items.push({
      id: text.id,
      type: "text",
      name: text.title,
      description:
        text.content.length > 100
          ? `${text.content.substring(0, 100)}...`
          : text.content,
      created_at: text.created_at,
      updated_at: text.updated_at,
      metadata: text.metadata,
    });
  });

  // Sort by created_at (newest first)
  return items.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}
