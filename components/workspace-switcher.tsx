"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, ChevronsUpDown, Clock, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { log } from "@/lib/logger";
import { getWorkspaceDisplayTitle } from "@/lib/workspace";
import { workspaceApiService } from "@/services";
import {
  useRecentWorkspaces,
  useWorkspaceStore,
} from "@/stores/workspace-store";
import type { Workspace } from "@/types/workspace";

export function WorkspaceSwitcher() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const setCurrentWorkspace = useWorkspaceStore(
    (state) => state.setCurrentWorkspace,
  );
  const setWorkspaceList = useWorkspaceStore((state) => state.setWorkspaceList);
  const addToRecentWorkspaces = useWorkspaceStore(
    (state) => state.addToRecentWorkspaces,
  );

  // Get recent workspaces for quick access
  const recentWorkspaces = useRecentWorkspaces();

  // Fetch all workspaces for the switcher
  const { data: workspaceListResponse, isLoading } = useQuery({
    queryKey: ["workspaces", "switcher"],
    queryFn: () => workspaceApiService.listWorkspaces(),
    staleTime: 2 * 60 * 1000, // 2 minutes - shorter for switcher
  });

  const workspaces = workspaceListResponse?.workspaces || [];

  // Separate recent workspaces from remaining workspaces to avoid duplicates
  const recentWorkspaceIds = new Set(recentWorkspaces.map((ws) => ws.id));
  const remainingWorkspaces = workspaces.filter(
    (workspace) => !recentWorkspaceIds.has(workspace.id),
  );

  // Update local store when API data changes
  React.useEffect(() => {
    if (workspaces.length > 0) {
      setWorkspaceList(workspaces);
    }
  }, [workspaces, setWorkspaceList]);

  const handleWorkspaceSelect = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    addToRecentWorkspaces(workspace.id);
    router.push(`/w/${workspace.slug}/topics`);
  };

  // Use current workspace or first available workspace
  const displayWorkspace = currentWorkspace || workspaces[0] || null;

  // Debug logging
  log.info("WorkspaceSwitcher Debug:", {
    isLoading,
    workspacesLength: workspaces.length,
    recentWorkspacesCount: recentWorkspaces.length,
    remainingWorkspacesCount: remainingWorkspaces.length,
    currentWorkspace: getWorkspaceDisplayTitle(currentWorkspace),
    displayWorkspace: getWorkspaceDisplayTitle(displayWorkspace),
    hasData: !!workspaceListResponse,
  });

  // Always render - never return null for debugging
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Building2 className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {isLoading
                    ? "Loading..."
                    : getWorkspaceDisplayTitle(
                        displayWorkspace,
                        "Select Workspace",
                      )}
                </span>
                <span className="truncate text-xs">
                  {isLoading
                    ? "Fetching workspaces..."
                    : displayWorkspace?.description ||
                      "Choose a workspace to start"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            {isLoading ? (
              <>
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  Workspaces
                </DropdownMenuLabel>
                <DropdownMenuItem disabled>
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded bg-muted animate-pulse" />
                    <div className="flex-1">
                      <div className="h-3 bg-muted rounded animate-pulse mb-1" />
                      <div className="h-2 bg-muted rounded animate-pulse w-2/3" />
                    </div>
                  </div>
                </DropdownMenuItem>
              </>
            ) : workspaces.length === 0 ? (
              <>
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  Workspaces
                </DropdownMenuLabel>
                <DropdownMenuItem disabled>
                  <span className="text-muted-foreground">
                    No workspaces found
                  </span>
                </DropdownMenuItem>
              </>
            ) : (
              <>
                {/* Recent Workspaces Section */}
                {recentWorkspaces.length > 0 && (
                  <>
                    <DropdownMenuLabel className="text-muted-foreground text-xs flex items-center gap-1">
                      <Clock className="size-3" />
                      Recent
                    </DropdownMenuLabel>
                    {recentWorkspaces.map((workspace, index) => (
                      <DropdownMenuItem
                        key={`recent-${workspace.id}`}
                        onClick={() => handleWorkspaceSelect(workspace)}
                        className="gap-2 p-2"
                      >
                        <div className="flex size-6 items-center justify-center rounded-md border">
                          <Building2 className="size-3.5 shrink-0" />
                        </div>
                        {getWorkspaceDisplayTitle(
                          workspace,
                          "Untitled Workspace",
                        )}
                        <DropdownMenuShortcut>
                          ⌘R{index + 1}
                        </DropdownMenuShortcut>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </>
                )}

                {/* All Workspaces Section */}
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  {recentWorkspaces.length > 0
                    ? "All Workspaces"
                    : "Workspaces"}
                </DropdownMenuLabel>
                {(recentWorkspaces.length > 0
                  ? remainingWorkspaces
                  : workspaces
                ).map((workspace, index) => (
                  <DropdownMenuItem
                    key={workspace.id}
                    onClick={() => handleWorkspaceSelect(workspace)}
                    className="gap-2 p-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded-md border">
                      <Building2 className="size-3.5 shrink-0" />
                    </div>
                    {getWorkspaceDisplayTitle(workspace, "Untitled Workspace")}
                    <DropdownMenuShortcut>
                      ⌘{recentWorkspaces.length + index + 1}
                    </DropdownMenuShortcut>
                  </DropdownMenuItem>
                ))}
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/workspaces" className="gap-2 p-2">
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">
                  Manage Workspaces
                </div>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
