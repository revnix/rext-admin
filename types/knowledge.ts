/**
 * Knowledge Domain Types
 *
 * Shared type primitives for unified knowledge experiences that span
 * multiple knowledge sources (web, file, text). These types complement the
 * source-specific models defined in `types/workspace.ts` and power
 * aggregated views, filters, and sorting behaviour across knowledge types.
 */

import type {
  FileKnowledge,
  FileKnowledgeStatus,
  KnowledgeType,
  TextKnowledge,
  WebKnowledge,
  WebKnowledgeStatus,
} from "./workspace";

/**
 * Union of knowledge records returned by the individual services. This keeps
 * the raw payload available for advanced rendering while allowing derived
 * fields for shared UI concerns.
 */
export type UnifiedKnowledgeSource =
  | WebKnowledge
  | FileKnowledge
  | TextKnowledge;

/**
 * Normalised knowledge item shape used in aggregated lists. Provides common
 * fields used for filtering, sorting, and display while preserving access to
 * the original source payload.
 */
export interface UnifiedKnowledgeItem {
  id: string;
  workspaceId: string;
  type: KnowledgeType;
  title: string;
  subtitle?: string;
  url?: string;
  status?: UnifiedKnowledgeStatus;
  tags?: string[];
  preview?: string;
  wordCount?: number;
  charCount?: number;
  createdAt: string;
  updatedAt?: string;
  source: UnifiedKnowledgeSource;
}

/**
 * Status options across knowledge types. Serves as a single filter surface
 * combining the individual enums defined in the domain models.
 */
export type UnifiedKnowledgeStatus = WebKnowledgeStatus | FileKnowledgeStatus;

/**
 * Supported sorting keys for aggregated knowledge listings.
 */
export type KnowledgeSortKey =
  | "created_at"
  | "updated_at"
  | "title"
  | "type"
  | "status"
  | "word_count";

export type KnowledgeSortDirection = "asc" | "desc";

/**
 * Persisted filter state describing the advanced filtering controls exposed in
 * the all-knowledge experience.
 */
export interface KnowledgeFilterState {
  searchQuery: string;
  typeFilters: KnowledgeType[];
  statusFilters: UnifiedKnowledgeStatus[];
  tagFilters: string[];
  dateRange: {
    from: string | null;
    to: string | null;
  };
  minWordCount: number | null;
  maxWordCount: number | null;
  sortBy: KnowledgeSortKey;
  sortOrder: KnowledgeSortDirection;
  viewMode: KnowledgeListViewMode;
}

export type KnowledgeListViewMode = "grid" | "list";

/**
 * Default filter state to seed the zustand store and provide a convenient
 * reset target for the UI.
 */
export const defaultKnowledgeFilterState: KnowledgeFilterState = {
  searchQuery: "",
  typeFilters: [],
  statusFilters: [],
  tagFilters: [],
  dateRange: {
    from: null,
    to: null,
  },
  minWordCount: null,
  maxWordCount: null,
  sortBy: "created_at",
  sortOrder: "desc",
  viewMode: "list",
};

/**
 * Convenience helper for checking if any filters (besides sorting/view mode)
 * are currently applied. Useful for toggling reset controls in the UI.
 */
export const hasActiveKnowledgeFilters = (
  state: KnowledgeFilterState,
): boolean => {
  return (
    state.searchQuery.trim().length > 0 ||
    state.typeFilters.length > 0 ||
    state.statusFilters.length > 0 ||
    state.tagFilters.length > 0 ||
    state.dateRange.from !== null ||
    state.dateRange.to !== null ||
    state.minWordCount !== null ||
    state.maxWordCount !== null
  );
};

// ============================================================================
// DUPLICATE DETECTION TYPES
// ============================================================================

/**
 * Reasons an item is considered a potential duplicate when compared with
 * other knowledge records.
 */
export type KnowledgeDuplicateReason = "url" | "title" | "content";

/**
 * Group of knowledge items that share a duplicate signature for a given
 * reason. Each group contains at least two items that triggered the same
 * duplicate heuristic (e.g. normalized URL match).
 */
export interface KnowledgeDuplicateGroup {
  reason: KnowledgeDuplicateReason;
  signature: string;
  items: UnifiedKnowledgeItem[];
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

/**
 * Aggregated totals derived from workspace knowledge items.
 */
export interface KnowledgeAnalyticsTotals {
  totalItems: number;
  completedItems: number;
  inProgressItems: number;
  failedItems: number;
  completionRate: number; // 0-1 normalized ratio
  totalWordCount: number;
  averageWordCount: number | null;
  totalCharCount: number;
  averageCharCount: number | null;
}

/**
 * Status-specific analytics for visualizing distribution.
 */
export interface KnowledgeStatusMetric {
  status: UnifiedKnowledgeStatus;
  count: number;
  percentage: number; // 0-1 normalized ratio
}

/**
 * Type-specific analytics to compare web/file/text coverage.
 */
export interface KnowledgeTypeMetric {
  type: KnowledgeType;
  count: number;
  percentage: number; // 0-1 normalized ratio
}

/**
 * Shape returned by analytics utilities to power dashboard views.
 */
export interface KnowledgeAnalyticsSummary {
  totals: KnowledgeAnalyticsTotals;
  statusMetrics: KnowledgeStatusMetric[];
  typeMetrics: KnowledgeTypeMetric[];
  recentItems: UnifiedKnowledgeItem[];
  updatedAt?: string;
}
