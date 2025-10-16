/**
 * Web Knowledge Store
 *
 * Manages web-sourced knowledge items with search, sorting, and selection.
 */

import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import type { WebKnowledgeState } from "@/types/knowledge";
import { getStorage } from "@/types/workspace";

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

// Selector hooks for performance
export const useWebKnowledgeItems = () =>
  useWebKnowledgeStore((state) => state.items);
export const useWebKnowledgeSelected = () =>
  useWebKnowledgeStore((state) => state.selectedItems);
export const useWebKnowledgeLoading = () =>
  useWebKnowledgeStore((state) => state.isLoading);
