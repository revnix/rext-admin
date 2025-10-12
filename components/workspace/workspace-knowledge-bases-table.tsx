"use client";

import { format } from "date-fns";
import {
  BookOpen,
  Edit,
  FolderOpen,
  MoreHorizontal,
  Trash2,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { KnowledgeBase } from "@/lib/api-client/knowledge";

interface WorkspaceKnowledgeBasesTableProps {
  knowledgeBases: KnowledgeBase[];
  onEdit: (kb: KnowledgeBase) => void;
  onDelete: (kb: KnowledgeBase) => void;
  onView: (kb: KnowledgeBase) => void;
  isLoading?: boolean;
}

/**
 * Workspace Knowledge Bases Table Component
 *
 * Displays knowledge bases in a table format with:
 * - Knowledge base name and description
 * - Type badge (default/custom)
 * - Items count
 * - Created date
 * - Actions (view, edit, delete)
 *
 * Features:
 * - Default KB protection (no delete)
 * - Action dropdown menu
 * - Empty state handling
 * - Loading state support
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

  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <BookOpen className="h-12 w-12 mx-auto mb-4 animate-pulse" />
        <p>Loading knowledge bases...</p>
      </div>
    );
  }

  if (!knowledgeBases || knowledgeBases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg">
        <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">No knowledge bases yet</p>
        <p className="text-sm text-muted-foreground">
          Create your first knowledge base to get started
        </p>
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
            <TableHead className="text-right">Items</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {knowledgeBases.map((kb) => (
            <TableRow key={kb.id}>
              {/* Name & Description */}
              <TableCell>
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => onView(kb)}
                      className="font-medium hover:underline text-left"
                    >
                      {kb.name}
                    </button>
                    {kb.description && (
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                        {kb.description}
                      </p>
                    )}
                  </div>
                </div>
              </TableCell>

              {/* Type Badge */}
              <TableCell>{getTypeBadge(kb.type)}</TableCell>

              {/* Items Count */}
              <TableCell className="text-right">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="font-medium">{kb.items_count}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total knowledge items</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>

              {/* Created Date */}
              <TableCell>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(kb.created_at), "MMM d, yyyy")}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{format(new Date(kb.created_at), "PPpp")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>

              {/* Actions */}
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(kb)}>
                      <BookOpen className="mr-2 h-4 w-4" />
                      View Items
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(kb)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Details
                    </DropdownMenuItem>
                    {kb.type !== "default" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(kb)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
