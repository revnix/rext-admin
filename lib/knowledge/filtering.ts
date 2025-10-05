/**
 * Knowledge Filtering Utilities
 *
 * Pure functions for filtering, sorting, and aggregating unified knowledge items.
 * These utilities power the all-knowledge-list component and can be reused
 * anywhere similar filtering logic is needed.
 */

import { format } from "date-fns";
import { MAX_PREVIEW_LENGTH } from "@/components/knowledge/unified/types";
import type {
  KnowledgeFilterState,
  UnifiedKnowledgeItem,
} from "@/types/knowledge";
import type {
  FileKnowledge,
  KnowledgeType,
  TextKnowledge,
  WebKnowledge,
} from "@/types/workspace";

/**
 * Formats a preview string with truncation
 */
export const formatPreview = (content?: string | null): string => {
  if (!content) return "";
  if (content.length <= MAX_PREVIEW_LENGTH) return content;
  return `${content.slice(0, MAX_PREVIEW_LENGTH)}…`;
};

/**
 * Formats a date string for display
 */
export const toDateString = (value: string | null): string => {
  if (!value) return "";
  try {
    return format(new Date(value), "MMM d, yyyy");
  } catch {
    return value;
  }
};

/**
 * Builds unified knowledge items from individual knowledge type arrays
 */
export const buildUnifiedItems = (
  workspaceId: string,
  webItems: WebKnowledge[],
  fileItems: FileKnowledge[],
  textItems: TextKnowledge[],
): UnifiedKnowledgeItem[] => {
  const items: UnifiedKnowledgeItem[] = [];

  webItems
    .filter((item) => item.workspace_id === workspaceId)
    .forEach((item) => {
      items.push({
        id: item.id,
        workspaceId: item.workspace_id,
        type: "web",
        title: item.title || item.url || "Untitled",
        subtitle: item.url,
        url: item.url,
        status: item.status,
        wordCount: item.word_count,
        charCount: item.char_count,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        preview: formatPreview(item.content),
        source: item,
      });
    });

  fileItems
    .filter((item) => item.workspace_id === workspaceId)
    .forEach((item) => {
      const displayName =
        "file_name" in item && typeof item.file_name === "string"
          ? item.file_name
          : item.name;

      items.push({
        id: item.id,
        workspaceId: item.workspace_id,
        type: "file",
        title: displayName || "Untitled File",
        subtitle: item.type,
        status: item.status,
        wordCount: item.word_count,
        charCount: item.char_count,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        preview: formatPreview(item.content),
        source: item,
      });
    });

  textItems
    .filter((item) => item.workspace_id === workspaceId)
    .forEach((item) => {
      items.push({
        id: item.id,
        workspaceId: item.workspace_id,
        type: "text",
        title: item.title || "Untitled Note",
        preview: formatPreview(item.content),
        status: undefined,
        tags: item.tags || [],
        wordCount: item.word_count,
        charCount: item.char_count,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        source: item,
      });
    });

  return items;
};

/**
 * Applies all filters to a list of unified knowledge items
 */
export const applyFilters = (
  items: UnifiedKnowledgeItem[],
  filters: KnowledgeFilterState,
): UnifiedKnowledgeItem[] => {
  const {
    searchQuery,
    typeFilters,
    statusFilters,
    tagFilters,
    dateRange,
    minWordCount,
    maxWordCount,
    sortBy,
    sortOrder,
  } = filters;

  const query = searchQuery.trim().toLowerCase();

  const filtered = items.filter((item) => {
    if (typeFilters.length > 0 && !typeFilters.includes(item.type)) {
      return false;
    }

    if (statusFilters.length > 0) {
      if (!item.status || !statusFilters.includes(item.status)) {
        return false;
      }
    }

    if (tagFilters.length > 0) {
      const tags = item.tags || [];
      const matches = tagFilters.every((tag) =>
        tags.some((current) => current.toLowerCase() === tag.toLowerCase()),
      );
      if (!matches) {
        return false;
      }
    }

    if (dateRange.from) {
      const created = new Date(item.createdAt).getTime();
      const from = new Date(dateRange.from).getTime();
      if (Number.isFinite(created) && created < from) {
        return false;
      }
    }

    if (dateRange.to) {
      const created = new Date(item.createdAt).getTime();
      const to = new Date(dateRange.to).getTime();
      if (Number.isFinite(created) && created > to) {
        return false;
      }
    }

    const wordCount = item.wordCount ?? item.charCount ?? 0;
    if (minWordCount !== null && wordCount < minWordCount) {
      return false;
    }
    if (maxWordCount !== null && wordCount > maxWordCount) {
      return false;
    }

    if (query.length > 0) {
      const haystacks = [
        item.title,
        item.subtitle,
        item.url,
        item.preview,
        ...(item.tags || []),
      ]
        .filter(
          (value): value is string => value !== null && value !== undefined,
        )
        .map((value) => String(value).toLowerCase());

      const hasMatch = haystacks.some((value) => value.includes(query));
      if (!hasMatch) {
        return false;
      }
    }

    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const factor = sortOrder === "asc" ? 1 : -1;

    switch (sortBy) {
      case "title": {
        return factor * a.title.localeCompare(b.title);
      }
      case "type": {
        return factor * a.type.localeCompare(b.type);
      }
      case "status": {
        return factor * (a.status || "").localeCompare(b.status || "");
      }
      case "word_count": {
        const aCount = a.wordCount ?? a.charCount ?? 0;
        const bCount = b.wordCount ?? b.charCount ?? 0;
        return factor * (aCount - bCount);
      }
      case "updated_at": {
        const aDate = new Date(a.updatedAt || a.createdAt).getTime();
        const bDate = new Date(b.updatedAt || b.createdAt).getTime();
        return factor * (aDate - bDate);
      }
      default: {
        const aDate = new Date(a.createdAt).getTime();
        const bDate = new Date(b.createdAt).getTime();
        return factor * (aDate - bDate);
      }
    }
  });

  return sorted;
};

/**
 * Aggregates counts by type and status from a list of items
 */
export const aggregateCounts = (items: UnifiedKnowledgeItem[]) => {
  return items.reduce(
    (acc, item) => {
      acc.total += 1;
      acc.byType[item.type] += 1;
      if (item.status) {
        acc.byStatus[item.status] = (acc.byStatus[item.status] || 0) + 1;
      }
      return acc;
    },
    {
      total: 0,
      byType: {
        web: 0,
        file: 0,
        text: 0,
      } as Record<KnowledgeType, number>,
      byStatus: {} as Record<string, number>,
    },
  );
};

/**
 * Formats duplicate badge text based on the reasons detected
 */
export const formatDuplicateBadgeText = (
  reasons: import("@/types/knowledge").KnowledgeDuplicateReason[],
): string => {
  if (reasons.length === 0) {
    return "";
  }

  if (reasons.length === 1) {
    const DUPLICATE_REASON_LABELS = {
      url: "Matching URL",
      title: "Matching Title",
      content: "Similar Content",
    };
    return DUPLICATE_REASON_LABELS[reasons[0]];
  }

  return "Multiple similarities";
};
