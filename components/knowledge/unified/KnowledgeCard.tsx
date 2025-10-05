"use client";

import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toDateString } from "@/lib/knowledge/filtering";
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

interface KnowledgeCardProps {
  item: UnifiedKnowledgeItem;
  duplicateReasons?: KnowledgeDuplicateReason[];
}

/**
 * Card view component for displaying a single knowledge item.
 * Used in grid layouts for the unified knowledge list.
 */
export function KnowledgeCard({
  item,
  duplicateReasons = [],
}: KnowledgeCardProps) {
  const hasDuplicates = duplicateReasons.length > 0;
  const duplicateLabel = formatDuplicateBadgeText(duplicateReasons);
  const duplicateTitle = duplicateReasons
    .map((reason) => DUPLICATE_REASON_LABELS[reason])
    .join(", ");

  return (
    <Card className="h-full overflow-hidden">
      <CardContent className="flex h-full flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn("border", TYPE_COLORS[item.type])}
            >
              {KNOWLEDGE_TYPE_LABELS[item.type]}
            </Badge>
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
          </div>
          {item.status && (
            <Badge
              variant="outline"
              className={cn("border", STATUS_CLASSES[item.status])}
            >
              {STATUS_LABELS[item.status]}
            </Badge>
          )}
        </div>
        <div className="space-y-2">
          <h3 className="text-base font-semibold">{item.title}</h3>
          {item.subtitle && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {item.subtitle}
            </p>
          )}
          {item.preview && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {item.preview}
            </p>
          )}
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Created {toDateString(item.createdAt)}</span>
          {item.updatedAt && item.updatedAt !== item.createdAt && (
            <span>· Updated {toDateString(item.updatedAt)}</span>
          )}
          {(item.wordCount || item.charCount) && (
            <span>
              · {item.wordCount ?? Math.round((item.charCount || 0) / 5)} words
            </span>
          )}
        </div>
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {item.tags.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{item.tags.length - 4}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
