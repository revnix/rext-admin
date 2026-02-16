"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { useWorkspacePermissions } from "@/hooks/use-workspace-permissions";
import { ApiError } from "@/lib/api-client/core";
import { apiClient } from "@/lib/api-client";
import { log } from "@/lib/logger";
import { useWorkspaceStore } from "@/stores/workspace";
import type { Workspace } from "@/types/workspace";

const NON_RETRYABLE_STATUS_CODES = [401, 403, 404] as const;

/**
 * Workspace Context Type
 */
interface WorkspaceContextType {
  workspace: Workspace | undefined;
  workspaceId: string; // Identifier from URL - Can be slug OR UUID (backend accepts both)
  workspaceSlug: string; // Slug - The URL-friendly identifier (workspace.slug)
  identifier: string; // The identifier used in the URL (same as workspaceId)
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
function isNonRetryableError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return (NON_RETRYABLE_STATUS_CODES as readonly number[]).includes(error.statusCode);
  }
  return false;
}

/** Check if an error is an auth/permission error (401 or 403) */
function isAuthError(error: unknown): boolean {
  return error instanceof ApiError && (error.statusCode === 401 || error.statusCode === 403);
}

/** Check if an error is a not-found error (404) */
function isNotFoundError(error: unknown): boolean {
  return error instanceof ApiError && error.statusCode === 404;
}

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

  // Determine if workspaceId is a UUID or a slug
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      workspaceId,
    );

  // Load workspace permissions (Phase 1 integration)
  // This loads workspace-scoped permissions dynamically for the current workspace
  const {
    permissions: _permissions,
    role: _role,
    error: permissionsError,
  } = useWorkspacePermissions(workspaceId);

  // Log permission errors
  useEffect(() => {
    if (permissionsError) {
      log.error("[WorkspaceProvider] Failed to load permissions:", {
        workspaceId,
        error: permissionsError,
      });
    }
  }, [permissionsError, workspaceId]);

  // Query workspace data
  const {
    data: workspaceResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: async () => {
      // Use appropriate method based on identifier type
      return isUuid
        ? apiClient.workspaces.get(workspaceId)
        : apiClient.workspaces.getBySlug(workspaceId);
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry for auth errors (401/403) or not found (404)
      if (isNonRetryableError(error)) {
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

      setCurrentWorkspace(preliminaryWorkspace);
    }
  }, [workspaceId, isUuid, workspace, isLoading, setCurrentWorkspace]);

  // Sync with Zustand store when workspace data changes
  useEffect(() => {
    if (workspace) {
      setCurrentWorkspace(workspace);
      addToRecentWorkspaces(workspace.id);
    }
  }, [workspace, setCurrentWorkspace, addToRecentWorkspaces]);

  // Handle invalid workspace - redirect to workspace list
  // Only redirect for permission errors (401/403) or workspace not found (404)
  // Don't redirect for temporary network issues to prevent unwanted redirects
 useEffect(() => {
    if (error && !isLoading) {
      if (isAuthError(error) || isNotFoundError(error)) {
        log.error(
          "[WorkspaceProvider] Failed to load workspace (auth/not found error), redirecting:",
          error,
        );
        router.push("/w");
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

  const contextValue = useMemo<WorkspaceContextType>(
    () => ({
      workspace,
      workspaceId,
      workspaceSlug: immediateSlug,
      identifier: workspaceId,
      isLoading,
      error: error as Error | null,
    }),
    [workspace, workspaceId, immediateSlug, isLoading, error],
  );

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
