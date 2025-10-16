/**
 * Text Knowledge Store
 *
 * Manages text-based knowledge with inline editing capabilities.
 */

import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import type { TextKnowledgeState } from "@/types/knowledge";
import { getStorage } from "@/types/workspace";

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

// Selector hooks for performance
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
