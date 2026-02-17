"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import Image from "next/image";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { workspaceQueries } from "@/lib/query-keys";
import { buildWorkspacePath, extractWorkspacePageSegment } from "@/lib/routes";
import { getWorkspaceDisplayTitle } from "@/lib/workspace";
import { useWorkspaceStore } from "@/stores/workspace";
import type { Workspace } from "@/types/workspace";

export function WorkspaceSwitcher() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const setCurrentWorkspace = useWorkspaceStore(
    (state) => state.setCurrentWorkspace,
  );
  const setWorkspaceList = useWorkspaceStore((state) => state.setWorkspaceList);
  const setLastWorkspacePath = useWorkspaceStore(
    (state) => state.setLastWorkspacePath,
  );
  const _lastWorkspacePath = useWorkspaceStore(
    (state) => state.lastWorkspacePath,
  );

  // Fetch all workspaces for the switcher
  const { data: workspaceListResponse, isLoading } = useQuery(
    workspaceQueries.switcher(),
  );

  const workspaces = workspaceListResponse?.workspaces || [];

  // Update local store when API data changes
  React.useEffect(() => {
    if (workspaces.length > 0) {
      setWorkspaceList(workspaces);
    }
  }, [workspaces, setWorkspaceList]);

  // Track current workspace path for preserving navigation
  React.useEffect(() => {
    const currentPageSegment = extractWorkspacePageSegment(pathname);
    if (currentPageSegment) {
      setLastWorkspacePath(currentPageSegment);
    }
  }, [pathname, setLastWorkspacePath]);

  const handleWorkspaceSelect = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);

    // Extract current page segment from pathname
    const currentPageSegment = extractWorkspacePageSegment(pathname);

    // If on a workspace-specific page, preserve it; otherwise go to dashboard
    if (currentPageSegment) {
      // Build new path with same page in new workspace
      const newPath = buildWorkspacePath(workspace.slug, currentPageSegment);
      router.push(newPath);
    } else {
      // Go to dashboard (workspace-scoped at /)
      router.push("/");
    }
  };

  // Use current workspace or first available workspace
  const displayWorkspace = currentWorkspace || workspaces[0] || null;

  // Always render - never return null for debugging
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              data-tooltip-id="workspace-switcher"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Image
                  src="/logos/icon_dark.svg"
                  alt="Rext"
                  width={20}
                  height={20}
                  className="size-5"
                />
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
                    : displayWorkspace?.timezone || "Choose a workspace"}
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
                  Get Started
                </DropdownMenuLabel>
                <div className="px-2 py-4 text-center">
                  <Building2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground mb-1">
                    No workspaces yet
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Create your first workspace to get started
                  </p>
                </div>
                <DropdownMenuSeparator />
              </>
            ) : (
              <>
                {/* All Workspaces Section */}
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  Workspaces
                </DropdownMenuLabel>
                {workspaces.map((workspace) => {
                  const isActive = currentWorkspace?.id === workspace.id;
                  return (
                    <DropdownMenuItem
                      key={workspace.id}
                      onClick={() => handleWorkspaceSelect(workspace)}
                      className="gap-2 p-2"
                    >
                      <div className="flex size-6 items-center justify-center rounded-md border">
                        <Building2 className="size-3.5 shrink-0" />
                      </div>
                      <div className="flex flex-col flex-1 gap-0.5">
                        <span className="text-sm">
                          {getWorkspaceDisplayTitle(
                            workspace,
                            "Untitled Workspace",
                          )}
                        </span>
                        {workspace.slug && (
                          <span className="text-xs text-muted-foreground">
                            {workspace.slug}
                          </span>
                        )}
                      </div>
                      {isActive && (
                        <Check className="size-4 text-primary shrink-0" />
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/w/create" className="gap-2 p-2">
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">
                  Create Workspace
                </div>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
