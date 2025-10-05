/**
 * Text Knowledge Store
 *
 * Manages text-based knowledge with inline editing support using the
 * generic knowledge store factory.
 */

import type { TextKnowledge } from "@/types/workspace";
import {
  type BaseActions,
  type BaseState,
  createKnowledgeStore,
} from "./create-knowledge-store";

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
    setSaving: (saving) =>
      set({ isSaving: saving } as Partial<TextKnowledgeCustomState>),

    setTagFilter: (tag) =>
      set({ tagFilter: tag } as Partial<TextKnowledgeCustomState>),

    startEdit: (id) =>
      set((state) => {
        const typedState = state as BaseState<TextKnowledge> &
          TextKnowledgeCustomState;
        const item = typedState.items.find((item) => item.id === id);
        return {
          editingItem: id,
          editFormData: item ? { ...item } : {},
          isEditing: true,
        };
      }),

    updateEditForm: (updates) =>
      set((state) => {
        const typedState = state as BaseState<TextKnowledge> &
          TextKnowledgeCustomState;
        return {
          editFormData: { ...typedState.editFormData, ...updates },
        };
      }),

    cancelEdit: () =>
      set({
        editingItem: null,
        editFormData: {},
        isEditing: false,
      } as Partial<TextKnowledgeCustomState>),

    saveEdit: () => {
      const state = get() as BaseState<TextKnowledge> &
        BaseActions<TextKnowledge> &
        TextKnowledgeCustomState &
        TextKnowledgeCustomActions;
      if (state.editingItem && state.editFormData.id) {
        state.updateItem(state.editingItem, state.editFormData);
        state.cancelEdit();
      }
    },
  }),

  persistConfig: {
    partialize: (state) => ({
      searchQuery: state.searchQuery,
      sortBy: state.sortBy,
      sortOrder: state.sortOrder,
      tagFilter: (state as BaseState<TextKnowledge> & TextKnowledgeCustomState)
        .tagFilter,
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
