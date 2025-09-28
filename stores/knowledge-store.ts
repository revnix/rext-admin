/**
 * Knowledge Management Stores
 *
 * Dedicated Zustand stores for web, file, and text knowledge management
 * with optimistic updates, error handling, and UI state management.
 */

import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
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
