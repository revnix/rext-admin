/**
 * Workspace Stores Barrel Export
 *
 * Exports all workspace-related stores and their selector hooks.
 * This provides a clean import path: `import { ... } from '@/stores/workspace'`
 */

// Import types first
import type { WorkspaceState } from "@/types/workspace";
import { useMemo } from "react";
import { useBrandVoiceRefreshStore } from "./use-brand-voice-refresh-store";
// Import individual stores for use in combined store
import { useWorkspaceContextStore } from "./use-workspace-context-store";
import { useWorkspaceCrudStore } from "./use-workspace-crud-store";
import { useWorkspaceFormStore } from "./use-workspace-form-store";
import { useWorkspaceKnowledgeStore } from "./use-workspace-knowledge-store";

// ============================================================================
// WORKSPACE CONTEXT STORE
// ============================================================================

export {
  useCurrentWorkspace,
  useCurrentWorkspaceData,
  useCurrentWorkspaceId,
  useCurrentWorkspaceSlug,
  useRecentWorkspaces,
  useWorkspaceContextStore,
  useWorkspaceList,
  useWorkspaceStoreHydrated,
} from "./use-workspace-context-store";

// ============================================================================
// WORKSPACE CRUD STORE
// ============================================================================

export {
  useCurrentOperation,
  useWorkspaceCrudStore,
  useWorkspaceLoadingStates,
} from "./use-workspace-crud-store";

// ============================================================================
// WORKSPACE FORM STORE
// ============================================================================

export {
  useWorkspaceForm,
  useWorkspaceFormStore,
} from "./use-workspace-form-store";

// ============================================================================
// WORKSPACE KNOWLEDGE STORE
// ============================================================================

export {
  useKnowledgeState,
  useWorkspaceKnowledgeStore,
} from "./use-workspace-knowledge-store";

// ============================================================================
// BRAND VOICE REFRESH STORE
// ============================================================================

export { useBrandVoiceRefreshStore } from "./use-brand-voice-refresh-store";

// ============================================================================
// COMBINED WORKSPACE STORE (for backward compatibility)
// ============================================================================

/**
 * Combined workspace store that aggregates all workspace-related stores
 * Supports Zustand selector pattern for backward compatibility
 *
 * @example
 * ```ts
 * // Selector pattern (for backward compatibility)
 * const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
 * const createWorkspace = useWorkspaceStore((state) => state.createWorkspace);
 *
 * // Direct destructuring pattern (new)
 * const { currentWorkspace, createWorkspace } = useWorkspaceStore();
 * ```
 */
export function useWorkspaceStore<T = WorkspaceState>(
  selector?: (state: WorkspaceState) => T,
): T {
  const contextStore = useWorkspaceContextStore();
  const crudStore = useWorkspaceCrudStore();
  const formStore = useWorkspaceFormStore();
  const knowledgeStore = useWorkspaceKnowledgeStore();
  const brandVoiceStore = useBrandVoiceRefreshStore();

  const combinedState = useMemo<WorkspaceState>(
    () => ({
      // Context state
      currentWorkspace: contextStore.currentWorkspace,
      workspaceList: contextStore.workspaceList,
      recentWorkspaces: contextStore.recentWorkspaces,
      lastWorkspacePath: contextStore.lastWorkspacePath,
      _hasHydrated: contextStore._hasHydrated,

      // CRUD state
      loadingStates: crudStore.loadingStates,
      currentOperation: crudStore.currentOperation,

      // Form state
      workspaceForm: formStore.workspaceForm,

      // Knowledge state
      knowledge: knowledgeStore.knowledge,

      // Brand voice state
      brandVoiceRefresh: brandVoiceStore.brandVoiceRefresh,

      // Context actions
      setCurrentWorkspace: contextStore.setCurrentWorkspace,
      setWorkspaceList: contextStore.setWorkspaceList,
      updateWorkspaceInList: contextStore.updateWorkspaceInList,
      removeWorkspaceFromList: contextStore.removeWorkspaceFromList,
      addWorkspaceToList: contextStore.addWorkspaceToList,
      addToRecentWorkspaces: contextStore.addToRecentWorkspaces,
      removeFromRecentWorkspaces: contextStore.removeFromRecentWorkspaces,
      clearRecentWorkspaces: contextStore.clearRecentWorkspaces,
      setLastWorkspacePath: contextStore.setLastWorkspacePath,
      optimisticallyUpdateWorkspace: contextStore.optimisticallyUpdateWorkspace,
      revertOptimisticUpdate: contextStore.revertOptimisticUpdate,
      setHasHydrated: contextStore.setHasHydrated,

      // CRUD actions
      createWorkspace: crudStore.createWorkspace,
      updateWorkspace: crudStore.updateWorkspace,
      deleteWorkspace: crudStore.deleteWorkspace,
      duplicateWorkspace: crudStore.duplicateWorkspace,
      fetchWorkspaces: crudStore.fetchWorkspaces,
      fetchWorkspace: crudStore.fetchWorkspace,
      setLoading: crudStore.setLoading,
      setCurrentOperation: crudStore.setCurrentOperation,
      clearCurrentOperation: crudStore.clearCurrentOperation,

      // Form actions
      openWorkspaceForm: formStore.openWorkspaceForm,
      closeWorkspaceForm: formStore.closeWorkspaceForm,
      updateWorkspaceFormData: formStore.updateWorkspaceFormData,
      setWorkspaceFormSubmitting: formStore.setWorkspaceFormSubmitting,
      setWorkspaceFormErrors: formStore.setWorkspaceFormErrors,
      resetWorkspaceForm: formStore.resetWorkspaceForm,

      // Knowledge actions
      setSelectedKnowledgeType: knowledgeStore.setSelectedKnowledgeType,
      toggleKnowledgeSelection: knowledgeStore.toggleKnowledgeSelection,
      selectAllKnowledge: knowledgeStore.selectAllKnowledge,
      deselectAllKnowledge: knowledgeStore.deselectAllKnowledge,
      openUploadModal: knowledgeStore.openUploadModal,
      closeUploadModal: knowledgeStore.closeUploadModal,
      setUploadProgress: knowledgeStore.setUploadProgress,
      removeUploadProgress: knowledgeStore.removeUploadProgress,

      // Brand voice actions
      refreshBrandVoice: brandVoiceStore.refreshBrandVoice,
      setBrandVoiceRefreshState: brandVoiceStore.setBrandVoiceRefreshState,

      // Combined utility action
      resetStore: () => {
        contextStore.setCurrentWorkspace(null);
        contextStore.setWorkspaceList([]);
        contextStore.clearRecentWorkspaces();
        contextStore.setLastWorkspacePath(null);
        formStore.resetWorkspaceForm();
        knowledgeStore.deselectAllKnowledge();
        knowledgeStore.closeUploadModal();
      },
    }),
    [contextStore, crudStore, formStore, knowledgeStore, brandVoiceStore],
  );

  if (selector) {
    return selector(combinedState);
  }

  return combinedState as T;
}
