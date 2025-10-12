"use client";

import { format } from "date-fns";
import {
  FileText,
  Globe,
  MoreHorizontal,
  Pencil,
  Trash2,
  Type,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  onDelete: (item: KnowledgeItem) => void;
  isLoading?: boolean;
}

/**
 * Workspace Knowledge Table Component
 *
 * Displays all knowledge items (web, file, text) in a unified table format.
 *
 * Features:
 * - Type-based icons and badges
 * - Status indicators
 * - Created/updated timestamps
 * - Edit and delete actions
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
      web: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      file: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      text: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
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

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <div className="p-12 text-center text-muted-foreground">
          Loading knowledge items...
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground h-32"
              >
                No knowledge items found
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={`${item.type}-${item.id}`}>
                {/* Name */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(item.type)}
                    <div className="flex flex-col">
                      <span className="font-medium">{item.name}</span>
                      {item.description && (
                        <span className="text-xs text-muted-foreground truncate max-w-md">
                          {item.description}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Type */}
                <TableCell>{getTypeBadge(item.type)}</TableCell>

                {/* Status */}
                <TableCell>{getStatusBadge(item.status)}</TableCell>

                {/* Created */}
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(item.created_at), "MMM d, yyyy")}
                  </span>
                </TableCell>

                {/* Last Updated */}
                <TableCell>
                  {item.updated_at ? (
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(item.updated_at), "MMM d, yyyy")}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(item)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(item)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
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
