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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { workspaceQueries } from "@/lib/query-keys";
import { buildWorkspacePath, extractWorkspacePageSegment } from "@/lib/routes";
import { getWorkspaceDisplayTitle } from "@/lib/workspace";
import { useResourceLimit } from "@/components/subscription/usage-limit-warning";
import { useWorkspaceStore } from "@/stores/workspace";
import type { Workspace } from "@/types/workspace";
import type { Route } from "next";

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
  const { isLimitReached, isLoading: isLimitLoading } =
    useResourceLimit("workspaces");

  // Update local store when API data changes
  React.useEffect(() => {
    if (workspaces.length === 0) return;

    setWorkspaceList(workspaces);

    // Re-sync the persisted current workspace with the server copy. It is matched
    // by id, which survives a rename, so without this the store keeps a stale name
    // and slug indefinitely. Every sidebar link is built from that slug, and a
    // renamed workspace's old slug 404s straight back to /w. WorkspaceProvider
    // already does this inside /w/[slug], but not on /w, / or account pages -
    // which is exactly where the dead links were being rendered.
    //
    // The store can also hold nothing at all (fresh account whose create wizard
    // was left before it navigated into the workspace) or a workspace this
    // account can't see (deleted, or persisted from another session). The
    // sidebar fetches permissions for currentWorkspace.id, so in both cases no
    // workspace permissions ever load and every workspace nav item is hidden -
    // the owner is left with Dashboard, All Workspaces and Personal. Fall back
    // to the first accessible workspace, which is what this switcher already
    // displays. Matching by slug keeps WorkspaceProvider's preliminary
    // (id: "") entry on the workspace named in the URL.
    const serverCopy = currentWorkspace
      ? workspaces.find(
          (w) =>
            w.id === currentWorkspace.id || w.slug === currentWorkspace.slug,
        )
      : undefined;

    if (!serverCopy) {
      setCurrentWorkspace(workspaces[0]);
      return;
    }

    if (
      serverCopy.slug !== currentWorkspace?.slug ||
      serverCopy.name !== currentWorkspace?.name ||
      serverCopy.id !== currentWorkspace?.id
    ) {
      setCurrentWorkspace(serverCopy);
    }
  }, [workspaces, setWorkspaceList, currentWorkspace, setCurrentWorkspace]);

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
      router.push(newPath as Route);
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
              <div className="flex aspect-square size-8 items-center justify-center">
                <Image
                  src="/logos/icon_dark.svg"
                  alt="Rext AI"
                  width={28}
                  height={28}
                  className="size-7"
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
                  <p className="text-xs text-muted-foreground">
                    Create your first workspace to get started
                  </p>
                </div>
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
            {isLimitReached || isLimitLoading ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="block">
                    <DropdownMenuItem
                      asChild
                      disabled={true}
                      className="pointer-events-none opacity-60"
                    >
                      <Link
                        href="#"
                        onClick={(event) => event.preventDefault()}
                        className="gap-2 p-2"
                      >
                        <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                          <Plus className="size-4" />
                        </div>
                        <div className="text-muted-foreground font-medium">
                          {isLimitReached
                            ? "Workspace limit reached"
                            : "Checking plan..."}
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  Upgrade your plan to create more workspaces.
                </TooltipContent>
              </Tooltip>
            ) : (
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
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
