"use client";

import { Eye, Save } from "lucide-react";
import { memo, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { CircularProgress } from "@/components/ui/progress";
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
import { cn } from "@/lib/utils";
import type { Column, RowAction } from "@/types/data-table";
import type { GeneratedTopic } from "@/types/topic-builder";

interface TopicsTableProps {
  topics: GeneratedTopic[];
  selectedTopicIds: string[];
  newlyAddedTopicIds?: string[];
  onTopicSelect: (topicId: string, selected: boolean) => void;
  onTopicSave: (topicId: string) => void;
  onNavigateToContent: (topicId: string) => void;
  onViewDetails: (topicId: string) => void;
  onCopyTopic: (topicId: string) => void;
}

// Extend GeneratedTopic to include selection state for DataTable
interface TopicTableRow extends GeneratedTopic, Record<string, unknown> {
  selected?: boolean;
  highlighted?: boolean;
}

export const TopicsTable = memo(function TopicsTable({
  topics,
  selectedTopicIds,
  newlyAddedTopicIds = [],
  onTopicSelect,
  onTopicSave,
  onNavigateToContent: _onNavigateToContent,
  onViewDetails: _onViewDetails,
  onCopyTopic: _onCopyTopic,
}: TopicsTableProps) {
  // Transform topics data to include selection state
  const tableData: TopicTableRow[] = useMemo(() => {
    return topics.map((topic) => ({
      ...topic,
      selected: selectedTopicIds.includes(topic.id),
      highlighted: newlyAddedTopicIds.includes(topic.id),
    }));
  }, [topics, selectedTopicIds, newlyAddedTopicIds]);

  // Helper function to calculate overall score
  const calculateOverallScore = (scores: GeneratedTopic["scores"]) => {
    return Math.round(
      ((scores.relevance +
        scores.seo_potential +
        scores.trend_level +
        scores.uniqueness +
        scores.reader_interest +
        scores.actionable_potential +
        scores.brand_alignment +
        scores.controversy) /
        8) *
        100,
    );
  };

  // Helper function to format created date
  const formatCreatedDate = (dateString: string | null) => {
    if (!dateString) return "Just now";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

  // Column definitions
  const columns: Column<TopicTableRow>[] = [
    {
      key: "selected",
      header: "",
      width: "50px",
      cell: (_value, row) => (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={row.selected || false}
            onChange={(e) => {
              e.stopPropagation();
              onTopicSelect(row.id, e.target.checked);
            }}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            aria-label={`Select topic: ${row.title}`}
          />
        </div>
      ),
      searchable: false,
    },
    {
      key: "title",
      header: "Topic",
      width: "320px",
      cell: (_value, row) => (
        <div className="space-y-1">
          <div className="font-semibold text-sm line-clamp-2 pr-2">
            {row.title}
          </div>
          <div className="text-xs text-muted-foreground line-clamp-2">
            {row.angle}
          </div>
          {row.description && (
            <div className="text-xs text-muted-foreground/80 line-clamp-1">
              {row.description}
            </div>
          )}
        </div>
      ),
      searchable: true,
    },
    {
      key: "channel_fit",
      header: "Channel Fit",
      width: "150px",
      cell: (_value, row) => (
        <div className="flex flex-wrap gap-1">
          {row.channel_fit.slice(0, 2).map((channel) => (
            <Badge
              key={channel}
              variant="secondary"
              className="text-xs px-2 py-0.5"
            >
              {channel}
            </Badge>
          ))}
          {row.channel_fit.length > 2 && (
            <Badge variant="outline" className="text-xs px-2 py-0.5">
              +{row.channel_fit.length - 2}
            </Badge>
          )}
        </div>
      ),
      searchable: true,
    },
    {
      key: "audience_fit",
      header: "Audience Fit",
      width: "150px",
      cell: (_value, row) => (
        <div className="flex flex-wrap gap-1">
          {row.audience_fit.slice(0, 2).map((audience) => (
            <Badge
              key={audience}
              variant="secondary"
              className="text-xs px-2 py-0.5"
            >
              {audience}
            </Badge>
          ))}
          {row.audience_fit.length > 2 && (
            <Badge variant="outline" className="text-xs px-2 py-0.5">
              +{row.audience_fit.length - 2}
            </Badge>
          )}
        </div>
      ),
      searchable: true,
    },
    {
      key: "tags",
      header: "Tags",
      width: "120px",
      cell: (_value, row) => (
        <div className="flex flex-wrap gap-1">
          {row.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs px-2 py-0.5">
              {tag}
            </Badge>
          ))}
          {row.tags.length > 2 && (
            <Badge variant="outline" className="text-xs px-2 py-0.5">
              +{row.tags.length - 2}
            </Badge>
          )}
        </div>
      ),
      searchable: true,
    },
    {
      key: "scores",
      header: "Overall Score",
      width: "120px",
      cell: (_value, row) => (
        <div className="flex items-center justify-center">
          <CircularProgress
            value={calculateOverallScore(row.scores)}
            size="sm"
            className="text-primary"
          />
        </div>
      ),
      searchable: false,
    },
    {
      key: "created_at",
      header: "Generated",
      width: "120px",
      cell: (_value, row) => (
        <div className="text-sm text-muted-foreground">
          {formatCreatedDate(row.created_at)}
        </div>
      ),
      searchable: false,
    },
    {
      key: "is_saved",
      header: "Status",
      width: "80px",
      cell: (_value, row) => (
        <div className="flex items-center justify-center">
          {(row._optimisticSaved || row.is_saved) && (
            <Tooltip>
              <TooltipTrigger>
                <div className="inline-flex h-6 w-6 items-center justify-center rounded-full text-white text-xs font-medium shadow-sm bg-green-500">
                  ✓
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Saved to library</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      ),
      searchable: false,
    },
  ];

  // Row actions - only View and Save
  const rowActions: RowAction<TopicTableRow>[] = [
    {
      label: "View",
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: TopicTableRow) => onViewDetails(row.id),
      tooltip: "Quick view topic details",
      showLabel: true,
      primary: true,
    },
    {
      label: "Save",
      icon: <Save className="h-4 w-4" />,
      onClick: (row: TopicTableRow) => onTopicSave(row.id),
      tooltip: "Save to library",
      showLabel: true,
      disabled: (row: TopicTableRow): boolean =>
        !!(row._isBeingSaved || row.is_saved || row._optimisticSaved),
      variant: "default" as const,
    },
  ];

  // Handle row click for selection - but not on action buttons
  const handleRowClick = (row: TopicTableRow) => {
    onTopicSelect(row.id, !row.selected);
  };

  // Custom row renderer to handle highlighted state
  const getRowClassName = (row: TopicTableRow) => {
    const baseClasses = "transition-colors hover:bg-muted/50";
    const selectedClasses = row.selected ? "bg-muted" : "";
    const highlightedClasses = row.highlighted
      ? "bg-green-50/50 dark:bg-green-950/20 border-l-4 border-l-green-500"
      : "";

    return cn(baseClasses, selectedClasses, highlightedClasses);
  };

  if (topics.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} style={{ width: column.width }}>
                  {column.header}
                </TableHead>
              ))}
              <TableHead className="w-[200px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((row, _index) => (
              <TableRow
                key={row.id}
                className={getRowClassName(row)}
                onClick={() => handleRowClick(row)}
                data-state={row.selected ? "selected" : undefined}
              >
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    {column.cell
                      ? column.cell(row[column.key], row)
                      : (row[column.key] as string) || "--"}
                  </TableCell>
                ))}
                <TableCell className="w-[200px]">
                  <div className="flex items-center justify-end gap-1">
                    {rowActions
                      .filter((action) => {
                        if (typeof action.disabled === "function") {
                          return !action.disabled(row);
                        }
                        return !action.disabled;
                      })
                      .map((action, actionIndex) => (
                        <Tooltip key={`action-${action.label}-${actionIndex}`}>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className={cn(
                                "inline-flex h-8 px-2 gap-1 items-center justify-center rounded-md border border-input bg-background text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                                action.primary &&
                                  "border-primary text-primary hover:bg-primary/10 hover:text-primary",
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                action.onClick?.(row);
                              }}
                              disabled={
                                typeof action.disabled === "function"
                                  ? action.disabled(row)
                                  : action.disabled
                              }
                            >
                              {action.icon}
                              {action.showLabel && (
                                <span className="text-xs font-medium">
                                  {action.label}
                                </span>
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{action.tooltip || action.label}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
});
