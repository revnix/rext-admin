
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { apiClient } from "@/lib/api-client";
import type { WorkspaceCrudState } from "@/types/workspace";

export const useWorkspaceCrudStore = create<WorkspaceCrudState>()(
  devtools(
    (set) => ({
      loadingStates: {
        switching: false,
        creating: false,
        updating: false,
        deleting: false,
        duplicating: false,
      },
      currentOperation: null,

      setCurrentOperation: (operation) => {
        set({ currentOperation: operation });
      },

      clearCurrentOperation: () => {
        set({ currentOperation: null });
      },

      setLoading: (operation, loading) => {
        set((state) => ({
          loadingStates: { ...state.loadingStates, [operation]: loading },
        }));
      },

      createWorkspace: async (data) => {
        set((state) => ({
          ...state,
          loadingStates: { ...state.loadingStates, creating: true },
        }));

        try {
          const { workspace, operation_id } = await apiClient.workspaces.create({
            name: data.name,
            timezone: data.timezone,
            url: data.url,
          });

          // Only update CRUD store's own state
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
            name: data.name,
            timezone: data.timezone,
            url: data.url,
          });

          const workspace = response.workspace;

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

          set((state) => ({
            loadingStates: { ...state.loadingStates, deleting: false },
          }));

          return workspaceId;
        } catch (error) {
          set((state) => ({
            ...state,
            loadingStates: { ...state.loadingStates, deleting: false },
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