/**
 * File Knowledge Store
 *
 * Manages file-based knowledge with upload progress tracking.
 */

import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import type { FileKnowledgeState } from "@/types/knowledge";
import { getStorage } from "@/lib/storage";

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

// Selector hooks for performance
export const useFileKnowledgeItems = () =>
  useFileKnowledgeStore((state) => state.items);
export const useFileKnowledgeSelected = () =>
  useFileKnowledgeStore((state) => state.selectedItems);
export const useFileKnowledgeUploading = () =>
  useFileKnowledgeStore((state) => state.isUploading);
export const useFileUploadProgress = () =>
  useFileKnowledgeStore((state) => state.uploadProgress);
