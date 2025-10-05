"use client";

import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toDateString } from "@/lib/knowledge/filtering";
import { cn } from "@/lib/utils";
import type {
  KnowledgeDuplicateReason,
  UnifiedKnowledgeItem,
} from "@/types/knowledge";
import {
  DUPLICATE_REASON_LABELS,
  KNOWLEDGE_TYPE_LABELS,
  STATUS_CLASSES,
  STATUS_LABELS,
  TYPE_COLORS,
} from "./types";

/**
 * Formats duplicate badge text based on the reasons detected
 */
const formatDuplicateBadgeText = (
  reasons: KnowledgeDuplicateReason[],
): string => {
  if (reasons.length === 0) {
    return "";
  }

  if (reasons.length === 1) {
    return DUPLICATE_REASON_LABELS[reasons[0]];
  }

  return "Multiple similarities";
};

interface KnowledgeRowProps {
  item: UnifiedKnowledgeItem;
  duplicateReasons?: KnowledgeDuplicateReason[];
}

/**
 * Row/list view component for displaying a single knowledge item.
 * Used in list layouts for the unified knowledge list.
 */
export function KnowledgeRow({
  item,
  duplicateReasons = [],
}: KnowledgeRowProps) {
  const hasDuplicates = duplicateReasons.length > 0;
  const duplicateLabel = formatDuplicateBadgeText(duplicateReasons);
  const duplicateTitle = duplicateReasons
    .map((reason) => DUPLICATE_REASON_LABELS[reason])
    .join(", ");

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4 transition hover:bg-muted/60 md:flex-row md:items-start md:justify-between">
      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn("border", TYPE_COLORS[item.type])}
          >
            {KNOWLEDGE_TYPE_LABELS[item.type]}
          </Badge>
          <h3 className="text-base font-semibold">{item.title}</h3>
          {hasDuplicates && (
            <Badge
              variant="outline"
              title={duplicateTitle}
              className="flex items-center gap-1 border border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-200/70 dark:bg-amber-900/30 dark:text-amber-100"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              {duplicateLabel}
            </Badge>
          )}
          {item.status && (
            <Badge
              variant="outline"
              className={cn("border", STATUS_CLASSES[item.status])}
            >
              {STATUS_LABELS[item.status]}
            </Badge>
          )}
        </div>
        {item.subtitle && (
          <p className="text-sm text-muted-foreground">{item.subtitle}</p>
        )}
        {item.preview && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {item.preview}
          </p>
        )}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 6).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {item.tags.length > 6 && (
              <Badge variant="outline" className="text-xs">
                +{item.tags.length - 6}
              </Badge>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-col items-start gap-1 text-xs text-muted-foreground md:items-end">
        <span>Created {toDateString(item.createdAt)}</span>
        {item.updatedAt && item.updatedAt !== item.createdAt && (
          <span>Updated {toDateString(item.updatedAt)}</span>
        )}
        {(item.wordCount || item.charCount) && (
          <span>
            {item.wordCount ?? Math.round((item.charCount || 0) / 5)} words
          </span>
        )}
      </div>
    </div>
  );
}
