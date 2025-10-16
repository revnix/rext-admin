/**
 * Unified Knowledge Store
 *
 * Coordinates across web, file, and text knowledge stores.
 * Manages workspace context and global operations.
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { UnifiedKnowledgeState } from "@/types/knowledge";
import { useFileKnowledgeStore } from "./use-file-knowledge-store";
import { useTextKnowledgeStore } from "./use-text-knowledge-store";
import { useWebKnowledgeStore } from "./use-web-knowledge-store";

export const useUnifiedKnowledgeStore = create<UnifiedKnowledgeState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentWorkspaceId: null,
      selectedKnowledgeType: "web",
      isRefreshing: false,
      lastRefresh: 0,

      // Actions
      setCurrentWorkspace: (workspaceId) =>
        set({ currentWorkspaceId: workspaceId }),

      setSelectedKnowledgeType: (type) => set({ selectedKnowledgeType: type }),

      setRefreshing: (refreshing) =>
        set({
          isRefreshing: refreshing,
          lastRefresh: refreshing ? get().lastRefresh : Date.now(),
        }),

      refreshAll: () => {
        const webStore = useWebKnowledgeStore.getState();
        const fileStore = useFileKnowledgeStore.getState();
        const textStore = useTextKnowledgeStore.getState();

        webStore.setLoading(true);
        fileStore.setLoading(true);
        textStore.setLoading(true);

        set({ isRefreshing: true });

        // This would trigger re-fetching in components using these stores
        setTimeout(() => {
          webStore.setLoading(false);
          fileStore.setLoading(false);
          textStore.setLoading(false);
          set({ isRefreshing: false, lastRefresh: Date.now() });
        }, 1000);
      },

      resetAll: () => {
        const webStore = useWebKnowledgeStore.getState();
        const fileStore = useFileKnowledgeStore.getState();
        const textStore = useTextKnowledgeStore.getState();

        webStore.reset();
        fileStore.reset();
        textStore.reset();

        set({
          currentWorkspaceId: null,
          selectedKnowledgeType: "web",
          isRefreshing: false,
          lastRefresh: 0,
        });
      },
    }),
    { name: "unified-knowledge-store" },
  ),
);

// Selector hooks for convenience
export const useCurrentKnowledgeType = () =>
  useUnifiedKnowledgeStore((state) => state.selectedKnowledgeType);
export const useCurrentWorkspaceId = () =>
  useUnifiedKnowledgeStore((state) => state.currentWorkspaceId);
