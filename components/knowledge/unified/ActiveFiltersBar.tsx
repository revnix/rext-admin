"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toDateString } from "@/lib/knowledge/filtering";
import type {
  KnowledgeFilterState,
  UnifiedKnowledgeStatus,
} from "@/types/knowledge";
import type { KnowledgeType } from "@/types/workspace";
import {
  KNOWLEDGE_TYPE_LABELS,
  STATUS_CLASSES,
  STATUS_LABELS,
  TYPE_COLORS,
} from "./types";

interface ActiveFiltersBarProps {
  filters: KnowledgeFilterState;
  onRemoveType: (type: KnowledgeType) => void;
  onRemoveStatus: (status: UnifiedKnowledgeStatus) => void;
  onRemoveTag: (tag: string) => void;
  onClearDates: () => void;
  onClearWordCount: () => void;
}

/**
 * Displays active filter chips that can be individually dismissed.
 * Shows type filters, status filters, tags, date range, and word count.
 */
export function ActiveFiltersBar({
  filters,
  onRemoveType,
  onRemoveStatus,
  onRemoveTag,
  onClearDates,
  onClearWordCount,
}: ActiveFiltersBarProps) {
  const {
    typeFilters,
    statusFilters,
    tagFilters,
    dateRange,
    minWordCount,
    maxWordCount,
  } = filters;

  const hasChips =
    typeFilters.length > 0 ||
    statusFilters.length > 0 ||
    tagFilters.length > 0 ||
    dateRange.from !== null ||
    dateRange.to !== null ||
    minWordCount !== null ||
    maxWordCount !== null;

  if (!hasChips) {
    return null;
  }

  return (
    <ScrollArea className="w-full whitespace-nowrap rounded-md border bg-muted/30 p-2">
      <div className="flex items-center gap-2">
        {typeFilters.map((type) => (
          <Badge
            key={`type-${type}`}
            variant="outline"
            className={cn("flex items-center gap-1 border", TYPE_COLORS[type])}
          >
            {KNOWLEDGE_TYPE_LABELS[type]}
            <button
              type="button"
              className="ml-1 text-muted-foreground hover:text-foreground"
              onClick={() => onRemoveType(type)}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        {statusFilters.map((status) => (
          <Badge
            key={`status-${status}`}
            variant="outline"
            className={cn(
              "flex items-center gap-1 border",
              STATUS_CLASSES[status],
            )}
          >
            {STATUS_LABELS[status]}
            <button
              type="button"
              className="ml-1 text-muted-foreground hover:text-foreground"
              onClick={() => onRemoveStatus(status)}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        {tagFilters.map((tag) => (
          <Badge
            key={`tag-${tag}`}
            variant="secondary"
            className="flex items-center gap-1"
          >
            {tag}
            <button
              type="button"
              className="ml-1 text-muted-foreground hover:text-foreground"
              onClick={() => onRemoveTag(tag)}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        {(dateRange.from || dateRange.to) && (
          <Badge variant="outline" className="flex items-center gap-1">
            {dateRange.from ? toDateString(dateRange.from) : "Start"}
            <span>→</span>
            {dateRange.to ? toDateString(dateRange.to) : "End"}
            <button
              type="button"
              className="ml-1 text-muted-foreground hover:text-foreground"
              onClick={onClearDates}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {(minWordCount !== null || maxWordCount !== null) && (
          <Badge variant="outline" className="flex items-center gap-1">
            {minWordCount ?? "0"} – {maxWordCount ?? "∞"} words
            <button
              type="button"
              className="ml-1 text-muted-foreground hover:text-foreground"
              onClick={onClearWordCount}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
      </div>
    </ScrollArea>
  );
}
