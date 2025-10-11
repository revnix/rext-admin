import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { apiClient } from "@/lib/api-client";
import { getWorkspaceDisplayTitle } from "@/lib/workspace";
import type {
  BrandVoiceRefreshState,
  KnowledgeManagementState,
  KnowledgeType,
  Workspace,
  WorkspaceFormData,
  WorkspaceFormState,
  WorkspaceLoadingStates,
} from "@/types/workspace";

// SSR-safe storage implementation
const getStorage = () => {
  // SSR guard - only access localStorage on client-side
  if (typeof window === "undefined") {
    // Return a no-op storage for SSR
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  return localStorage;
};

/**
 * Workspace Store Interface
 *
 * Manages client-side state for workspace management including:
 * - Current workspace context
 * - UI preferences and filters
 * - Optimistic updates for better UX
 * - Form state for workspace creation/editing
 *
 * Server state is handled by TanStack Query.
 */
interface WorkspaceState {
  // Current workspace context
  currentWorkspace: Workspace | null;
  workspaceList: Workspace[];

  // No longer needed - DataTable handles its own state

  // Form state for workspace creation/editing
  workspaceForm: WorkspaceFormState;

  // Knowledge management state
  knowledge: KnowledgeManagementState;

  // Loading states for optimistic updates
  loadingStates: WorkspaceLoadingStates;

  // Recently used workspaces for quick access
  recentWorkspaces: string[]; // workspace IDs

  // Last workspace page path for preserving navigation on workspace switch
  lastWorkspacePath: string | null; // e.g., 'topics', 'content', 'analytics'

  // Brand voice refresh state
  brandVoiceRefresh: BrandVoiceRefreshState;

  // Operation tracking for SSE (transient, not persisted)
  currentOperation: {
    operationId: string;
    workspaceId: string;
  } | null;

  // SSR hydration state
  _hasHydrated: boolean;

  // ============================================================================
  // WORKSPACE CONTEXT ACTIONS
  // ============================================================================

  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setWorkspaceList: (workspaces: Workspace[]) => void;
  updateWorkspaceInList: (updatedWorkspace: Workspace) => void;
  removeWorkspaceFromList: (workspaceId: string) => void;
  addWorkspaceToList: (workspace: Workspace) => void;

  // Operation tracking actions
  setCurrentOperation: (
    operation: {
      operationId: string;
      workspaceId: string;
    } | null,
  ) => void;
  clearCurrentOperation: () => void;

  // ============================================================================
  // ASYNC WORKSPACE CRUD ACTIONS
  // ============================================================================

  createWorkspace: (data: WorkspaceFormData) => Promise<Workspace>;
  updateWorkspace: (
    workspaceId: string,
    data: WorkspaceFormData,
  ) => Promise<Workspace>;
  deleteWorkspace: (workspaceId: string) => Promise<void>;
  duplicateWorkspace: (sourceWorkspaceId: string) => Promise<Workspace>;
  fetchWorkspaces: () => Promise<Workspace[]>;
  fetchWorkspace: (workspaceId: string) => Promise<Workspace>;

  // ============================================================================
  // BRAND VOICE REFRESH ACTIONS
  // ============================================================================

  refreshBrandVoice: (workspaceId: string) => Promise<string>;
  setBrandVoiceRefreshState: (state: Partial<BrandVoiceRefreshState>) => void;

  // UI preferences removed - DataTable handles its own state

  // ============================================================================
  // WORKSPACE FORM ACTIONS
  // ============================================================================

  openWorkspaceForm: (mode: "create" | "edit", workspace?: Workspace) => void;
  closeWorkspaceForm: () => void;
  updateWorkspaceFormData: (data: Partial<WorkspaceFormData>) => void;
  setWorkspaceFormSubmitting: (isSubmitting: boolean) => void;
  setWorkspaceFormErrors: (errors: Record<string, string>) => void;
  resetWorkspaceForm: () => void;

  // ============================================================================
  // KNOWLEDGE MANAGEMENT ACTIONS
  // ============================================================================

  setSelectedKnowledgeType: (type: KnowledgeType) => void;
  toggleKnowledgeSelection: (itemId: string) => void;
  selectAllKnowledge: (itemIds: string[]) => void;
  deselectAllKnowledge: () => void;
  openUploadModal: () => void;
  closeUploadModal: () => void;
  setUploadProgress: (fileId: string, progress: number) => void;
  removeUploadProgress: (fileId: string) => void;

  // ============================================================================
  // LOADING STATE ACTIONS
  // ============================================================================

  setLoading: (
    operation: keyof WorkspaceLoadingStates,
    loading: boolean,
  ) => void;

  // ============================================================================
  // RECENT WORKSPACES ACTIONS
  // ============================================================================

  addToRecentWorkspaces: (workspaceId: string) => void;
  removeFromRecentWorkspaces: (workspaceId: string) => void;
  clearRecentWorkspaces: () => void;

  // ============================================================================
  // WORKSPACE PATH TRACKING ACTIONS
  // ============================================================================

  setLastWorkspacePath: (path: string | null) => void;

  // ============================================================================
  // OPTIMISTIC UPDATE ACTIONS
  // ============================================================================

  optimisticallyUpdateWorkspace: (
    workspaceId: string,
    updates: Partial<Workspace>,
  ) => void;
  revertOptimisticUpdate: (workspace: Workspace) => void;

  // ============================================================================
  // UTILITY ACTIONS
  // ============================================================================

  resetStore: () => void;
  setHasHydrated: (hydrated: boolean) => void;
}

/**
 * Default workspace form data
 */
const initialWorkspaceFormData: WorkspaceFormData = {
  title: "",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  url: "",
};

// Workspace filters removed - DataTable handles its own state

/**
 * Workspace Management Zustand Store
 *
 * Uses devtools for debugging and persistence for UI preferences.
 * Only stores client-side UI state - server state is handled by TanStack Query.
 */
export const useWorkspaceStore = create<WorkspaceState>()(
  devtools(
    persist(
      (set, _get) => ({
        // Initial state
        currentWorkspace: null,
        workspaceList: [],

        // UI preferences removed - DataTable handles its own state

        // Form state
        workspaceForm: {
          isOpen: false,
          mode: "create",
          data: initialWorkspaceFormData,
          isSubmitting: false,
          errors: {},
        },

        // Knowledge management
        knowledge: {
          selectedType: "web",
          selectedItems: [],
          isUploadModalOpen: false,
          uploadProgress: {},
        },

        // Loading states
        loadingStates: {
          switching: false,
          creating: false,
          updating: false,
          deleting: false,
          duplicating: false,
        },

        // Recent workspaces
        recentWorkspaces: [],

        // Last workspace path
        lastWorkspacePath: null,

        // Brand voice refresh state
        brandVoiceRefresh: {
          isRefreshing: false,
          operationId: undefined,
          refreshError: undefined,
        },

        // Operation tracking (transient, not persisted)
        currentOperation: null,

        // SSR hydration
        _hasHydrated: false,

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

        setCurrentOperation: (operation) => {
          set({ currentOperation: operation });
        },

        clearCurrentOperation: () => {
          set({ currentOperation: null });
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

        // UI preferences methods removed - DataTable handles its own state

        // ============================================================================
        // WORKSPACE FORM ACTIONS
        // ============================================================================

        openWorkspaceForm: (mode, workspace) => {
          set({
            workspaceForm: {
              isOpen: true,
              mode,
              data: workspace
                ? {
                    title: getWorkspaceDisplayTitle(workspace),
                    timezone:
                      workspace.timezone ||
                      Intl.DateTimeFormat().resolvedOptions().timeZone,
                    url: workspace.url,
                  }
                : initialWorkspaceFormData,
              isSubmitting: false,
              errors: {},
            },
          });
        },

        closeWorkspaceForm: () => {
          set({
            workspaceForm: {
              isOpen: false,
              mode: "create",
              data: initialWorkspaceFormData,
              isSubmitting: false,
              errors: {},
            },
          });
        },

        updateWorkspaceFormData: (data) => {
          set((state) => ({
            workspaceForm: {
              ...state.workspaceForm,
              data: { ...state.workspaceForm.data, ...data },
              // Clear errors for updated fields
              errors: Object.keys(data).reduce((acc, key) => {
                const { [key]: _, ...rest } = acc;
                return rest;
              }, state.workspaceForm.errors),
            },
          }));
        },

        setWorkspaceFormSubmitting: (isSubmitting) => {
          set((state) => ({
            workspaceForm: { ...state.workspaceForm, isSubmitting },
          }));
        },

        setWorkspaceFormErrors: (errors) => {
          set((state) => ({
            workspaceForm: { ...state.workspaceForm, errors },
          }));
        },

        resetWorkspaceForm: () => {
          set((state) => ({
            workspaceForm: {
              ...state.workspaceForm,
              data: initialWorkspaceFormData,
              errors: {},
            },
          }));
        },

        // ============================================================================
        // KNOWLEDGE MANAGEMENT ACTIONS
        // ============================================================================

        setSelectedKnowledgeType: (type) => {
          set((state) => ({
            knowledge: {
              ...state.knowledge,
              selectedType: type,
              selectedItems: [], // Clear selection when switching types
            },
          }));
        },

        toggleKnowledgeSelection: (itemId) => {
          set((state) => {
            const selectedItems = state.knowledge.selectedItems.includes(itemId)
              ? state.knowledge.selectedItems.filter((id) => id !== itemId)
              : [...state.knowledge.selectedItems, itemId];

            return {
              knowledge: { ...state.knowledge, selectedItems },
            };
          });
        },

        selectAllKnowledge: (itemIds) => {
          set((state) => ({
            knowledge: { ...state.knowledge, selectedItems: itemIds },
          }));
        },

        deselectAllKnowledge: () => {
          set((state) => ({
            knowledge: { ...state.knowledge, selectedItems: [] },
          }));
        },

        openUploadModal: () => {
          set((state) => ({
            knowledge: { ...state.knowledge, isUploadModalOpen: true },
          }));
        },

        closeUploadModal: () => {
          set((state) => ({
            knowledge: {
              ...state.knowledge,
              isUploadModalOpen: false,
              uploadProgress: {},
            },
          }));
        },

        setUploadProgress: (fileId, progress) => {
          set((state) => ({
            knowledge: {
              ...state.knowledge,
              uploadProgress: {
                ...state.knowledge.uploadProgress,
                [fileId]: progress,
              },
            },
          }));
        },

        removeUploadProgress: (fileId) => {
          set((state) => {
            const { [fileId]: _, ...rest } = state.knowledge.uploadProgress;
            return {
              knowledge: { ...state.knowledge, uploadProgress: rest },
            };
          });
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
        // ASYNC WORKSPACE CRUD ACTIONS
        // ============================================================================

        createWorkspace: async (data) => {
          set((state) => ({
            ...state,
            loadingStates: { ...state.loadingStates, creating: true },
          }));

          try {
            const { workspace, operation_id } =
              await apiClient.workspaces.create({
                title: data.title,
                timezone: data.timezone,
                url: data.url,
              });

            // Optimistically add to store and set operation context for SSE
            set((state) => ({
              workspaceList: [workspace, ...state.workspaceList],
              currentWorkspace: workspace,
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

            // Update in store
            set((state) => ({
              workspaceList: state.workspaceList.map((w) =>
                w.id === workspaceId ? workspace : w,
              ),
              currentWorkspace:
                state.currentWorkspace?.id === workspaceId
                  ? workspace
                  : state.currentWorkspace,
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

            // Remove from store
            set((state) => ({
              workspaceList: state.workspaceList.filter(
                (w) => w.id !== workspaceId,
              ),
              currentWorkspace:
                state.currentWorkspace?.id === workspaceId
                  ? null
                  : state.currentWorkspace,
              recentWorkspaces: state.recentWorkspaces.filter(
                (id) => id !== workspaceId,
              ),
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

            // Optimistically add to store
            set((state) => ({
              workspaceList: [duplicatedWorkspace, ...state.workspaceList],
              currentWorkspace: duplicatedWorkspace,
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

            set((state) => ({
              workspaceList: workspaces,
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
            set((state) => {
              const existingIndex = state.workspaceList.findIndex(
                (w) => w.id === workspaceId,
              );
              const updatedList =
                existingIndex >= 0
                  ? state.workspaceList.map((w) =>
                      w.id === workspaceId ? workspace : w,
                    )
                  : [workspace, ...state.workspaceList];

              return {
                workspaceList: updatedList,
                currentWorkspace: workspace,
                loadingStates: { ...state.loadingStates, switching: false },
              };
            });

            return workspace;
          } catch (error) {
            set((state) => ({
              ...state,
              loadingStates: { ...state.loadingStates, switching: false },
            }));
            throw error;
          }
        },

        // ============================================================================
        // BRAND VOICE REFRESH ACTIONS
        // ============================================================================

        refreshBrandVoice: async (workspaceId) => {
          try {
            set((state) => ({
              brandVoiceRefresh: {
                ...state.brandVoiceRefresh,
                isRefreshing: true,
                refreshError: undefined,
              },
            }));

            const response =
              await apiClient.workspaces.refreshBrandVoice(workspaceId);

            const operationId = response.operation_id;

            set((state) => ({
              brandVoiceRefresh: {
                ...state.brandVoiceRefresh,
                isRefreshing: true,
                operationId,
              },
              currentOperation: {
                operationId,
                workspaceId,
              },
            }));

            return operationId;
          } catch (error) {
            set((state) => ({
              brandVoiceRefresh: {
                ...state.brandVoiceRefresh,
                isRefreshing: false,
                operationId: undefined,
                refreshError:
                  error instanceof Error
                    ? error.message
                    : "Failed to refresh brand voice",
              },
            }));
            throw error;
          }
        },

        setBrandVoiceRefreshState: (newState) => {
          set((state) => ({
            brandVoiceRefresh: {
              ...state.brandVoiceRefresh,
              ...newState,
            },
          }));
        },

        // ============================================================================
        // UTILITY ACTIONS
        // ============================================================================

        resetStore: () => {
          set({
            currentWorkspace: null,
            workspaceList: [],
            workspaceForm: {
              isOpen: false,
              mode: "create",
              data: initialWorkspaceFormData,
              isSubmitting: false,
              errors: {},
            },
            knowledge: {
              selectedType: "web",
              selectedItems: [],
              isUploadModalOpen: false,
              uploadProgress: {},
            },
            loadingStates: {
              switching: false,
              creating: false,
              updating: false,
              deleting: false,
              duplicating: false,
            },
            recentWorkspaces: [],
          });
        },

        setHasHydrated: (hydrated) => {
          set({ _hasHydrated: hydrated });
        },
      }),
      {
        name: "workspace-store",
        storage: createJSONStorage(() => getStorage()),
        // Only persist UI preferences, not server data
        partialize: (state) => ({
          currentWorkspace: state.currentWorkspace,
          recentWorkspaces: state.recentWorkspaces,
          lastWorkspacePath: state.lastWorkspacePath,
          _hasHydrated: state._hasHydrated,
        }),
        onRehydrateStorage: () => (state) => {
          state?.setHasHydrated(true);
        },
      },
    ),
    {
      name: "workspace-store",
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
  return useWorkspaceStore((state) => state._hasHydrated);
};

/**
 * Hook to get current workspace context
 */
export const useCurrentWorkspace = () => {
  return useWorkspaceStore((state) => state.currentWorkspace);
};

/**
 * Hook to get workspace list
 */
export const useWorkspaceList = () => {
  return useWorkspaceStore((state) => state.workspaceList);
};

/**
 * Hook to get workspace form state
 */
export const useWorkspaceForm = () => {
  return useWorkspaceStore((state) => state.workspaceForm);
};

/**
 * Hook to get knowledge management state
 */
export const useKnowledgeState = () => {
  return useWorkspaceStore((state) => state.knowledge);
};

/**
 * Hook to get loading states
 */
export const useWorkspaceLoadingStates = () => {
  return useWorkspaceStore((state) => state.loadingStates);
};

// useWorkspaceUIPreferences removed - DataTable handles its own state

/**
 * Hook to get recent workspaces
 */
export const useRecentWorkspaces = () => {
  const workspaceList = useWorkspaceList();
  const recentWorkspaceIds = useWorkspaceStore(
    (state) => state.recentWorkspaces,
  );

  // Return actual workspace objects for recent workspace IDs
  return recentWorkspaceIds
    .map((id) => workspaceList.find((workspace) => workspace.id === id))
    .filter(Boolean) as Workspace[];
};

/**
 * Hook to get current operation (for SSE tracking)
 */
export const useCurrentOperation = () => {
  return useWorkspaceStore((state) => state.currentOperation);
};

/**
 * Hook to get current workspace ID
 * Returns null if no workspace is currently selected
 */
export const useCurrentWorkspaceId = () => {
  return useWorkspaceStore((state) => state.currentWorkspace?.id ?? null);
};

/**
 * Hook to get current workspace slug
 * Returns null if no workspace is currently selected
 */
export const useCurrentWorkspaceSlug = () => {
  return useWorkspaceStore((state) => state.currentWorkspace?.slug ?? null);
};

/**
 * Hook to get current workspace data (ID and slug together)
 * Useful for components that need both values
 */
export const useCurrentWorkspaceData = () => {
  return useWorkspaceStore((state) => ({
    id: state.currentWorkspace?.id ?? null,
    slug: state.currentWorkspace?.slug ?? null,
    workspace: state.currentWorkspace,
  }));
};
