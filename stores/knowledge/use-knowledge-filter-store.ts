/**
 * Knowledge Filter Store
 *
 * Cross-type filtering, sorting, and view mode management for knowledge lists.
 */

import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import {
  defaultKnowledgeFilterState,
  type KnowledgeFilterState,
  type KnowledgeFilterStore,
} from "@/types/knowledge";
import { getStorage } from "@/types/workspace";

const createDefaultFilterState = (): KnowledgeFilterState => ({
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
