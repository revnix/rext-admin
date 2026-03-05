import { create } from "zustand";
import { persist } from "zustand/middleware";
import { registerStoreReset } from "@/lib/store-registry";
import type { StrictUserWithPermissions } from "@/types/role";
import { ROLES } from "@/lib/permissions";

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
  user: StrictUserWithPermissions | null;
  workspacePermissions: Record<string, WorkspacePermissions>;
  isLoading: boolean;
  error: string | null;
  workspaceLoadingStates: Record<string, boolean>;

  setUser: (user: StrictUserWithPermissions) => void;
  setWorkspacePermissions: (
    workspaceId: string,
    permissions: WorkspacePermissions,
  ) => void;
  clearPermissions: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setWorkspaceLoading: (workspaceId: string, isLoading: boolean) => void;
  isWorkspaceLoading: (workspaceId: string) => boolean;
  hasPermission: (permission: string, workspaceId?: string) => boolean;
  hasAnyPermission: (permissions: string[], workspaceId?: string) => boolean;
  hasAllPermissions: (permissions: string[], workspaceId?: string) => boolean;
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  invalidateWorkspacePermissions: (workspaceId?: string) => void;
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
      workspacePermissions: {},
      isLoading: false,
      error: null,
      workspaceLoadingStates: {},

      setUser: (user) => set({ user, error: null }),

      setWorkspacePermissions: (workspaceId, permissions) =>
        set((state) => ({
          workspacePermissions: {
            ...state.workspacePermissions,
            [workspaceId]: permissions,
          },
          workspaceLoadingStates: {
            ...state.workspaceLoadingStates,
            [workspaceId]: false,
          },
        })),

      clearPermissions: () =>
        set({
          user: null,
          workspacePermissions: {},
          workspaceLoadingStates: {},
          error: null,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      setWorkspaceLoading: (workspaceId, isLoading) =>
        set((state) => ({
          workspaceLoadingStates: {
            ...state.workspaceLoadingStates,
            [workspaceId]: isLoading,
          },
        })),

      isWorkspaceLoading: (workspaceId) =>
        Boolean(get().workspaceLoadingStates[workspaceId]),

      hasPermission: (permission, workspaceId) => {
        const state = get();
        if (!state.user) return false;
        if (state.user.role === ROLES.SUPER_ADMIN) return true;

        if (workspaceId) {
          const wsPerms = state.workspacePermissions[workspaceId];
          if (wsPerms?.permissions.includes(permission)) return true;
        }

        return state.user.permissions.includes(permission);
      },

      hasAnyPermission: (permissions, workspaceId) =>
        permissions.some((perm) => get().hasPermission(perm, workspaceId)),

      hasAllPermissions: (permissions, workspaceId) =>
        permissions.every((perm) => get().hasPermission(perm, workspaceId)),

      hasRole: (role) => get().user?.role === role,

      isAdmin: () =>
        ([ROLES.ADMIN, ROLES.SUPER_ADMIN] as string[]).includes(
          get().user?.role ?? "",
        ),

      isSuperAdmin: () => get().user?.role === ROLES.SUPER_ADMIN,

      invalidateWorkspacePermissions: (workspaceId) =>
        set((state) => {
          if (!workspaceId) {
            return {
              workspacePermissions: {},
              workspaceLoadingStates: {},
            };
          }

          const { [workspaceId]: _removedPerm, ...nextPermissions } =
            state.workspacePermissions;
          const { [workspaceId]: _removedLoading, ...nextLoading } =
            state.workspaceLoadingStates;

          return {
            workspacePermissions: nextPermissions,
            workspaceLoadingStates: nextLoading,
          };
        }),
    }),
    {
      name: "permission-storage",
      partialize: (state) => ({ user: state.user }),
    },
  ),
);

// Register with global store registry for logout cleanup
const initialPermissionState = usePermissionStore.getInitialState();
registerStoreReset(() =>
  usePermissionStore.setState(initialPermissionState, true),
);
