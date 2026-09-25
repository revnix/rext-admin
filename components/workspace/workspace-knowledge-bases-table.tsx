"use client";

import { format } from "date-fns";
import { BookOpen, Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import type { KnowledgeBase } from "@/lib/api-client/knowledge";
import type { Column, RowAction } from "@/types/data-table";

interface KnowledgeBaseData extends Record<string, unknown> {
  id: string;
  name: string;
  description: string | null | undefined;
  type: string;
  items_count: number;
  created_at: string;
  formatted_date: string;
}

interface WorkspaceKnowledgeBasesTableProps {
  knowledgeBases: KnowledgeBase[];
  onEdit: (kb: KnowledgeBase) => void;
  /** Omit when the caller lacks the delete permission — the Delete action is then not rendered. */
  onDelete?: (kb: KnowledgeBase) => void;
  onView: (kb: KnowledgeBase) => void;
  isLoading?: boolean;
}

/**
 * Workspace Knowledge Bases Table Component
 *
 * Displays knowledge bases using the unified DataTable component
 */
export function WorkspaceKnowledgeBasesTable({
  knowledgeBases,
  onEdit,
  onDelete,
  onView,
  isLoading,
}: WorkspaceKnowledgeBasesTableProps) {
  const getTypeBadge = (type: string) => {
    if (type === "default") {
      return (
        <Badge variant="secondary" className="font-normal">
          Default
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="font-normal">
        Custom
      </Badge>
    );
  };

  // Transform data for DataTable
  const tableData: KnowledgeBaseData[] = knowledgeBases.map((kb) => ({
    id: kb.id,
    name: kb.name,
    description: kb.description,
    type: kb.type,
    items_count: kb.items_count,
    created_at: kb.created_at,
    formatted_date: format(new Date(kb.created_at), "MMM d, yyyy"),
  }));

  // Define columns
  const columns: Column<KnowledgeBaseData>[] = [
    {
      key: "name",
      header: "Name",
      width: "300px",
      cell: (value, row) => (
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <button
              type="button"
              onClick={() => {
                const kb = knowledgeBases.find((k) => k.id === row.id);
                if (kb) onView(kb);
              }}
              className="font-medium hover:underline text-left"
            >
              {value as string}
            </button>
            {row.description && (
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                {row.description as string}
              </p>
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
    },
    {
      key: "items_count",
      header: "Items",
      width: "100px",
      cell: (value) => (
        <div className="text-left pl-4">
          <span className="font-medium">{value as number}</span>
        </div>
      ),
    },
    {
      key: "formatted_date",
      header: "Created",
      width: "150px",
      cell: (value) => (
        <span className="text-sm text-muted-foreground">{value as string}</span>
      ),
    },
  ];

  // Define row actions - similar to topics table
  const rowActions: RowAction<KnowledgeBaseData>[] = [
    {
      label: "View Items",
      icon: <BookOpen className="h-4 w-4" />,
      onClick: (row) => {
        const kb = knowledgeBases.find((k) => k.id === row.id);
        if (kb) onView(kb);
      },
      tooltip: "View items in this knowledge base",
      variant: "default" as const,
      showLabel: true,
      primary: true,
    },
    {
      label: "Edit",
      icon: <Pencil className="h-4 w-4" />,
      onClick: (row) => {
        const kb = knowledgeBases.find((k) => k.id === row.id);
        if (kb) onEdit(kb);
      },
      tooltip: "Edit knowledge base details",
      showLabel: true,
    },
    // Delete is only offered when the caller passes a handler, i.e. when the
    // user holds the permission the backend enforces for knowledge deletion.
    ...(onDelete
      ? [
          {
            label: "Delete",
            icon: <Trash2 className="h-4 w-4" />,
            onClick: (row: KnowledgeBaseData) => {
              const kb = knowledgeBases.find((k) => k.id === row.id);
              if (kb) onDelete(kb);
            },
            variant: "destructive" as const,
            requiresConfirmation: true,
            confirmationTitle: "Delete Knowledge Base",
            confirmationDescription:
              "Are you sure you want to delete this knowledge base? This action cannot be undone.",
            tooltip: "Delete this knowledge base permanently",
            disabled: (row: KnowledgeBaseData) => row.type === "default",
            showLabel: true,
          },
        ]
      : []),
  ];

  return (
    <DataTable
      columns={columns}
      data={tableData}
      isLoading={isLoading}
      rowActions={rowActions}
      onRowClick={(row) => {
        const kb = knowledgeBases.find((k) => k.id === row.id);
        if (kb) onView(kb);
      }}
      emptyTitle="No knowledge bases yet"
      emptyDescription="Create your first knowledge base to get started"
      emptyIcon={<BookOpen className="h-12 w-12" />}
      searchPlaceholder="Search knowledge bases..."
      searchFields={["name", "description"]}
      pageSize={10}
      pageSizeOptions={[10, 25, 50]}
      tableId="workspace-knowledge-bases"
    />
  );
}
