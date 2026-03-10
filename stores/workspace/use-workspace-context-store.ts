import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import type { Workspace, WorkspaceContextState } from "@/types/workspace";
import { getStorage } from "@/lib/storage";
import {
  createPersistHydrationSlice,
  onPersistHydrated,
} from "@/lib/zustand-persist-hydration";

/**
 * Workspace Context Store
 *
 * Manages current workspace context, workspace list, and workspace switching.
 * Handles optimistic updates and recent workspace tracking.
 */
export const useWorkspaceContextStore = create<WorkspaceContextState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        ...createPersistHydrationSlice<WorkspaceContextState>(set),
        currentWorkspace: null,
        workspaceList: [],
        recentWorkspaces: [],
        lastWorkspacePath: null,

        // ============================================================================
        // WORKSPACE CONTEXT ACTIONS
        // ============================================================================

        setCurrentWorkspace: (workspace) => {
          set((state) => {
            const newState = { ...state, currentWorkspace: workspace };

            // Add to recent workspaces if setting a workspace
            if (workspace) {
              const recentWorkspaces = [
                workspace.id,
                ...state.recentWorkspaces.filter((id) => id !== workspace.id),
              ].slice(0, 5); // Keep only 5 most recent

              newState.recentWorkspaces = recentWorkspaces;
            }

            return newState;
          });
        },

        setWorkspaceList: (workspaces) => {
          set({ workspaceList: workspaces });
        },

        updateWorkspaceInList: (updatedWorkspace) => {
          set((state) => ({
            workspaceList: state.workspaceList.map((workspace) =>
              workspace.id === updatedWorkspace.id
                ? updatedWorkspace
                : workspace,
            ),
            // Update current workspace if it's the one being updated
            currentWorkspace:
              state.currentWorkspace?.id === updatedWorkspace.id
                ? updatedWorkspace
                : state.currentWorkspace,
          }));
        },

        removeWorkspaceFromList: (workspaceId) => {
          set((state) => ({
            workspaceList: state.workspaceList.filter(
              (workspace) => workspace.id !== workspaceId,
            ),
            // Clear current workspace if it's the one being removed
            currentWorkspace:
              state.currentWorkspace?.id === workspaceId
                ? null
                : state.currentWorkspace,
            // Remove from recent workspaces
            recentWorkspaces: state.recentWorkspaces.filter(
              (id) => id !== workspaceId,
            ),
          }));
        },

        addWorkspaceToList: (workspace) => {
          set((state) => ({
            workspaceList: [workspace, ...state.workspaceList],
          }));
        },

        // ============================================================================
        // RECENT WORKSPACES ACTIONS
        // ============================================================================

        addToRecentWorkspaces: (workspaceId) => {
          set((state) => {
            const recentWorkspaces = [
              workspaceId,
              ...state.recentWorkspaces.filter((id) => id !== workspaceId),
            ].slice(0, 5); // Keep only 5 most recent

            return { recentWorkspaces };
          });
        },

        removeFromRecentWorkspaces: (workspaceId) => {
          set((state) => ({
            recentWorkspaces: state.recentWorkspaces.filter(
              (id) => id !== workspaceId,
            ),
          }));
        },

        clearRecentWorkspaces: () => {
          set({ recentWorkspaces: [] });
        },

        // ============================================================================
        // WORKSPACE PATH TRACKING ACTIONS
        // ============================================================================

        setLastWorkspacePath: (path) => {
          set({ lastWorkspacePath: path });
        },

        // ============================================================================
        // OPTIMISTIC UPDATE ACTIONS
        // ============================================================================

        optimisticallyUpdateWorkspace: (workspaceId, updates) => {
          set((state) => {
            const updatedWorkspaceList = state.workspaceList.map((workspace) =>
              workspace.id === workspaceId
                ? { ...workspace, ...updates }
                : workspace,
            );

            return {
              workspaceList: updatedWorkspaceList,
              currentWorkspace:
                state.currentWorkspace?.id === workspaceId
                  ? { ...state.currentWorkspace, ...updates }
                  : state.currentWorkspace,
            };
          });
        },

        revertOptimisticUpdate: (workspace) => {
          set((state) => ({
            workspaceList: state.workspaceList.map((w) =>
              w.id === workspace.id ? workspace : w,
            ),
            currentWorkspace:
              state.currentWorkspace?.id === workspace.id
                ? workspace
                : state.currentWorkspace,
          }));
        },

        // ============================================================================
        // UTILITY ACTIONS
        // ============================================================================
      }),
      {
        name: "workspace-context-store",
        storage: createJSONStorage(() => getStorage()),
        // Persist workspace context and navigation state
        partialize: (state) => ({
          currentWorkspace: state.currentWorkspace,
          recentWorkspaces: state.recentWorkspaces,
          lastWorkspacePath: state.lastWorkspacePath,
          _hasHydrated: state._hasHydrated,
        }),
        onRehydrateStorage: () => (state, error) => {
          onPersistHydrated(state, error);
        },
      },
    ),
    {
      name: "workspace-context-store",
    },
  ),
);

// ============================================================================
// SELECTOR HOOKS FOR PERFORMANCE
// ============================================================================

/**
 * Hook to check if store has hydrated (for SSR compatibility)
 */
export const useWorkspaceStoreHydrated = () => {
  return useWorkspaceContextStore((state) => state._hasHydrated);
};

/**
 * Hook to get current workspace context
 */
export const useCurrentWorkspace = () => {
  return useWorkspaceContextStore((state) => state.currentWorkspace);
};

/**
 * Hook to get workspace list
 */
export const useWorkspaceList = () => {
  return useWorkspaceContextStore((state) => state.workspaceList);
};

/**
 * Hook to get recent workspaces
 */
export const useRecentWorkspaces = () => {
  const workspaceList = useWorkspaceList();
  const recentWorkspaceIds = useWorkspaceContextStore(
    (state) => state.recentWorkspaces,
  );

  // Return actual workspace objects for recent workspace IDs
  return recentWorkspaceIds
    .map((id) => workspaceList.find((workspace) => workspace.id === id))
    .filter(Boolean) as Workspace[];
};

/**
 * Hook to get current workspace ID
 * Returns null if no workspace is currently selected
 */
export const useCurrentWorkspaceId = () => {
  return useWorkspaceContextStore(
    (state) => state.currentWorkspace?.id ?? null,
  );
};

/**
 * Hook to get current workspace slug
 * Returns null if no workspace is currently selected
 */
export const useCurrentWorkspaceSlug = () => {
  return useWorkspaceContextStore(
    (state) => state.currentWorkspace?.slug ?? null,
  );
};

/**
 * Hook to get current workspace data (ID and slug together)
 * Useful for components that need both values
 */
export const useCurrentWorkspaceData = () => {
  return useWorkspaceContextStore((state) => ({
    id: state.currentWorkspace?.id ?? null,
    slug: state.currentWorkspace?.slug ?? null,
    workspace: state.currentWorkspace,
  }));
};
