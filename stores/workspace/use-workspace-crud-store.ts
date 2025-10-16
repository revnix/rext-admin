import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { apiClient } from "@/lib/api-client";
import type { WorkspaceCrudState } from "@/types/workspace";
import { useWorkspaceContextStore } from "./use-workspace-context-store";

/**
 * Workspace CRUD Store
 *
 * Manages workspace create, read, update, delete operations.
 * Handles loading states and operation tracking for SSE.
 */
export const useWorkspaceCrudStore = create<WorkspaceCrudState>()(
  devtools(
    (set) => ({
      // Initial state
      loadingStates: {
        switching: false,
        creating: false,
        updating: false,
        deleting: false,
        duplicating: false,
      },
      currentOperation: null,

      // ============================================================================
      // OPERATION TRACKING ACTIONS
      // ============================================================================

      setCurrentOperation: (operation) => {
        set({ currentOperation: operation });
      },

      clearCurrentOperation: () => {
        set({ currentOperation: null });
      },

      // ============================================================================
      // LOADING STATE ACTIONS
      // ============================================================================

      setLoading: (operation, loading) => {
        set((state) => ({
          loadingStates: { ...state.loadingStates, [operation]: loading },
        }));
      },

      // ============================================================================
      // ASYNC WORKSPACE CRUD ACTIONS
      // ============================================================================

      createWorkspace: async (data) => {
        set((state) => ({
          ...state,
          loadingStates: { ...state.loadingStates, creating: true },
        }));

        try {
          const { workspace, operation_id } = await apiClient.workspaces.create(
            {
              title: data.title,
              timezone: data.timezone,
              url: data.url,
            },
          );

          // Optimistically add to context store and set operation for SSE
          useWorkspaceContextStore.getState().addWorkspaceToList(workspace);
          useWorkspaceContextStore.getState().setCurrentWorkspace(workspace);

          set((state) => ({
            currentOperation: {
              operationId: operation_id,
              workspaceId: workspace.id,
            },
            loadingStates: { ...state.loadingStates, creating: false },
          }));

          return workspace;
        } catch (error) {
          set((state) => ({
            ...state,
            loadingStates: { ...state.loadingStates, creating: false },
          }));
          throw error;
        }
      },

      updateWorkspace: async (workspaceId, data) => {
        set((state) => ({
          ...state,
          loadingStates: { ...state.loadingStates, updating: true },
        }));

        try {
          const response = await apiClient.workspaces.update(workspaceId, {
            title: data.title,
            timezone: data.timezone,
            url: data.url,
          });

          const workspace = response.workspace;

          // Update in context store
          useWorkspaceContextStore.getState().updateWorkspaceInList(workspace);

          set((state) => ({
            loadingStates: { ...state.loadingStates, updating: false },
          }));

          return workspace;
        } catch (error) {
          set((state) => ({
            ...state,
            loadingStates: { ...state.loadingStates, updating: false },
          }));
          throw error;
        }
      },

      deleteWorkspace: async (workspaceId) => {
        set((state) => ({
          ...state,
          loadingStates: { ...state.loadingStates, deleting: true },
        }));

        try {
          await apiClient.workspaces.delete(workspaceId);

          // Remove from context store
          useWorkspaceContextStore
            .getState()
            .removeWorkspaceFromList(workspaceId);

          set((state) => ({
            loadingStates: { ...state.loadingStates, deleting: false },
          }));
        } catch (error) {
          set((state) => ({
            ...state,
            loadingStates: { ...state.loadingStates, deleting: false },
          }));
          throw error;
        }
      },

      duplicateWorkspace: async (sourceWorkspaceId) => {
        set((state) => ({
          ...state,
          loadingStates: { ...state.loadingStates, duplicating: true },
        }));

        try {
          const response =
            await apiClient.workspaces.duplicate(sourceWorkspaceId);

          const duplicatedWorkspace = response.workspace;

          // Optimistically add to context store
          useWorkspaceContextStore
            .getState()
            .addWorkspaceToList(duplicatedWorkspace);
          useWorkspaceContextStore
            .getState()
            .setCurrentWorkspace(duplicatedWorkspace);

          set((state) => ({
            loadingStates: { ...state.loadingStates, duplicating: false },
          }));

          return duplicatedWorkspace;
        } catch (error) {
          set((state) => ({
            ...state,
            loadingStates: { ...state.loadingStates, duplicating: false },
          }));
          throw error;
        }
      },

      fetchWorkspaces: async () => {
        set((state) => ({
          ...state,
          loadingStates: { ...state.loadingStates, switching: true },
        }));

        try {
          const response = await apiClient.workspaces.list();
          const workspaces = response.workspaces;

          useWorkspaceContextStore.getState().setWorkspaceList(workspaces);

          set((state) => ({
            loadingStates: { ...state.loadingStates, switching: false },
          }));

          return workspaces;
        } catch (error) {
          set((state) => ({
            ...state,
            loadingStates: { ...state.loadingStates, switching: false },
          }));
          throw error;
        }
      },

      fetchWorkspace: async (workspaceId) => {
        set((state) => ({
          ...state,
          loadingStates: { ...state.loadingStates, switching: true },
        }));

        try {
          const response = await apiClient.workspaces.get(workspaceId);
          const workspace = response.workspace;

          // Update workspace in list if it exists, otherwise add it
          const contextStore = useWorkspaceContextStore.getState();
          const existingIndex = contextStore.workspaceList.findIndex(
            (w) => w.id === workspaceId,
          );

          if (existingIndex >= 0) {
            contextStore.updateWorkspaceInList(workspace);
          } else {
            contextStore.addWorkspaceToList(workspace);
          }

          contextStore.setCurrentWorkspace(workspace);

          set((state) => ({
            loadingStates: { ...state.loadingStates, switching: false },
          }));

          return workspace;
        } catch (error) {
          set((state) => ({
            ...state,
            loadingStates: { ...state.loadingStates, switching: false },
          }));
          throw error;
        }
      },
    }),
    {
      name: "workspace-crud-store",
    },
  ),
);

// ============================================================================
// SELECTOR HOOKS FOR PERFORMANCE
// ============================================================================

/**
 * Hook to get loading states
 */
export const useWorkspaceLoadingStates = () => {
  return useWorkspaceCrudStore((state) => state.loadingStates);
};

/**
 * Hook to get current operation (for SSE tracking)
 */
export const useCurrentOperation = () => {
  return useWorkspaceCrudStore((state) => state.currentOperation);
};
