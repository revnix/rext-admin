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
    retry: (failureCount, error) => {
      // Don't retry for 404, 401, or 403 errors
      const errorMessage = (error as Error)?.message || "";
      if (
        errorMessage.includes("404") ||
        errorMessage.includes("401") ||
        errorMessage.includes("403") ||
        errorMessage.includes("not found") ||
        errorMessage.includes("Not Found") ||
        errorMessage.includes("Unauthorized") ||
        errorMessage.includes("Forbidden")
      ) {
        return false;
      }
      // Retry up to 2 times for other errors (network issues, etc.)
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000), // Exponential backoff, max 3s
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
  // Only redirect for permission errors (401/403) or workspace not found (404)
  // Don't redirect for temporary network issues to prevent unwanted redirects
  useEffect(() => {
    if (error && !isLoading) {
      // Check if error is a permission/auth error or not found that warrants redirect
      const errorMessage = error?.message || "";
      const isAuthError =
        errorMessage.includes("401") ||
        errorMessage.includes("403") ||
        errorMessage.includes("Unauthorized") ||
        errorMessage.includes("Forbidden");
      const isNotFoundError =
        errorMessage.includes("404") ||
        errorMessage.includes("not found") ||
        errorMessage.includes("Not Found");

      if (isAuthError || isNotFoundError) {
        log.error(
          "[WorkspaceProvider] Failed to load workspace (auth/not found error), redirecting:",
          error,
        );
        router.push("/workspaces");
      } else {
        // For other errors (network, temporary issues), just log but don't redirect
        // This prevents unwanted redirects during form interactions
        log.warn(
          "[WorkspaceProvider] Workspace fetch error (not redirecting):",
          error,
        );
      }
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
