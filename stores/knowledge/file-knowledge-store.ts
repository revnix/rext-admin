/**
 * File Knowledge Store
 *
 * Manages file-based knowledge with upload progress tracking using the
 * generic knowledge store factory.
 */

import type { FileKnowledge } from "@/types/workspace";
import { type BaseState, createKnowledgeStore } from "./create-knowledge-store";

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
    setTypeFilter: (type) =>
      set({ typeFilter: type } as Partial<FileKnowledgeCustomState>),

    startUpload: (fileId, fileName) =>
      set((state) => ({
        uploadProgress: {
          ...(state as BaseState<FileKnowledge> & FileKnowledgeCustomState)
            .uploadProgress,
          [fileId]: {
            fileId,
            fileName,
            progress: 0,
            status: "uploading" as const,
          },
        },
        isUploading: true,
      })),

    updateUploadProgress: (fileId, progress) =>
      set((state) => {
        const typedState = state as BaseState<FileKnowledge> &
          FileKnowledgeCustomState;
        const status: "processing" | "uploading" =
          progress === 100 ? "processing" : "uploading";
        return {
          uploadProgress: {
            ...typedState.uploadProgress,
            [fileId]: {
              ...typedState.uploadProgress[fileId],
              progress,
              status,
            },
          },
        };
      }),

    completeUpload: (fileId, item) =>
      set((state) => {
        const typedState = state as BaseState<FileKnowledge> &
          FileKnowledgeCustomState;
        const { [fileId]: _removed, ...restProgress } =
          typedState.uploadProgress;
        return {
          uploadProgress: restProgress,
          isUploading: Object.keys(restProgress).length > 0,
          items: [item, ...typedState.items],
        };
      }),

    failUpload: (fileId, error) =>
      set((state) => {
        const typedState = state as BaseState<FileKnowledge> &
          FileKnowledgeCustomState;
        return {
          uploadProgress: {
            ...typedState.uploadProgress,
            [fileId]: {
              ...typedState.uploadProgress[fileId],
              status: "failed" as const,
              error,
            },
          },
        };
      }),

    removeUpload: (fileId) =>
      set((state) => {
        const typedState = state as BaseState<FileKnowledge> &
          FileKnowledgeCustomState;
        const { [fileId]: _removed, ...restProgress } =
          typedState.uploadProgress;
        return {
          uploadProgress: restProgress,
          isUploading: Object.keys(restProgress).length > 0,
        };
      }),
  }),

  persistConfig: {
    partialize: (state) => ({
      searchQuery: state.searchQuery,
      sortBy: state.sortBy,
      sortOrder: state.sortOrder,
      typeFilter: (state as BaseState<FileKnowledge> & FileKnowledgeCustomState)
        .typeFilter,
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
