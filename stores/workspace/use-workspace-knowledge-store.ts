import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { WorkspaceKnowledgeState } from "@/types/workspace";

/**
 * Workspace Knowledge Management Store
 *
 * Manages knowledge selection, upload modal, and file upload progress tracking.
 * Used for workspace knowledge management UI state.
 */
export const useWorkspaceKnowledgeStore = create<WorkspaceKnowledgeState>()(
  devtools(
    (set) => ({
      // Initial state
      knowledge: {
        selectedType: "web",
        selectedItems: [],
        isUploadModalOpen: false,
        uploadProgress: {},
      },

      // ============================================================================
      // KNOWLEDGE MANAGEMENT ACTIONS
      // ============================================================================

      setSelectedKnowledgeType: (type) => {
        set((state) => ({
          knowledge: {
            ...state.knowledge,
            selectedType: type,
            selectedItems: [], // Clear selection when switching types
          },
        }));
      },

      toggleKnowledgeSelection: (itemId) => {
        set((state) => {
          const selectedItems = state.knowledge.selectedItems.includes(itemId)
            ? state.knowledge.selectedItems.filter((id) => id !== itemId)
            : [...state.knowledge.selectedItems, itemId];

          return {
            knowledge: { ...state.knowledge, selectedItems },
          };
        });
      },

      selectAllKnowledge: (itemIds) => {
        set((state) => ({
          knowledge: { ...state.knowledge, selectedItems: itemIds },
        }));
      },

      deselectAllKnowledge: () => {
        set((state) => ({
          knowledge: { ...state.knowledge, selectedItems: [] },
        }));
      },

      openUploadModal: () => {
        set((state) => ({
          knowledge: { ...state.knowledge, isUploadModalOpen: true },
        }));
      },

      closeUploadModal: () => {
        set((state) => ({
          knowledge: {
            ...state.knowledge,
            isUploadModalOpen: false,
            uploadProgress: {},
          },
        }));
      },

      setUploadProgress: (fileId, progress) => {
        set((state) => ({
          knowledge: {
            ...state.knowledge,
            uploadProgress: {
              ...state.knowledge.uploadProgress,
              [fileId]: progress,
            },
          },
        }));
      },

      removeUploadProgress: (fileId) => {
        set((state) => {
          const { [fileId]: _, ...rest } = state.knowledge.uploadProgress;
          return {
            knowledge: { ...state.knowledge, uploadProgress: rest },
          };
        });
      },
    }),
    {
      name: "workspace-knowledge-store",
    },
  ),
);

// ============================================================================
// SELECTOR HOOKS FOR PERFORMANCE
// ============================================================================

/**
 * Hook to get knowledge management state
 */
export const useKnowledgeState = () => {
  return useWorkspaceKnowledgeStore((state) => state.knowledge);
};
