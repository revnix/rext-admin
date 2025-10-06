"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createContext, type ReactNode, useContext, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { log } from "@/lib/logger";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { Workspace } from "@/types/workspace";

/**
 * Workspace Context Type
 */
interface WorkspaceContextType {
  workspace: Workspace | undefined;
  workspaceId: string; // UUID - The actual workspace ID (workspace.id)
  workspaceSlug: string; // Slug - The URL-friendly identifier (workspace.slug)
  identifier: string; // The identifier used in the URL (could be UUID or slug for backward compat)
  isLoading: boolean;
  error: Error | null;
}

/**
 * Workspace Context
 */
const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

/**
 * Workspace Provider Props
 */
interface WorkspaceProviderProps {
  children: ReactNode;
  workspaceId: string; // This will be the slug from URL params
}

/**
 * Workspace Provider Component
 *
 * Fetches and provides workspace context to all child components.
 * Automatically syncs with Zustand store and handles invalid workspaces.
 *
 * @example
 * ```tsx
 * <WorkspaceProvider workspaceId={params.workspaceId}>
 *   <YourComponent />
 * </WorkspaceProvider>
 * ```
 */
export function WorkspaceProvider({
  children,
  workspaceId,
}: WorkspaceProviderProps) {
  const router = useRouter();
  const setCurrentWorkspace = useWorkspaceStore(
    (state) => state.setCurrentWorkspace,
  );
  const addToRecentWorkspaces = useWorkspaceStore(
    (state) => state.addToRecentWorkspaces,
  );

  log.info("[WorkspaceProvider] Initializing for workspace:", workspaceId);

  // Determine if workspaceId is a UUID or a slug
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      workspaceId,
    );

  // Query workspace data
  const {
    data: workspaceResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: async () => {
      log.info(
        "[WorkspaceProvider] Fetching workspace:",
        workspaceId,
        "isUuid:",
        isUuid,
      );
      // Use appropriate method based on identifier type
      return isUuid
        ? apiClient.workspaces.get(workspaceId)
        : apiClient.workspaces.getBySlug(workspaceId);
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once for invalid workspaces
  });

  const workspace = workspaceResponse?.workspace;

  // Sync with Zustand store when workspace data changes
  useEffect(() => {
    if (workspace) {
      log.info("[WorkspaceProvider] Workspace loaded:", workspace.title);
      setCurrentWorkspace(workspace);
      addToRecentWorkspaces(workspace.id);
    }
  }, [workspace, setCurrentWorkspace, addToRecentWorkspaces]);

  // Handle invalid workspace - redirect to workspace list
  useEffect(() => {
    if (error && !isLoading) {
      log.error(
        "[WorkspaceProvider] Failed to load workspace, redirecting:",
        error,
      );
      router.push("/workspaces");
    }
  }, [error, isLoading, router]);

  const contextValue: WorkspaceContextType = {
    workspace,
    workspaceId: workspace?.id || "", // UUID
    workspaceSlug: workspace?.slug || "", // Slug
    identifier: workspaceId, // Original URL param
    isLoading,
    error: error as Error | null,
  };

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  );
}

/**
 * Hook to access workspace context
 *
 * Must be used within a WorkspaceProvider.
 *
 * @throws Error if used outside WorkspaceProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { workspace, workspaceId, workspaceSlug, isLoading } = useWorkspace();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   // Access UUID
 *   log.info('UUID:', workspaceId);
 *
 *   // Access slug for URLs
 *   router.push(`/w/${workspaceSlug}/topics`);
 *
 *   // Or use from workspace object
 *   log.info('UUID:', workspace.id);
 *   log.info('Slug:', workspace.slug);
 *
 *   return <div>{workspace?.title}</div>;
 * }
 * ```
 */
export function useWorkspace(): WorkspaceContextType {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error(
      "useWorkspace must be used within a WorkspaceProvider. " +
        "Make sure your component is wrapped with <WorkspaceProvider>.",
    );
  }

  return context;
}

/**
 * Hook to safely access workspace context (returns null if outside provider)
 *
 * Use this when workspace context is optional.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const workspace = useWorkspaceOptional();
 *
 *   if (!workspace) {
 *     return <div>No workspace context</div>;
 *   }
 *
 *   return <div>{workspace.workspace?.title}</div>;
 * }
 * ```
 */
export function useWorkspaceOptional(): WorkspaceContextType | null {
  return useContext(WorkspaceContext);
}
