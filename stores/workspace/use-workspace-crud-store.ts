import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { apiClient } from "@/lib/api-client";
import type { WorkspaceCrudState, Workspace } from "@/types/workspace";
import { useWorkspaceContextStore } from "./use-workspace-context-store";

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
          // The new apiClient returns WorkspaceCreateResponse which includes operation_id
          const response = await apiClient.workspaces.create({
            name: data.name,
            timezone: data.timezone,
            url: data.url,
          });

          // Set current operation for SSE tracking if operation_id is present
          if (response.operation_id) {
            set({
              currentOperation: {
                operationId: response.operation_id,
                status: "pending",
              },
            });
          }

          set((state) => ({
            loadingStates: { ...state.loadingStates, creating: false },
          }));

          return response as Workspace;
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
          const workspace = await apiClient.workspaces.update(workspaceId, {
            name: data.name,
            timezone: data.timezone,
            url: data.url,
          });

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

      duplicateWorkspace: async (sourceWorkspaceId) => {
        set((state) => ({
          ...state,
          loadingStates: { ...state.loadingStates, duplicating: true },
        }));

        try {
          // Fetch the source workspace to get its data
          const sourceWorkspace =
            await apiClient.workspaces.get(sourceWorkspaceId);

          // Generate a duplicate name
          const duplicateName = `${sourceWorkspace.name} (Copy)`;

          // Create the duplicate workspace using the same data
          const workspace = (await apiClient.workspaces.create({
            name: duplicateName,
            timezone: sourceWorkspace.timezone ?? undefined,
            url: sourceWorkspace.url ?? "",
          })) as Workspace;

          // Add to context store (same pattern as createWorkspace)
          useWorkspaceContextStore.getState().addWorkspaceToList(workspace);

          set((state) => ({
            loadingStates: { ...state.loadingStates, duplicating: false },
          }));

          return workspace;
        } catch (error) {
          set((state) => ({
            ...state,
            loadingStates: { ...state.loadingStates, duplicating: false },
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
          const workspace = await apiClient.workspaces.get(workspaceId);

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
