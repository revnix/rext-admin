/**
 * File Knowledge Store
 *
 * Manages file-based knowledge with upload progress tracking using the
 * generic knowledge store factory.
 */

import type { FileKnowledge } from "@/types/workspace";
import { createKnowledgeStore } from "./create-knowledge-store";

// ============================================================================
// FILE-SPECIFIC STATE & ACTIONS
// ============================================================================

export interface FileUploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: "uploading" | "processing" | "completed" | "failed";
  error?: string;
}

interface FileKnowledgeCustomState {
  uploadProgress: Record<string, FileUploadProgress>;
  isUploading: boolean;
  typeFilter: string | null;
}

interface FileKnowledgeCustomActions {
  setTypeFilter: (type: string | null) => void;
  startUpload: (fileId: string, fileName: string) => void;
  updateUploadProgress: (fileId: string, progress: number) => void;
  completeUpload: (fileId: string, item: FileKnowledge) => void;
  failUpload: (fileId: string, error: string) => void;
  removeUpload: (fileId: string) => void;
}

// ============================================================================
// STORE CREATION
// ============================================================================

export const useFileKnowledgeStore = createKnowledgeStore<
  FileKnowledge,
  FileKnowledgeCustomState,
  FileKnowledgeCustomActions
>({
  storeName: "file-knowledge-store",
  defaultSortBy: "created_at",
  defaultSortOrder: "desc",

  customState: {
    uploadProgress: {},
    isUploading: false,
    typeFilter: null,
  },

  customActions: (set) => ({
    setTypeFilter: (type) => set({ typeFilter: type } as any),

    startUpload: (fileId, fileName) =>
      set((state: any) => ({
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
      set((state: any) => ({
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
      set((state: any) => {
        const { [fileId]: _removed, ...restProgress } = state.uploadProgress;
        return {
          uploadProgress: restProgress,
          isUploading: Object.keys(restProgress).length > 0,
          items: [item, ...state.items],
        };
      }),

    failUpload: (fileId, error) =>
      set((state: any) => ({
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
      set((state: any) => {
        const { [fileId]: _removed, ...restProgress } = state.uploadProgress;
        return {
          uploadProgress: restProgress,
          isUploading: Object.keys(restProgress).length > 0,
        };
      }),
  }),

  persistConfig: {
    partialize: (state: any) => ({
      searchQuery: state.searchQuery,
      sortBy: state.sortBy,
      sortOrder: state.sortOrder,
      typeFilter: state.typeFilter,
    }),
  },
});

// ============================================================================
// SELECTOR HOOKS FOR PERFORMANCE
// ============================================================================

export const useFileKnowledgeItems = () =>
  useFileKnowledgeStore((state) => state.items);

export const useFileKnowledgeSelected = () =>
  useFileKnowledgeStore((state) => state.selectedItems);

export const useFileKnowledgeUploading = () =>
  useFileKnowledgeStore((state) => state.isUploading);

export const useFileUploadProgress = () =>
  useFileKnowledgeStore((state) => state.uploadProgress);
