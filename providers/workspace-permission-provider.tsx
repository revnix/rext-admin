"use client";

import { useParams } from "next/navigation";
import type React from "react";
import { createContext, useContext, useEffect } from "react";
import { useWorkspacePermissions } from "@/hooks/use-workspace-permissions";
import { log } from "@/lib/logger";
import { useWorkspaceStore } from "@/stores/workspace";

/**
 * Workspace Permission Context
 *
 * Provides workspace-scoped permissions to all child components.
 * Automatically loads permissions when workspace changes.
 */
interface WorkspacePermissionContextValue {
  permissions: string[];
  roles: Array<{
    name: string;
    display_name: string;
    workspace_scoped: boolean;
  }>;
  workspaceId?: string;
  isLoading: boolean;
}

const WorkspacePermissionContext =
  createContext<WorkspacePermissionContextValue | null>(null);

/**
 * Workspace Permission Provider
 *
 * Wraps workspace-scoped routes and automatically loads permissions.
 * Place this provider in workspace layout to ensure permissions are loaded
 * before any workspace-scoped components render.
 *
 * @example
 * // In app/w/[workspaceSlug]/layout.tsx
 * export default function WorkspaceLayout({ children }) {
 *   return (
 *     <WorkspacePermissionProvider>
 *       {children}
 *     </WorkspacePermissionProvider>
 *   );
 * }
 */
export function WorkspacePermissionProvider({
  children,
  workspaceId: propWorkspaceId,
}: {
  children: React.ReactNode;
  workspaceId?: string;
}) {
  // Get workspace from route params or props
  const params = useParams();
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);

  // Determine workspace ID from multiple sources
  const workspaceId =
    propWorkspaceId ||
    (currentWorkspace?.id as string | undefined) ||
    (params?.workspaceSlug as string | undefined);

  // Load workspace permissions
  const { permissions, roles, isLoading } =
    useWorkspacePermissions(workspaceId);

  useEffect(() => {
    if (workspaceId && !isLoading) {
      log.debug("Workspace permissions loaded", {
        workspaceId,
        permissionCount: permissions.length,
        roleCount: roles.length,
      });
    }
  }, [workspaceId, isLoading, permissions.length, roles.length]);

  const value: WorkspacePermissionContextValue = {
    permissions,
    roles,
    workspaceId,
    isLoading,
  };

  return (
    <WorkspacePermissionContext.Provider value={value}>
      {children}
    </WorkspacePermissionContext.Provider>
  );
}

/**
 * Hook to use workspace permission context
 *
 * @returns Workspace permission context value
 * @throws Error if used outside WorkspacePermissionProvider
 *
 * @example
 * function MyComponent() {
 *   const { permissions, isLoading } = useWorkspacePermissionContext();
 *
 *   if (isLoading) return <LoadingSpinner />;
 *
 *   return <div>You have {permissions.length} permissions</div>;
 * }
 */
export function useWorkspacePermissionContext() {
  const context = useContext(WorkspacePermissionContext);

  if (!context) {
    throw new Error(
      "useWorkspacePermissionContext must be used within WorkspacePermissionProvider",
    );
  }

  return context;
}

/**
 * Hook to get current workspace ID from context
 *
 * @returns Current workspace ID or undefined
 *
 * @example
 * function DeleteButton() {
 *   const workspaceId = useCurrentWorkspaceId();
 *   const canDelete = useWorkspacePermission("content.delete", workspaceId);
 *
 *   if (!canDelete) return null;
 *   return <Button>Delete</Button>;
 * }
 */
export function useCurrentWorkspaceId(): string | undefined {
  const context = useContext(WorkspacePermissionContext);
  return context?.workspaceId;
}
