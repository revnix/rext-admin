import { useWorkspaceContextStore } from "@/stores/workspace/use-workspace-context-store";
import { useWorkspaceCrudStore } from "@/stores/workspace/use-workspace-crud-store";
import type {
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
} from "@/types/workspace";

/**
 * Hook that orchestrates workspace CRUD operations across stores.
 * This replaces the direct getState() calls that previously coupled
 * the CRUD store to the context store.
 */
export function useWorkspaceActions() {
  const crudStore = useWorkspaceCrudStore();
  const addWorkspaceToList = useWorkspaceContextStore(
    (s) => s.addWorkspaceToList,
  );
  const setCurrentWorkspace = useWorkspaceContextStore(
    (s) => s.setCurrentWorkspace,
  );
  const updateWorkspaceInList = useWorkspaceContextStore(
    (s) => s.updateWorkspaceInList,
  );
  const removeWorkspaceFromList = useWorkspaceContextStore(
    (s) => s.removeWorkspaceFromList,
  );
  const setWorkspaceList = useWorkspaceContextStore((s) => s.setWorkspaceList);

  const createWorkspace = async (data: CreateWorkspaceRequest) => {
    const workspace = await crudStore.createWorkspace(data);
    addWorkspaceToList(workspace);
    setCurrentWorkspace(workspace);
    return workspace;
  };

  const updateWorkspace = async (
    workspaceId: string,
    data: UpdateWorkspaceRequest,
  ) => {
    const workspace = await crudStore.updateWorkspace(workspaceId, data);
    updateWorkspaceInList(workspace);
    return workspace;
  };

  const deleteWorkspace = async (workspaceId: string) => {
    const deletedId = await crudStore.deleteWorkspace(workspaceId);
    removeWorkspaceFromList(deletedId);
  };

  const fetchWorkspaces = async () => {
    const workspaces = await crudStore.fetchWorkspaces();
    setWorkspaceList(workspaces);
    return workspaces;
  };

  const fetchWorkspace = async (workspaceId: string) => {
    const workspace = await crudStore.fetchWorkspace(workspaceId);
    const existingIndex = useWorkspaceContextStore
      .getState()
      .workspaceList.findIndex((w) => w.id === workspaceId);
    if (existingIndex >= 0) {
      updateWorkspaceInList(workspace);
    } else {
      addWorkspaceToList(workspace);
    }
    setCurrentWorkspace(workspace);
    return workspace;
  };

  return {
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    fetchWorkspaces,
    fetchWorkspace,
    // Pass through non-orchestrated actions
    setLoading: crudStore.setLoading,
    setCurrentOperation: crudStore.setCurrentOperation,
    clearCurrentOperation: crudStore.clearCurrentOperation,
    loadingStates: crudStore.loadingStates,
    currentOperation: crudStore.currentOperation,
  };
}
