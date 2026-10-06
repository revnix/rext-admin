"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Check,
  ChevronsUpDown,
  LayoutGrid,
  Plus,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useResourceLimit } from "@/components/subscription/usage-limit-warning";
import { workspaceQueries } from "@/lib/query-keys";
import { buildWorkspacePath, extractWorkspacePageSegment } from "@/lib/routes";
import { getWorkspaceDisplayTitle } from "@/lib/workspace";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { useWorkspaceStore } from "@/stores/workspace";
import type { Workspace } from "@/types/workspace";
import type { Route } from "next";
import { WorkspaceFavicon } from "./workspace-favicon";

/** Host of a workspace site URL for display, e.g. "revnix.com". */
function siteHost(url?: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).host;
  } catch {
    return null;
  }
}

/**
 * The workspace switcher under the wordmark (design/app-language.md §5): the workspace's favicon,
 * its name and its plan; inside, every workspace, the workspace's settings, all workspaces, and
 * "Create workspace" with the plan's cap.
 */
export function WorkspaceSwitcher({
  settingsUrl,
}: {
  /** The workspace settings page, when the person may open it. */
  settingsUrl?: string | null;
}) {
  const { isMobile, state } = useSidebar();
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
  const planName = useSubscriptionStore((state) => state.credits?.plan_name);

  const { data: workspaceListResponse, isLoading } = useQuery(
    workspaceQueries.list(),
  );
  const workspaces = workspaceListResponse?.workspaces || [];
  const {
    isLimitReached,
    isLoading: isLimitLoading,
    used,
    max,
  } = useResourceLimit("workspaces");

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

    // On a workspace page, open the same page in the other workspace; elsewhere, go home.
    const currentPageSegment = extractWorkspacePageSegment(pathname);
    if (currentPageSegment) {
      router.push(
        buildWorkspacePath(workspace.slug, currentPageSegment) as Route,
      );
    } else {
      router.push("/");
    }
  };

  const displayWorkspace = currentWorkspace || workspaces[0] || null;
  const name = isLoading
    ? "Loading…"
    : getWorkspaceDisplayTitle(displayWorkspace, "Choose a workspace");
  const detail = isLoading
    ? null
    : (planName ?? siteHost(displayWorkspace?.url) ?? null);
  const cap = max !== null && used !== null ? `${used} of ${max}` : null;
  const createLocked = isLimitReached || isLimitLoading;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="px-2.5 text-foreground data-[state=open]:bg-sidebar-accent"
              tooltip={name}
            >
              <WorkspaceFavicon name={name} />
              <span className="grid min-w-0 flex-1 text-left">
                <span className="truncate text-body font-medium">{name}</span>
                {detail && (
                  <span className="truncate text-caption text-muted-foreground">
                    {detail}
                  </span>
                )}
              </span>
              <ChevronsUpDown
                data-collapse="hide"
                className="ml-auto text-muted-foreground"
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-60"
            align="start"
            side={isMobile || state === "expanded" ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-caption font-medium text-muted-foreground">
              Workspaces
            </DropdownMenuLabel>
            {isLoading ? (
              <DropdownMenuItem disabled>Loading…</DropdownMenuItem>
            ) : workspaces.length === 0 ? (
              <p className="px-2 py-1.5 text-label text-muted-foreground">
                No workspaces yet.
              </p>
            ) : (
              workspaces.map((workspace) => {
                const title = getWorkspaceDisplayTitle(
                  workspace,
                  "Untitled workspace",
                );
                const isCurrent = currentWorkspace?.id === workspace.id;
                return (
                  <DropdownMenuItem
                    key={workspace.id}
                    onSelect={() => handleWorkspaceSelect(workspace)}
                    className="gap-2"
                  >
                    <WorkspaceFavicon name={title} />
                    <span className="grid min-w-0 flex-1">
                      <span className="truncate text-body">{title}</span>
                      {siteHost(workspace.url) && (
                        <span className="truncate text-caption text-muted-foreground">
                          {siteHost(workspace.url)}
                        </span>
                      )}
                    </span>
                    {isCurrent && (
                      <Check
                        aria-label="Current workspace"
                        className="size-4 shrink-0"
                      />
                    )}
                  </DropdownMenuItem>
                );
              })
            )}
            <DropdownMenuSeparator />
            {settingsUrl && (
              <DropdownMenuItem asChild>
                <Link href={settingsUrl as Route} className="gap-2">
                  <Settings className="size-4 text-muted-foreground" />
                  Workspace settings
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link href="/w" className="gap-2">
                <LayoutGrid className="size-4 text-muted-foreground" />
                All workspaces
              </Link>
            </DropdownMenuItem>
            {createLocked ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* A disabled item takes no pointer events, so the wrapper carries the tooltip. */}
                  <span className="block">
                    <DropdownMenuItem disabled className="gap-2">
                      <Plus className="size-4" />
                      <span className="flex-1">
                        {isLimitReached
                          ? "Workspace limit reached"
                          : "Checking your plan…"}
                      </span>
                      {cap && <span className="num text-caption">{cap}</span>}
                    </DropdownMenuItem>
                  </span>
                </TooltipTrigger>
                {isLimitReached && (
                  <TooltipContent side="right" className="max-w-xs">
                    Upgrade your plan to create more workspaces.
                  </TooltipContent>
                )}
              </Tooltip>
            ) : (
              <DropdownMenuItem asChild>
                <Link href="/w/create" className="gap-2">
                  <Plus className="size-4 text-muted-foreground" />
                  <span className="flex-1">Create workspace</span>
                  {cap && (
                    <span className="num text-caption text-muted-foreground">
                      {cap}
                    </span>
                  )}
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
