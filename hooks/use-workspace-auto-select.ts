"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { apiClient } from "@/lib/api-client";
import { log } from "@/lib/logger";
import { useWorkspaceStore } from "@/stores/workspace";

/**
 * Workspace Auto-Selection Hook
 *
 * Automatically selects a workspace when the dashboard loads:
 * 1. If currentWorkspace is already set (from localStorage) → keep it
 * 2. If user has 1 workspace → auto-select it
 * 3. If user has multiple workspaces → use first workspace or most recent
 * 4. If user has no workspaces → return null (show onboarding)
 *
 * This hook ensures users always land on a workspace-scoped dashboard
 * without manual selection.
 *
 * @example
 * ```tsx
 * function DashboardPage() {
 *   const { workspace, isLoading } = useWorkspaceAutoSelect();
 *
 *   if (isLoading) return <Loading />;
 *   if (!workspace) return <CreateWorkspace />;
 *
 *   return <Dashboard workspace={workspace} />;
 * }
 * ```
 */
export function useWorkspaceAutoSelect() {
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const workspaceList = useWorkspaceStore((state) => state.workspaceList);
  const setCurrentWorkspace = useWorkspaceStore(
    (state) => state.setCurrentWorkspace,
  );
  const setWorkspaceList = useWorkspaceStore((state) => state.setWorkspaceList);
  const recentWorkspaces = useWorkspaceStore((state) => state.recentWorkspaces);

  // Track if we've already run auto-selection
  const hasAutoSelected = useRef(false);

  // Fetch workspaces list
  const {
    data: workspacesResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => apiClient.workspaces.list(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const workspaces = workspacesResponse?.workspaces || [];

  // Auto-select workspace logic
  useEffect(() => {
    // Skip if already auto-selected
    if (hasAutoSelected.current) return;

    // Skip if still loading
    if (isLoading) return;

    // Skip if no workspaces fetched yet
    if (!workspaces.length) {
      log.info("No workspaces available for auto-selection");
      return;
    }

    // Update workspace list in store
    setWorkspaceList(workspaces);

    // If currentWorkspace is already set and exists in the list, keep it
    if (
      currentWorkspace &&
      workspaces.find((w) => w.id === currentWorkspace.id)
    ) {
      log.info("Current workspace already set, keeping it", {
        workspace: currentWorkspace.title,
      });
      hasAutoSelected.current = true;
      return;
    }

    // Auto-selection logic
    let selectedWorkspace = null;

    // Strategy 1: If only 1 workspace, auto-select it
    if (workspaces.length === 1) {
      selectedWorkspace = workspaces[0];
      log.info("Auto-selected single workspace", {
        workspace: selectedWorkspace.title,
      });
    }
    // Strategy 2: If multiple workspaces, use most recent or first
    else if (workspaces.length > 1) {
      // Try to find most recent workspace
      if (recentWorkspaces.length > 0) {
        const recentWorkspaceId = recentWorkspaces[0];
        selectedWorkspace =
          workspaces.find((w) => w.id === recentWorkspaceId) || workspaces[0];
        log.info("Auto-selected recent workspace", {
          workspace: selectedWorkspace.title,
        });
      } else {
        // Fallback to first workspace
        selectedWorkspace = workspaces[0];
        log.info("Auto-selected first workspace", {
          workspace: selectedWorkspace.title,
        });
      }
    }

    // Set the selected workspace
    if (selectedWorkspace) {
      setCurrentWorkspace(selectedWorkspace);
      hasAutoSelected.current = true;
    }
  }, [
    workspaces,
    currentWorkspace,
    recentWorkspaces,
    setCurrentWorkspace,
    setWorkspaceList,
    isLoading,
  ]);

  return {
    workspace: currentWorkspace,
    workspaceList,
    isLoading,
    error,
    hasWorkspaces: workspaceList.length > 0,
  };
}
