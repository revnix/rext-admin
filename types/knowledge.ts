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

// ============================================================================
// KNOWLEDGE STORE STATE TYPES
// ============================================================================

/**
 * Web Knowledge Store State
 * Manages web-sourced knowledge items with search, sorting, and selection.
 */
export interface WebKnowledgeState {
  // Data
  items: WebKnowledge[];
  selectedItems: string[];

  // UI State
  isLoading: boolean;
  isAdding: boolean;
  error: string | null;
  searchQuery: string;
  sortBy: "created_at" | "title" | "status";
  sortOrder: "asc" | "desc";

  // Actions
  setItems: (items: WebKnowledge[]) => void;
  addItem: (item: WebKnowledge) => void;
  updateItem: (id: string, updates: Partial<WebKnowledge>) => void;
  removeItem: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setAdding: (adding: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSorting: (
    sortBy: "created_at" | "title" | "status",
    sortOrder: "asc" | "desc",
  ) => void;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  reset: () => void;
}

/**
 * File Knowledge Store State
 * Manages file-based knowledge with upload progress tracking.
 */
export interface FileKnowledgeState {
  // Data
  items: FileKnowledge[];
  selectedItems: string[];

  // Upload state
  uploadProgress: Record<string, import("./workspace").FileUploadProgress>;
  isUploading: boolean;

  // UI State
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  sortBy: "created_at" | "name" | "size" | "type";
  sortOrder: "asc" | "desc";
  typeFilter: string | null;

  // Actions
  setItems: (items: FileKnowledge[]) => void;
  addItem: (item: FileKnowledge) => void;
  updateItem: (id: string, updates: Partial<FileKnowledge>) => void;
  removeItem: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSorting: (
    sortBy: "created_at" | "name" | "size" | "type",
    sortOrder: "asc" | "desc",
  ) => void;
  setTypeFilter: (type: string | null) => void;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;

  // Upload actions
  startUpload: (fileId: string, fileName: string) => void;
  updateUploadProgress: (fileId: string, progress: number) => void;
  completeUpload: (fileId: string, item: FileKnowledge) => void;
  failUpload: (fileId: string, error: string) => void;
  removeUpload: (fileId: string) => void;

  reset: () => void;
}

/**
 * Text Knowledge Store State
 * Manages text-based knowledge with inline editing capabilities.
 */
export interface TextKnowledgeState {
  // Data
  items: TextKnowledge[];
  selectedItems: string[];

  // Editing state
  editingItem: string | null;
  editFormData: Partial<TextKnowledge>;
  isEditing: boolean;

  // UI State
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  searchQuery: string;
  sortBy: "created_at" | "title" | "updated_at";
  sortOrder: "asc" | "desc";
  tagFilter: string | null;

  // Actions
  setItems: (items: TextKnowledge[]) => void;
  addItem: (item: TextKnowledge) => void;
  updateItem: (id: string, updates: Partial<TextKnowledge>) => void;
  removeItem: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSorting: (
    sortBy: "created_at" | "title" | "updated_at",
    sortOrder: "asc" | "desc",
  ) => void;
  setTagFilter: (tag: string | null) => void;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;

  // Editing actions
  startEdit: (id: string) => void;
  updateEditForm: (updates: Partial<TextKnowledge>) => void;
  cancelEdit: () => void;
  saveEdit: () => void;

  reset: () => void;
}

/**
 * Unified Knowledge Store State
 * Coordinates across web, file, and text knowledge stores.
 */
export interface UnifiedKnowledgeState {
  // Current workspace context
  currentWorkspaceId: string | null;

  // UI State
  selectedKnowledgeType: KnowledgeType;
  isRefreshing: boolean;
  lastRefresh: number;

  // Actions
  setCurrentWorkspace: (workspaceId: string | null) => void;
  setSelectedKnowledgeType: (type: KnowledgeType) => void;
  setRefreshing: (refreshing: boolean) => void;
  refreshAll: () => void;
  resetAll: () => void;
}

/**
 * Global Knowledge Search Store State
 * Cross-type knowledge search with filtering and relevance scoring.
 */
export interface GlobalKnowledgeSearchState {
  // Search state
  searchQuery: string;
  isSearching: boolean;
  searchResults: import("./workspace").GlobalSearchResult[];
  totalResults: number;

  // Filters
  typeFilters: KnowledgeType[];
  dateRange: { start: string | null; end: string | null };
  tagFilters: string[];

  // UI state
  searchHistory: string[];
  isAdvancedSearchOpen: boolean;
  error: string | null;

  // Actions
  setSearchQuery: (query: string) => void;
  performSearch: (workspaceId: string) => Promise<void>;
  clearResults: () => void;
  setTypeFilters: (types: KnowledgeType[]) => void;
  setDateRange: (start: string | null, end: string | null) => void;
  setTagFilters: (tags: string[]) => void;
  addToHistory: (query: string) => void;
  clearHistory: () => void;
  toggleAdvancedSearch: () => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

/**
 * Knowledge Filter Store State
 * Extends KnowledgeFilterState with store actions for filtering and sorting.
 */
export interface KnowledgeFilterStore extends KnowledgeFilterState {
  setSearchQuery: (query: string) => void;
  setTypeFilters: (types: KnowledgeType[]) => void;
  toggleTypeFilter: (type: KnowledgeType) => void;
  setStatusFilters: (statuses: UnifiedKnowledgeStatus[]) => void;
  toggleStatusFilter: (status: UnifiedKnowledgeStatus) => void;
  setTagFilters: (tags: string[]) => void;
  addTagFilter: (tag: string) => void;
  removeTagFilter: (tag: string) => void;
  setDateRange: (from: string | null, to: string | null) => void;
  setWordCountRange: (min: number | null, max: number | null) => void;
  setSort: (
    sortBy: KnowledgeSortKey,
    sortOrder: KnowledgeSortDirection,
  ) => void;
  toggleSortOrder: () => void;
  setViewMode: (mode: KnowledgeListViewMode) => void;
  resetFilters: () => void;
}
