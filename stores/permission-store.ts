import { create } from "zustand";
import { persist } from "zustand/middleware";
import { registerStoreReset } from "@/lib/store-registry";

/**
 * User interface with permissions
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

/**
 * Workspace-scoped permissions
 */
export interface WorkspacePermissions {
  workspaceId: string;
  role: string;
  permissions: string[];
}

/**
 * Permission store state
 */
interface PermissionStore {
  user: User | null;
  workspacePermissions: Map<string, WorkspacePermissions>;
  isLoading: boolean;
  error: string | null;
  // Track loading state per workspace to avoid flash during permission loading
  workspaceLoadingStates: Map<string, boolean>;

  // Actions
  setUser: (user: User) => void;
  setWorkspacePermissions: (
    workspaceId: string,
    permissions: WorkspacePermissions,
  ) => void;
  clearPermissions: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  // Set loading state for a specific workspace
  setWorkspaceLoading: (workspaceId: string, isLoading: boolean) => void;
  // Check if workspace permissions are currently loading
  isWorkspaceLoading: (workspaceId: string) => boolean;

  // Permission checks
  hasPermission: (permission: string, workspaceId?: string) => boolean;
  hasAnyPermission: (permissions: string[], workspaceId?: string) => boolean;
  hasAllPermissions: (permissions: string[], workspaceId?: string) => boolean;
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
}

/**
 * Permission store with persistence
 *
 * Manages user permissions and workspace-scoped permissions.
 * Provides fast, cached permission checks without API calls.
 *
 * Note: Only user data is persisted, not workspace permissions.
 * Workspace permissions are fetched fresh on each workspace load.
 */
export const usePermissionStore = create<PermissionStore>()(
  persist(
    (set, get) => ({
      user: null,
      workspacePermissions: new Map(),
      isLoading: false,
      error: null,
      workspaceLoadingStates: new Map(),

      setUser: (user) => set({ user, error: null }),

      setWorkspacePermissions: (workspaceId, permissions) =>
        set((state) => {
          const newMap = new Map(state.workspacePermissions);
          newMap.set(workspaceId, permissions);

          // Mark workspace as loaded (not loading anymore)
          const newLoadingStates = new Map(state.workspaceLoadingStates);
          newLoadingStates.set(workspaceId, false);

          return {
            workspacePermissions: newMap,
            workspaceLoadingStates: newLoadingStates,
          };
        }),

      clearPermissions: () =>
        set({
          user: null,
          workspacePermissions: new Map(),
          workspaceLoadingStates: new Map(),
          error: null,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      setWorkspaceLoading: (workspaceId, isLoading) =>
        set((state) => {
          const newLoadingStates = new Map(state.workspaceLoadingStates);
          newLoadingStates.set(workspaceId, isLoading);
          return { workspaceLoadingStates: newLoadingStates };
        }),

      isWorkspaceLoading: (workspaceId) => {
        const state = get();
        return state.workspaceLoadingStates.get(workspaceId) || false;
      },

      hasPermission: (permission, workspaceId) => {
        const state = get();
        if (!state.user) return false;

        // Super admin has all permissions
        if (state.user.role === "super_admin") return true;

        // Check workspace-scoped permission
        if (workspaceId) {
          const wsPerms = state.workspacePermissions.get(workspaceId);
          if (wsPerms?.permissions.includes(permission)) return true;
        }

        // Check global permission
        return state.user.permissions.includes(permission);
      },

      hasAnyPermission: (permissions, workspaceId) => {
        return permissions.some((perm) =>
          get().hasPermission(perm, workspaceId),
        );
      },

      hasAllPermissions: (permissions, workspaceId) => {
        return permissions.every((perm) =>
          get().hasPermission(perm, workspaceId),
        );
      },

      hasRole: (role) => {
        const state = get();
        return state.user?.role === role;
      },

      isAdmin: () => {
        const state = get();
        return ["admin", "super_admin"].includes(state.user?.role || "");
      },

      isSuperAdmin: () => {
        return get().user?.role === "super_admin";
      },
    }),
    {
      name: "permission-storage",
      // Only persist user data, not workspace permissions (those are fetched fresh)
      partialize: (state) => ({
        user: state.user,
      }),
    },
  ),
);

// Register with global store registry for logout cleanup
const initialPermissionState = usePermissionStore.getInitialState();
registerStoreReset(() =>
  usePermissionStore.setState(initialPermissionState, true),
);
