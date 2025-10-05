/**
 * Text Knowledge Store
 *
 * Manages text-based knowledge with inline editing support using the
 * generic knowledge store factory.
 */

import type { TextKnowledge } from "@/types/workspace";
import { createKnowledgeStore } from "./create-knowledge-store";

// ============================================================================
// TEXT-SPECIFIC STATE & ACTIONS
// ============================================================================

interface TextKnowledgeCustomState {
  editingItem: string | null;
  editFormData: Partial<TextKnowledge>;
  isEditing: boolean;
  isSaving: boolean;
  tagFilter: string | null;
}

interface TextKnowledgeCustomActions {
  setSaving: (saving: boolean) => void;
  setTagFilter: (tag: string | null) => void;
  startEdit: (id: string) => void;
  updateEditForm: (updates: Partial<TextKnowledge>) => void;
  cancelEdit: () => void;
  saveEdit: () => void;
}

// ============================================================================
// STORE CREATION
// ============================================================================

export const useTextKnowledgeStore = createKnowledgeStore<
  TextKnowledge,
  TextKnowledgeCustomState,
  TextKnowledgeCustomActions
>({
  storeName: "text-knowledge-store",
  defaultSortBy: "updated_at",
  defaultSortOrder: "desc",

  customState: {
    editingItem: null,
    editFormData: {},
    isEditing: false,
    isSaving: false,
    tagFilter: null,
  },

  customActions: (set, get) => ({
    setSaving: (saving) => set({ isSaving: saving } as any),

    setTagFilter: (tag) => set({ tagFilter: tag } as any),

    startEdit: (id) =>
      set((state: any) => {
        const item = state.items.find((item: any) => item.id === id);
        return {
          editingItem: id,
          editFormData: item ? { ...item } : {},
          isEditing: true,
        };
      }),

    updateEditForm: (updates) =>
      set((state: any) => ({
        editFormData: { ...state.editFormData, ...updates },
      })),

    cancelEdit: () =>
      set({
        editingItem: null,
        editFormData: {},
        isEditing: false,
      } as any),

    saveEdit: () => {
      const state = get() as any;
      if (state.editingItem && state.editFormData.id) {
        state.updateItem(state.editingItem, state.editFormData);
        state.cancelEdit();
      }
    },
  }),

  persistConfig: {
    partialize: (state: any) => ({
      searchQuery: state.searchQuery,
      sortBy: state.sortBy,
      sortOrder: state.sortOrder,
      tagFilter: state.tagFilter,
    }),
  },
});

// ============================================================================
// SELECTOR HOOKS FOR PERFORMANCE
// ============================================================================

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
