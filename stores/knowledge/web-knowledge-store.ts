/**
 * Web Knowledge Store
 *
 * Manages web-based knowledge (URLs, articles, etc.) using the generic
 * knowledge store factory.
 */

import type { WebKnowledge } from "@/types/workspace";
import { createKnowledgeStore } from "./create-knowledge-store";

// ============================================================================
// WEB-SPECIFIC STATE & ACTIONS
// ============================================================================

interface WebKnowledgeCustomState {
  isAdding: boolean;
}

interface WebKnowledgeCustomActions {
  setAdding: (adding: boolean) => void;
}

// ============================================================================
// STORE CREATION
// ============================================================================

export const useWebKnowledgeStore = createKnowledgeStore<
  WebKnowledge,
  WebKnowledgeCustomState,
  WebKnowledgeCustomActions
>({
  storeName: "web-knowledge-store",
  defaultSortBy: "created_at",
  defaultSortOrder: "desc",

  customState: {
    isAdding: false,
  },

  customActions: (set) => ({
    setAdding: (adding) => set({ isAdding: adding } as any),
  }),

  persistConfig: {
    partialize: (state: any) => ({
      searchQuery: state.searchQuery,
      sortBy: state.sortBy,
      sortOrder: state.sortOrder,
    }),
  },
});

// ============================================================================
// SELECTOR HOOKS FOR PERFORMANCE
// ============================================================================

export const useWebKnowledgeItems = () =>
  useWebKnowledgeStore((state) => state.items);

export const useWebKnowledgeSelected = () =>
  useWebKnowledgeStore((state) => state.selectedItems);

export const useWebKnowledgeLoading = () =>
  useWebKnowledgeStore((state) => state.isLoading);

export const useWebKnowledgeAdding = () =>
  useWebKnowledgeStore((state) => state.isAdding);
