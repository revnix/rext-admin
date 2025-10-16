/**
 * Knowledge Management Stores
 *
 * Dedicated Zustand stores for web, file, and text knowledge management
 * with optimistic updates, error handling, and UI state management.
 */

import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import {
  defaultKnowledgeFilterState,
  type KnowledgeFilterState,
  type KnowledgeListViewMode,
  type KnowledgeSortDirection,
  type KnowledgeSortKey,
  type UnifiedKnowledgeStatus,
} from "@/types/knowledge";
import type {
  FileKnowledge,
  KnowledgeType,
  TextKnowledge,
  WebKnowledge,
} from "@/types/workspace";

// SSR-safe storage implementation
const getStorage = () => {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  return localStorage;
};

// ============================================================================
// WEB KNOWLEDGE STORE
// ============================================================================

interface WebKnowledgeState {
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

export const useWebKnowledgeStore = create<WebKnowledgeState>()(
  devtools(
    persist(
      (set, _get) => ({
        // Initial state
        items: [],
        selectedItems: [],
        isLoading: false,
        isAdding: false,
        error: null,
        searchQuery: "",
        sortBy: "created_at",
        sortOrder: "desc",

        // Actions
        setItems: (items) => set({ items }),

        addItem: (item) =>
          set((state) => ({
            items: [item, ...state.items],
          })),

        updateItem: (id, updates) =>
          set((state) => ({
            items: state.items.map((item) =>
              item.id === id ? { ...item, ...updates } : item,
            ),
          })),

        removeItem: (id) =>
          set((state) => ({
            items: state.items.filter((item) => item.id !== id),
            selectedItems: state.selectedItems.filter(
              (itemId) => itemId !== id,
            ),
          })),

        setLoading: (loading) => set({ isLoading: loading }),
        setAdding: (adding) => set({ isAdding: adding }),
        setError: (error) => set({ error }),
        setSearchQuery: (query) => set({ searchQuery: query }),

        setSorting: (sortBy, sortOrder) => set({ sortBy, sortOrder }),

        toggleSelection: (id) =>
          set((state) => ({
            selectedItems: state.selectedItems.includes(id)
              ? state.selectedItems.filter((itemId) => itemId !== id)
              : [...state.selectedItems, id],
          })),

        selectAll: () =>
          set((state) => ({
            selectedItems: state.items.map((item) => item.id),
          })),

        deselectAll: () => set({ selectedItems: [] }),

        reset: () =>
          set({
            items: [],
            selectedItems: [],
            isLoading: false,
            isAdding: false,
            error: null,
            searchQuery: "",
          }),
      }),
      {
        name: "web-knowledge-store",
        storage: createJSONStorage(() => getStorage()),
        partialize: (state) => ({
          searchQuery: state.searchQuery,
          sortBy: state.sortBy,
          sortOrder: state.sortOrder,
        }),
      },
    ),
    { name: "web-knowledge-store" },
  ),
);

// ============================================================================
// FILE KNOWLEDGE STORE
// ============================================================================

interface FileUploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: "uploading" | "processing" | "completed" | "failed";
  error?: string;
}

interface FileKnowledgeState {
  // Data
  items: FileKnowledge[];
  selectedItems: string[];

  // Upload state
  uploadProgress: Record<string, FileUploadProgress>;
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

export const useFileKnowledgeStore = create<FileKnowledgeState>()(
  devtools(
    persist(
      (set, _get) => ({
        // Initial state
        items: [],
        selectedItems: [],
        uploadProgress: {},
        isUploading: false,
        isLoading: false,
        error: null,
        searchQuery: "",
        sortBy: "created_at",
        sortOrder: "desc",
        typeFilter: null,

        // Actions
        setItems: (items) => set({ items }),

        addItem: (item) =>
          set((state) => ({
            items: [item, ...state.items],
          })),

        updateItem: (id, updates) =>
          set((state) => ({
            items: state.items.map((item) =>
              item.id === id ? { ...item, ...updates } : item,
            ),
          })),

        removeItem: (id) =>
          set((state) => ({
            items: state.items.filter((item) => item.id !== id),
            selectedItems: state.selectedItems.filter(
              (itemId) => itemId !== id,
            ),
          })),

        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        setSearchQuery: (query) => set({ searchQuery: query }),
        setSorting: (sortBy, sortOrder) => set({ sortBy, sortOrder }),
        setTypeFilter: (type) => set({ typeFilter: type }),

        toggleSelection: (id) =>
          set((state) => ({
            selectedItems: state.selectedItems.includes(id)
              ? state.selectedItems.filter((itemId) => itemId !== id)
              : [...state.selectedItems, id],
          })),

        selectAll: () =>
          set((state) => ({
            selectedItems: state.items.map((item) => item.id),
          })),

        deselectAll: () => set({ selectedItems: [] }),

        // Upload actions
        startUpload: (fileId, fileName) =>
          set((state) => ({
            uploadProgress: {
              ...state.uploadProgress,
              [fileId]: {
                fileId,
                fileName,
                progress: 0,
                status: "uploading",
              },
            },
            isUploading: true,
          })),

        updateUploadProgress: (fileId, progress) =>
          set((state) => ({
            uploadProgress: {
              ...state.uploadProgress,
              [fileId]: {
                ...state.uploadProgress[fileId],
                progress,
                status: progress === 100 ? "processing" : "uploading",
              },
            },
          })),

        completeUpload: (fileId, item) =>
          set((state) => {
            const { [fileId]: _removed, ...restProgress } =
              state.uploadProgress;
            return {
              uploadProgress: restProgress,
              isUploading: Object.keys(restProgress).length > 0,
              items: [item, ...state.items],
            };
          }),

        failUpload: (fileId, error) =>
          set((state) => ({
            uploadProgress: {
              ...state.uploadProgress,
              [fileId]: {
                ...state.uploadProgress[fileId],
                status: "failed",
                error,
              },
            },
          })),

        removeUpload: (fileId) =>
          set((state) => {
            const { [fileId]: _removed, ...restProgress } =
              state.uploadProgress;
            return {
              uploadProgress: restProgress,
              isUploading: Object.keys(restProgress).length > 0,
            };
          }),

        reset: () =>
          set({
            items: [],
            selectedItems: [],
            uploadProgress: {},
            isUploading: false,
            isLoading: false,
            error: null,
            searchQuery: "",
            typeFilter: null,
          }),
      }),
      {
        name: "file-knowledge-store",
        storage: createJSONStorage(() => getStorage()),
        partialize: (state) => ({
          searchQuery: state.searchQuery,
          sortBy: state.sortBy,
          sortOrder: state.sortOrder,
          typeFilter: state.typeFilter,
        }),
      },
    ),
    { name: "file-knowledge-store" },
  ),
);

// ============================================================================
// TEXT KNOWLEDGE STORE
// ============================================================================

interface TextKnowledgeState {
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

export const useTextKnowledgeStore = create<TextKnowledgeState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        items: [],
        selectedItems: [],
        editingItem: null,
        editFormData: {},
        isEditing: false,
        isLoading: false,
        isSaving: false,
        error: null,
        searchQuery: "",
        sortBy: "updated_at",
        sortOrder: "desc",
        tagFilter: null,

        // Actions
        setItems: (items) => set({ items }),

        addItem: (item) =>
          set((state) => ({
            items: [item, ...state.items],
          })),

        updateItem: (id, updates) =>
          set((state) => ({
            items: state.items.map((item) =>
              item.id === id ? { ...item, ...updates } : item,
            ),
          })),

        removeItem: (id) =>
          set((state) => ({
            items: state.items.filter((item) => item.id !== id),
            selectedItems: state.selectedItems.filter(
              (itemId) => itemId !== id,
            ),
          })),

        setLoading: (loading) => set({ isLoading: loading }),
        setSaving: (saving) => set({ isSaving: saving }),
        setError: (error) => set({ error }),
        setSearchQuery: (query) => set({ searchQuery: query }),
        setSorting: (sortBy, sortOrder) => set({ sortBy, sortOrder }),
        setTagFilter: (tag) => set({ tagFilter: tag }),

        toggleSelection: (id) =>
          set((state) => ({
            selectedItems: state.selectedItems.includes(id)
              ? state.selectedItems.filter((itemId) => itemId !== id)
              : [...state.selectedItems, id],
          })),

        selectAll: () =>
          set((state) => ({
            selectedItems: state.items.map((item) => item.id),
          })),

        deselectAll: () => set({ selectedItems: [] }),

        // Editing actions
        startEdit: (id) =>
          set((state) => {
            const item = state.items.find((item) => item.id === id);
            return {
              editingItem: id,
              editFormData: item ? { ...item } : {},
              isEditing: true,
            };
          }),

        updateEditForm: (updates) =>
          set((state) => ({
            editFormData: { ...state.editFormData, ...updates },
          })),

        cancelEdit: () =>
          set({
            editingItem: null,
            editFormData: {},
            isEditing: false,
          }),

        saveEdit: () => {
          const state = get();
          if (state.editingItem && state.editFormData.id) {
            state.updateItem(state.editingItem, state.editFormData);
            state.cancelEdit();
          }
        },

        reset: () =>
          set({
            items: [],
            selectedItems: [],
            editingItem: null,
            editFormData: {},
            isEditing: false,
            isLoading: false,
            isSaving: false,
            error: null,
            searchQuery: "",
            tagFilter: null,
          }),
      }),
      {
        name: "text-knowledge-store",
        storage: createJSONStorage(() => getStorage()),
        partialize: (state) => ({
          searchQuery: state.searchQuery,
          sortBy: state.sortBy,
          sortOrder: state.sortOrder,
          tagFilter: state.tagFilter,
        }),
      },
    ),
    { name: "text-knowledge-store" },
  ),
);

// ============================================================================
// UNIFIED KNOWLEDGE STORE
// ============================================================================

interface UnifiedKnowledgeState {
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

export const useUnifiedKnowledgeStore = create<UnifiedKnowledgeState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentWorkspaceId: null,
      selectedKnowledgeType: "web",
      isRefreshing: false,
      lastRefresh: 0,

      // Actions
      setCurrentWorkspace: (workspaceId) =>
        set({ currentWorkspaceId: workspaceId }),

      setSelectedKnowledgeType: (type) => set({ selectedKnowledgeType: type }),

      setRefreshing: (refreshing) =>
        set({
          isRefreshing: refreshing,
          lastRefresh: refreshing ? get().lastRefresh : Date.now(),
        }),

      refreshAll: () => {
        const webStore = useWebKnowledgeStore.getState();
        const fileStore = useFileKnowledgeStore.getState();
        const textStore = useTextKnowledgeStore.getState();

        webStore.setLoading(true);
        fileStore.setLoading(true);
        textStore.setLoading(true);

        set({ isRefreshing: true });

        // This would trigger re-fetching in components using these stores
        setTimeout(() => {
          webStore.setLoading(false);
          fileStore.setLoading(false);
          textStore.setLoading(false);
          set({ isRefreshing: false, lastRefresh: Date.now() });
        }, 1000);
      },

      resetAll: () => {
        const webStore = useWebKnowledgeStore.getState();
        const fileStore = useFileKnowledgeStore.getState();
        const textStore = useTextKnowledgeStore.getState();

        webStore.reset();
        fileStore.reset();
        textStore.reset();

        set({
          currentWorkspaceId: null,
          selectedKnowledgeType: "web",
          isRefreshing: false,
          lastRefresh: 0,
        });
      },
    }),
    { name: "unified-knowledge-store" },
  ),
);

// ============================================================================
// GLOBAL KNOWLEDGE SEARCH STORE
// ============================================================================

interface GlobalSearchResult {
  id: string;
  type: KnowledgeType;
  title: string;
  content: string;
  url?: string;
  tags?: string[];
  created_at: string;
  updated_at?: string;
  status?: string;
  relevanceScore: number;
  matchedFields: string[];
  contentPreview: string;
}

interface GlobalKnowledgeSearchState {
  // Search state
  searchQuery: string;
  isSearching: boolean;
  searchResults: GlobalSearchResult[];
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

export const useGlobalKnowledgeSearchStore =
  create<GlobalKnowledgeSearchState>()(
    devtools(
      persist(
        (set, get) => ({
          // Initial state
          searchQuery: "",
          isSearching: false,
          searchResults: [],
          totalResults: 0,
          typeFilters: [],
          dateRange: { start: null, end: null },
          tagFilters: [],
          searchHistory: [],
          isAdvancedSearchOpen: false,
          error: null,

          // Actions
          setSearchQuery: (query) => set({ searchQuery: query }),

          performSearch: async (_workspaceId: string) => {
            const state = get();
            if (!state.searchQuery.trim()) {
              set({ searchResults: [], totalResults: 0 });
              return;
            }

            set({ isSearching: true, error: null });

            try {
              // Get all items from individual stores
              const webItems = useWebKnowledgeStore.getState().items;
              const fileItems = useFileKnowledgeStore.getState().items;
              const textItems = useTextKnowledgeStore.getState().items;

              const query = state.searchQuery.toLowerCase();
              const results: GlobalSearchResult[] = [];

              // Search web knowledge
              if (
                state.typeFilters.length === 0 ||
                state.typeFilters.includes("web")
              ) {
                webItems.forEach((item) => {
                  const titleMatch = item.title?.toLowerCase().includes(query);
                  const urlMatch = item.url?.toLowerCase().includes(query);
                  const matchedFields: string[] = [];
                  let relevanceScore = 0;

                  if (titleMatch) {
                    matchedFields.push("title");
                    relevanceScore += 3;
                  }
                  if (urlMatch) {
                    matchedFields.push("url");
                    relevanceScore += 2;
                  }

                  if (matchedFields.length > 0) {
                    results.push({
                      id: item.id,
                      type: "web",
                      title: item.title || "Untitled",
                      content: item.url || "",
                      url: item.url,
                      created_at: item.created_at,
                      updated_at: item.updated_at,
                      status: item.status,
                      relevanceScore,
                      matchedFields,
                      contentPreview: item.url || "",
                    });
                  }
                });
              }

              // Search file knowledge
              if (
                state.typeFilters.length === 0 ||
                state.typeFilters.includes("file")
              ) {
                fileItems.forEach((item) => {
                  const nameMatch = item.name?.toLowerCase().includes(query);
                  const contentMatch = item.content
                    ?.toLowerCase()
                    .includes(query);
                  const matchedFields: string[] = [];
                  let relevanceScore = 0;

                  if (nameMatch) {
                    matchedFields.push("title");
                    relevanceScore += 3;
                  }
                  if (contentMatch) {
                    matchedFields.push("content");
                    relevanceScore += 2;
                  }

                  if (matchedFields.length > 0) {
                    const preview = item.content
                      ? `${item.content.slice(0, 200)}...`
                      : "File content not available";

                    results.push({
                      id: item.id,
                      type: "file",
                      title: item.name || "Untitled File",
                      content: item.content || "",
                      created_at: item.created_at,
                      updated_at: item.updated_at,
                      relevanceScore,
                      matchedFields,
                      contentPreview: preview,
                    });
                  }
                });
              }

              // Search text knowledge
              if (
                state.typeFilters.length === 0 ||
                state.typeFilters.includes("text")
              ) {
                textItems.forEach((item) => {
                  const titleMatch = item.title?.toLowerCase().includes(query);
                  const contentMatch = item.content
                    ?.toLowerCase()
                    .includes(query);
                  const tagMatch = item.tags?.some((tag) =>
                    tag.toLowerCase().includes(query),
                  );
                  const matchedFields: string[] = [];
                  let relevanceScore = 0;

                  if (titleMatch) {
                    matchedFields.push("title");
                    relevanceScore += 3;
                  }
                  if (contentMatch) {
                    matchedFields.push("content");
                    relevanceScore += 2;
                  }
                  if (tagMatch) {
                    matchedFields.push("tags");
                    relevanceScore += 1;
                  }

                  if (matchedFields.length > 0) {
                    const preview = `${item.content?.slice(0, 200)}...` || "";

                    results.push({
                      id: item.id,
                      type: "text",
                      title: item.title || "Untitled Text",
                      content: item.content || "",
                      tags: item.tags,
                      created_at: item.created_at,
                      updated_at: item.updated_at,
                      relevanceScore,
                      matchedFields,
                      contentPreview: preview,
                    });
                  }
                });
              }

              // Apply date filters
              let filteredResults = results;
              if (state.dateRange.start || state.dateRange.end) {
                filteredResults = results.filter((result) => {
                  const resultDate = new Date(result.created_at);
                  const start = state.dateRange.start
                    ? new Date(state.dateRange.start)
                    : null;
                  const end = state.dateRange.end
                    ? new Date(state.dateRange.end)
                    : null;

                  if (start && resultDate < start) return false;
                  if (end && resultDate > end) return false;
                  return true;
                });
              }

              // Apply tag filters
              if (state.tagFilters.length > 0) {
                filteredResults = filteredResults.filter((result) => {
                  if (!result.tags) return false;
                  return state.tagFilters.some((filter) =>
                    result.tags?.some((tag) =>
                      tag.toLowerCase().includes(filter.toLowerCase()),
                    ),
                  );
                });
              }

              // Sort by relevance score
              filteredResults.sort(
                (a, b) => b.relevanceScore - a.relevanceScore,
              );

              set({
                searchResults: filteredResults,
                totalResults: filteredResults.length,
                isSearching: false,
              });

              // Add to search history
              if (
                state.searchQuery.trim() &&
                !state.searchHistory.includes(state.searchQuery)
              ) {
                get().addToHistory(state.searchQuery);
              }
            } catch (error) {
              set({
                error: error instanceof Error ? error.message : "Search failed",
                isSearching: false,
                searchResults: [],
                totalResults: 0,
              });
            }
          },

          clearResults: () =>
            set({ searchResults: [], totalResults: 0, searchQuery: "" }),

          setTypeFilters: (types) => set({ typeFilters: types }),

          setDateRange: (start, end) => set({ dateRange: { start, end } }),

          setTagFilters: (tags) => set({ tagFilters: tags }),

          addToHistory: (query) =>
            set((state) => ({
              searchHistory: [
                query,
                ...state.searchHistory.filter((q) => q !== query),
              ].slice(0, 10),
            })),

          clearHistory: () => set({ searchHistory: [] }),

          toggleAdvancedSearch: () =>
            set((state) => ({
              isAdvancedSearchOpen: !state.isAdvancedSearchOpen,
            })),

          setError: (error) => set({ error }),

          reset: () =>
            set({
              searchQuery: "",
              isSearching: false,
              searchResults: [],
              totalResults: 0,
              typeFilters: [],
              dateRange: { start: null, end: null },
              tagFilters: [],
              isAdvancedSearchOpen: false,
              error: null,
            }),
        }),
        {
          name: "global-knowledge-search-store",
          storage: createJSONStorage(() => getStorage()),
          partialize: (state) => ({
            searchHistory: state.searchHistory,
            typeFilters: state.typeFilters,
            tagFilters: state.tagFilters,
          }),
        },
      ),
      { name: "global-knowledge-search-store" },
    ),
  );

// ============================================================================
// KNOWLEDGE FILTER STORE (CROSS-TYPE)
// ============================================================================

type KnowledgeFilterInternalState = KnowledgeFilterState;

interface KnowledgeFilterStore extends KnowledgeFilterInternalState {
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

const createDefaultFilterState = (): KnowledgeFilterInternalState => ({
  ...defaultKnowledgeFilterState,
  typeFilters: [...defaultKnowledgeFilterState.typeFilters],
  statusFilters: [...defaultKnowledgeFilterState.statusFilters],
  tagFilters: [...defaultKnowledgeFilterState.tagFilters],
  dateRange: { ...defaultKnowledgeFilterState.dateRange },
});

export const useKnowledgeFilterStore = create<KnowledgeFilterStore>()(
  devtools(
    persist(
      (set, _get) => ({
        ...createDefaultFilterState(),

        setSearchQuery: (query) => set({ searchQuery: query }),

        setTypeFilters: (types) => set({ typeFilters: types }),

        toggleTypeFilter: (type) =>
          set((state) => ({
            typeFilters: state.typeFilters.includes(type)
              ? state.typeFilters.filter((item) => item !== type)
              : [...state.typeFilters, type],
          })),

        setStatusFilters: (statuses) => set({ statusFilters: statuses }),

        toggleStatusFilter: (status) =>
          set((state) => ({
            statusFilters: state.statusFilters.includes(status)
              ? state.statusFilters.filter((item) => item !== status)
              : [...state.statusFilters, status],
          })),

        setTagFilters: (tags) => set({ tagFilters: tags }),

        addTagFilter: (tag) =>
          set((state) => ({
            tagFilters: state.tagFilters.includes(tag)
              ? state.tagFilters
              : [...state.tagFilters, tag],
          })),

        removeTagFilter: (tag) =>
          set((state) => ({
            tagFilters: state.tagFilters.filter((item) => item !== tag),
          })),

        setDateRange: (from, to) =>
          set({
            dateRange: {
              from,
              to,
            },
          }),

        setWordCountRange: (min, max) =>
          set({
            minWordCount: min,
            maxWordCount: max,
          }),

        setSort: (sortBy, sortOrder) => set({ sortBy, sortOrder }),

        toggleSortOrder: () =>
          set((state) => ({
            sortOrder: state.sortOrder === "asc" ? "desc" : "asc",
          })),

        setViewMode: (mode) => set({ viewMode: mode }),

        resetFilters: () => set(createDefaultFilterState()),
      }),
      {
        name: "knowledge-filter-store",
        storage: createJSONStorage(() => getStorage()),
        partialize: (state) => ({
          searchQuery: state.searchQuery,
          typeFilters: state.typeFilters,
          statusFilters: state.statusFilters,
          tagFilters: state.tagFilters,
          dateRange: state.dateRange,
          minWordCount: state.minWordCount,
          maxWordCount: state.maxWordCount,
          sortBy: state.sortBy,
          sortOrder: state.sortOrder,
          viewMode: state.viewMode,
        }),
      },
    ),
    { name: "knowledge-filter-store" },
  ),
);

// ============================================================================
// SELECTOR HOOKS FOR PERFORMANCE
// ============================================================================

// Web Knowledge selectors
export const useWebKnowledgeItems = () =>
  useWebKnowledgeStore((state) => state.items);
export const useWebKnowledgeSelected = () =>
  useWebKnowledgeStore((state) => state.selectedItems);
export const useWebKnowledgeLoading = () =>
  useWebKnowledgeStore((state) => state.isLoading);

// File Knowledge selectors
export const useFileKnowledgeItems = () =>
  useFileKnowledgeStore((state) => state.items);
export const useFileKnowledgeSelected = () =>
  useFileKnowledgeStore((state) => state.selectedItems);
export const useFileKnowledgeUploading = () =>
  useFileKnowledgeStore((state) => state.isUploading);
export const useFileUploadProgress = () =>
  useFileKnowledgeStore((state) => state.uploadProgress);

// Text Knowledge selectors
export const useTextKnowledgeItems = () =>
  useTextKnowledgeStore((state) => state.items);
export const useTextKnowledgeSelected = () =>
  useTextKnowledgeStore((state) => state.selectedItems);
export const useTextKnowledgeEditing = () =>
  useTextKnowledgeStore((state) => ({
    editingItem: state.editingItem,
    editFormData: state.editFormData,
    isEditing: state.isEditing,
  }));

// Unified selectors
export const useCurrentKnowledgeType = () =>
  useUnifiedKnowledgeStore((state) => state.selectedKnowledgeType);
export const useCurrentWorkspaceId = () =>
  useUnifiedKnowledgeStore((state) => state.currentWorkspaceId);
