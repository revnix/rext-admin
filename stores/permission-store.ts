import { create } from "zustand";
import { registerStoreReset } from "@/lib/store-registry";
import type { StrictUserWithPermissions } from "@/types/role";

const MAX_WORKSPACE_PERMISSION_CACHE = 25;
const MAX_WORKSPACE_LOADING_CACHE = 50;

interface PermissionStore {
  user: StrictUserWithPermissions | null;
  // ...rest unchanged
  setUser: (user: StrictUserWithPermissions) => void;
}

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
  setWorkspaceLoading: (workspaceId: string, isLoading: boolean) => void;
  isWorkspaceLoading: (workspaceId: string) => boolean;

  // Permission checks
  hasPermission: (permission: string, workspaceId?: string) => boolean;
  hasAnyPermission: (permissions: string[], workspaceId?: string) => boolean;
  hasAllPermissions: (permissions: string[], workspaceId?: string) => boolean;
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
}

function pruneOldestEntries<K, V>(map: Map<K, V>, maxSize: number): Map<K, V> {
  if (map.size <= maxSize) return map;

  const pruned = new Map(map);
  while (pruned.size > maxSize) {
    const oldestKey = pruned.keys().next().value;
    if (oldestKey === undefined) break;
    pruned.delete(oldestKey);
  }

  return pruned;
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
export const usePermissionStore = create<PermissionStore>()((set, get) => ({
  user: null,
  workspacePermissions: new Map(),
  isLoading: false,
  error: null,
  workspaceLoadingStates: new Map(),

  setUser: (user) => set({ user, error: null }),

  setWorkspacePermissions: (workspaceId, permissions) =>
    set((state) => {
      const nextPermissions = new Map(state.workspacePermissions);

      // Promote recently written workspace to newest position.
      if (nextPermissions.has(workspaceId)) {
        nextPermissions.delete(workspaceId);
      }
      nextPermissions.set(workspaceId, permissions);

      const boundedPermissions = pruneOldestEntries(
        nextPermissions,
        MAX_WORKSPACE_PERMISSION_CACHE,
      );

      const nextLoadingStates = new Map(state.workspaceLoadingStates);
      nextLoadingStates.set(workspaceId, false);

      // Keep loading-state map aligned with retained permission keys.
      for (const key of nextLoadingStates.keys()) {
        if (!boundedPermissions.has(key)) {
          nextLoadingStates.delete(key);
        }
      }

      return {
        workspacePermissions: boundedPermissions,
        workspaceLoadingStates: pruneOldestEntries(
          nextLoadingStates,
          MAX_WORKSPACE_LOADING_CACHE,
        ),
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
      const nextLoadingStates = new Map(state.workspaceLoadingStates);

      if (nextLoadingStates.has(workspaceId)) {
        nextLoadingStates.delete(workspaceId);
      }
      nextLoadingStates.set(workspaceId, isLoading);

      return {
        workspaceLoadingStates: pruneOldestEntries(
          nextLoadingStates,
          MAX_WORKSPACE_LOADING_CACHE,
        ),
      };
    }),

  isWorkspaceLoading: (workspaceId) => {
    const state = get();
    return state.workspaceLoadingStates.get(workspaceId) || false;
  },

  hasPermission: (permission, workspaceId) => {
    const state = get();
    if (!state.user) return false;

    if (state.user.role === "super_admin") return true;

    if (workspaceId) {
      const wsPerms = state.workspacePermissions.get(workspaceId);
      if (wsPerms?.permissions.includes(permission)) return true;
    }

    return state.user.permissions.includes(permission);
  },

  hasAnyPermission: (permissions, workspaceId) => {
    return permissions.some((perm) => get().hasPermission(perm, workspaceId));
  },

  hasAllPermissions: (permissions, workspaceId) => {
    return permissions.every((perm) => get().hasPermission(perm, workspaceId));
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
}));

// Register with global store registry for logout cleanup
const initialPermissionState = usePermissionStore.getInitialState();
registerStoreReset(() =>
  usePermissionStore.setState(initialPermissionState, true),
);
