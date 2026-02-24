/**
 * Global Knowledge Search Store
 *
 * Cross-type knowledge search with filtering and relevance scoring.
 */

import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import type { GlobalKnowledgeSearchState } from "@/types/knowledge";
import type { GlobalSearchResult } from "@/types/workspace";
import { getStorage } from "@/lib/storage";
import { useFileKnowledgeStore } from "./use-file-knowledge-store";
import { useTextKnowledgeStore } from "./use-text-knowledge-store";
import { useWebKnowledgeStore } from "./use-web-knowledge-store";

export const useGlobalKnowledgeSearchStore =
  create<GlobalKnowledgeSearchState>()(
    devtools(
      persist(
        (set, get) => ({
          // Initial state
          searchQuery: "",
          isSearching: false,
          searchResults: [],
          totalResults: 0,
          typeFilters: [],
          dateRange: { start: null, end: null },
          tagFilters: [],
          searchHistory: [],
          isAdvancedSearchOpen: false,
          error: null,

          // Actions
          setSearchQuery: (query) => set({ searchQuery: query }),

          performSearch: async (_workspaceId: string) => {
            const state = get();
            if (!state.searchQuery.trim()) {
              set({ searchResults: [], totalResults: 0 });
              return;
            }

            set({ isSearching: true, error: null });

            try {
              // Get all items from individual stores
              const webItems = useWebKnowledgeStore.getState().items;
              const fileItems = useFileKnowledgeStore.getState().items;
              const textItems = useTextKnowledgeStore.getState().items;

              const query = state.searchQuery.toLowerCase();
              const results: GlobalSearchResult[] = [];

              // Search web knowledge
              if (
                state.typeFilters.length === 0 ||
                state.typeFilters.includes("web")
              ) {
                webItems.forEach((item) => {
                  const titleMatch = item.title?.toLowerCase().includes(query);
                  const urlMatch = item.url?.toLowerCase().includes(query);
                  const matchedFields: string[] = [];
                  let relevanceScore = 0;

                  if (titleMatch) {
                    matchedFields.push("title");
                    relevanceScore += 3;
                  }
                  if (urlMatch) {
                    matchedFields.push("url");
                    relevanceScore += 2;
                  }

                  if (matchedFields.length > 0) {
                    results.push({
                      id: item.id,
                      type: "web",
                      title: item.title || "Untitled",
                      content: item.url || "",
                      url: item.url,
                      created_at: item.created_at,
                      updated_at: item.updated_at,
                      status: item.status,
                      relevanceScore,
                      matchedFields,
                      contentPreview: item.url || "",
                    });
                  }
                });
              }

              // Search file knowledge
              if (
                state.typeFilters.length === 0 ||
                state.typeFilters.includes("file")
              ) {
                fileItems.forEach((item) => {
                  const nameMatch = item.name?.toLowerCase().includes(query);
                  const contentMatch = item.content
                    ?.toLowerCase()
                    .includes(query);
                  const matchedFields: string[] = [];
                  let relevanceScore = 0;

                  if (nameMatch) {
                    matchedFields.push("title");
                    relevanceScore += 3;
                  }
                  if (contentMatch) {
                    matchedFields.push("content");
                    relevanceScore += 2;
                  }

                  if (matchedFields.length > 0) {
                    const preview = item.content
                      ? `${item.content.slice(0, 200)}...`
                      : "File content not available";

                    results.push({
                      id: item.id,
                      type: "file",
                      title: item.name || "Untitled File",
                      content: item.content || "",
                      created_at: item.created_at,
                      updated_at: item.updated_at,
                      relevanceScore,
                      matchedFields,
                      contentPreview: preview,
                    });
                  }
                });
              }

              // Search text knowledge
              if (
                state.typeFilters.length === 0 ||
                state.typeFilters.includes("text")
              ) {
                textItems.forEach((item) => {
                  const titleMatch = item.title?.toLowerCase().includes(query);
                  const contentMatch = item.content
                    ?.toLowerCase()
                    .includes(query);
                  const tagMatch = item.tags?.some((tag) =>
                    tag.toLowerCase().includes(query),
                  );
                  const matchedFields: string[] = [];
                  let relevanceScore = 0;

                  if (titleMatch) {
                    matchedFields.push("title");
                    relevanceScore += 3;
                  }
                  if (contentMatch) {
                    matchedFields.push("content");
                    relevanceScore += 2;
                  }
                  if (tagMatch) {
                    matchedFields.push("tags");
                    relevanceScore += 1;
                  }

                  if (matchedFields.length > 0) {
                    const preview = `${item.content?.slice(0, 200)}...` || "";

                    results.push({
                      id: item.id,
                      type: "text",
                      title: item.title || "Untitled Text",
                      content: item.content || "",
                      tags: item.tags,
                      created_at: item.created_at,
                      updated_at: item.updated_at,
                      relevanceScore,
                      matchedFields,
                      contentPreview: preview,
                    });
                  }
                });
              }

              // Apply date filters
              let filteredResults = results;
              if (state.dateRange.start || state.dateRange.end) {
                filteredResults = results.filter((result) => {
                  const resultDate = new Date(result.created_at);
                  const start = state.dateRange.start
                    ? new Date(state.dateRange.start)
                    : null;
                  const end = state.dateRange.end
                    ? new Date(state.dateRange.end)
                    : null;

                  if (start && resultDate < start) return false;
                  if (end && resultDate > end) return false;
                  return true;
                });
              }

              // Apply tag filters
              if (state.tagFilters.length > 0) {
                filteredResults = filteredResults.filter((result) => {
                  if (!result.tags) return false;
                  return state.tagFilters.some((filter) =>
                    result.tags?.some((tag) =>
                      tag.toLowerCase().includes(filter.toLowerCase()),
                    ),
                  );
                });
              }

              // Sort by relevance score
              filteredResults.sort(
                (a, b) => b.relevanceScore - a.relevanceScore,
              );

              set({
                searchResults: filteredResults,
                totalResults: filteredResults.length,
                isSearching: false,
              });

              // Add to search history
              if (
                state.searchQuery.trim() &&
                !state.searchHistory.includes(state.searchQuery)
              ) {
                get().addToHistory(state.searchQuery);
              }
            } catch (error) {
              set({
                error: error instanceof Error ? error.message : "Search failed",
                isSearching: false,
                searchResults: [],
                totalResults: 0,
              });
            }
          },

          clearResults: () =>
            set({ searchResults: [], totalResults: 0, searchQuery: "" }),

          setTypeFilters: (types) => set({ typeFilters: types }),

          setDateRange: (start, end) => set({ dateRange: { start, end } }),

          setTagFilters: (tags) => set({ tagFilters: tags }),

          addToHistory: (query) =>
            set((state) => ({
              searchHistory: [
                query,
                ...state.searchHistory.filter((q) => q !== query),
              ].slice(0, 10),
            })),

          clearHistory: () => set({ searchHistory: [] }),

          toggleAdvancedSearch: () =>
            set((state) => ({
              isAdvancedSearchOpen: !state.isAdvancedSearchOpen,
            })),

          setError: (error) => set({ error }),

          reset: () =>
            set({
              searchQuery: "",
              isSearching: false,
              searchResults: [],
              totalResults: 0,
              typeFilters: [],
              dateRange: { start: null, end: null },
              tagFilters: [],
              isAdvancedSearchOpen: false,
              error: null,
            }),
        }),
        {
          name: "global-knowledge-search-store",
          storage: createJSONStorage(() => getStorage()),
          partialize: (state) => ({
            searchHistory: state.searchHistory,
            typeFilters: state.typeFilters,
            tagFilters: state.tagFilters,
          }),
        },
      ),
      { name: "global-knowledge-search-store" },
    ),
  );
