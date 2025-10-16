"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createContext, type ReactNode, useContext, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { log } from "@/lib/logger";
import { useWorkspaceStore } from "@/stores/workspace";
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
 * IMPORTANT: When workspaceId is a slug (not UUID), the workspaceSlug is
 * immediately available in context without waiting for API fetch. This ensures
 * navigation and routing work instantly even before full workspace data loads.
 *
 * @example
 * ```tsx
 * <WorkspaceProvider workspaceId={params.workspaceSlug}>
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

  // Immediately set a preliminary workspace in store using the slug from URL
  // This ensures workspace context is available even before API call completes
  useEffect(() => {
    // Only set preliminary workspace if:
    // 1. We have a slug (not UUID)
    // 2. We don't have the full workspace yet
    // 3. We're not currently loading (prevents race conditions)
    if (!isUuid && workspaceId && !workspace && !isLoading) {
      const preliminaryWorkspace: Workspace = {
        id: "", // Will be filled when API returns
        slug: workspaceId, // From URL
        title: workspaceId, // Use slug as title temporarily
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        url: "",
        created_at: "",
        updated_at: "",
      };

      log.info(
        "[WorkspaceProvider] Setting preliminary workspace from slug:",
        workspaceId,
      );
      setCurrentWorkspace(preliminaryWorkspace);
    }
  }, [workspaceId, isUuid, workspace, isLoading, setCurrentWorkspace]);

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

  // Immediately provide the slug from URL if it's not a UUID
  // This allows components to use workspaceSlug for navigation without waiting for API
  const immediateSlug = !isUuid ? workspaceId : workspace?.slug || "";

  const contextValue: WorkspaceContextType = {
    workspace,
    workspaceId: workspace?.id || "", // UUID - only available after fetch
    workspaceSlug: immediateSlug, // Slug - immediately available from URL
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
 * IMPORTANT: workspaceSlug is immediately available from URL (no loading wait).
 * Use it for navigation and routing. workspaceId (UUID) only available after API fetch.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { workspace, workspaceId, workspaceSlug, isLoading } = useWorkspace();
 *
 *   // ✅ workspaceSlug is IMMEDIATELY available (from URL)
 *   // Use for navigation without waiting for API
 *   const topicsUrl = workspaceRoutes.topicCreate(workspaceSlug);
 *
 *   // ⏳ workspaceId (UUID) only available after isLoading = false
 *   if (isLoading) return <div>Loading workspace details...</div>;
 *
 *   // Now you can use workspaceId for API calls
 *   log.info('UUID:', workspaceId);
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
