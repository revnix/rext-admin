"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { log } from "@/lib/logger";
import { usePermissionStore } from "@/stores/permission-store";

/**
 * Hook to load and manage workspace-scoped permissions
 *
 * Automatically fetches permissions when workspace changes and stores them
 * in the permission store for fast, synchronous access.
 *
 * @param workspaceId - Workspace UUID or slug
 * @returns Workspace permissions data and loading state
 *
 * @example
 * function WorkspaceLayout({ workspaceId }: Props) {
 *   const { permissions, roles, isLoading } = useWorkspacePermissions(workspaceId);
 *
 *   if (isLoading) return <LoadingSpinner />;
 *
 *   return (
 *     <div>
 *       <h2>Your permissions: {permissions.join(", ")}</h2>
 *     </div>
 *   );
 * }
 */
export function useWorkspacePermissions(workspaceId?: string) {
  const { setWorkspacePermissions } = usePermissionStore();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["workspace-permissions", workspaceId],
    queryFn: async () => {
      if (!workspaceId) throw new Error("Workspace ID is required");

      log.debug("Fetching workspace permissions", { workspaceId });

      try {
        const result = await apiClient.workspaces.getPermissions(workspaceId);
        return result;
      } catch (err) {
        log.error("Failed to fetch workspace permissions", {
          workspaceId,
          error: err,
        });
        throw err;
      }
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Store permissions in Zustand store when data changes
  useEffect(() => {
    if (data && workspaceId) {
      log.debug("Storing workspace permissions", {
        workspaceId,
        permissionCount: data.permissions.length,
        roleCount: data.roles.length,
      });

      setWorkspacePermissions(workspaceId, {
        workspaceId: data.workspace_id,
        role: data.roles[0]?.name || "viewer", // Primary role
        permissions: data.permissions,
      });
    }
  }, [data, workspaceId, setWorkspacePermissions]);

  return {
    permissions: data?.permissions || [],
    roles: data?.roles || [],
    workspaceId: data?.workspace_id,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to refresh workspace permissions
 *
 * Useful after role changes or permission updates.
 *
 * @example
 * function RoleChangeHandler() {
 *   const { refreshPermissions, isRefreshing } = useRefreshWorkspacePermissions();
 *
 *   const handleRoleChange = async () => {
 *     await updateUserRole(...);
 *     await refreshPermissions('workspace-id');
 *     toast.success("Permissions updated");
 *   };
 * }
 */
export function useRefreshWorkspacePermissions() {
  const queryClient = useQueryClient();
  const { setWorkspacePermissions } = usePermissionStore();

  const refreshPermissions = async (workspaceId: string) => {
    try {
      log.info("Refreshing workspace permissions", { workspaceId });

      // Fetch fresh permissions from API
      const result = await apiClient.workspaces.refreshPermissions(workspaceId);

      // Update query cache
      queryClient.setQueryData(["workspace-permissions", workspaceId], result);

      // Update permission store
      setWorkspacePermissions(workspaceId, {
        workspaceId: result.workspace_id,
        role: result.roles[0]?.name || "viewer",
        permissions: result.permissions,
      });

      log.info("Workspace permissions refreshed successfully", {
        workspaceId,
        permissionCount: result.permissions.length,
      });

      return result;
    } catch (error) {
      log.error("Failed to refresh workspace permissions", {
        workspaceId,
        error,
      });
      throw error;
    }
  };

  return {
    refreshPermissions,
  };
}

/**
 * Hook to check a single workspace permission
 *
 * Makes an API call to verify permission in real-time.
 * Use sparingly - prefer useWorkspacePermissions for bulk checks.
 *
 * @param workspaceId - Workspace UUID or slug
 * @param permission - Permission to check
 * @returns Permission check result
 *
 * @example
 * function DeleteButton({ workspaceId }: Props) {
 *   const { hasPermission, isLoading } = useCheckWorkspacePermission(
 *     workspaceId,
 *     'content:delete'
 *   );
 *
 *   if (isLoading) return <ButtonSkeleton />;
 *   if (!hasPermission) return null;
 *
 *   return <Button>Delete</Button>;
 * }
 */
export function useCheckWorkspacePermission(
  workspaceId?: string,
  permission?: string,
) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["workspace-permission-check", workspaceId, permission],
    queryFn: async () => {
      if (!workspaceId || !permission) {
        throw new Error("Workspace ID and permission are required");
      }
      return apiClient.workspaces.checkPermission(workspaceId, permission);
    },
    enabled: !!workspaceId && !!permission,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    hasPermission: data?.has_permission || false,
    isLoading,
    error,
  };
}
