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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import { subscriptionQueries, workspaceQueries } from "@/lib/query-keys";
import { extractWorkspacePageSegment } from "@/lib/routes";
import { getWorkspaceDisplayTitle } from "@/lib/workspace";
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
/** A workspace in the list: its icon, its name and site, and a check on the current one. */
function WorkspaceRow({
  title,
  workspace,
  current,
}: {
  title: string;
  workspace: Workspace;
  current: boolean;
}) {
  return (
    <>
      <WorkspaceFavicon name={title} src={workspace.favicon_url} />
      <span className="grid min-w-0 flex-1">
        <span className="truncate text-body">{title}</span>
        {siteHost(workspace.url) && (
          <span className="truncate text-caption text-muted-foreground">
            {siteHost(workspace.url)}
          </span>
        )}
      </span>
      {current && (
        <Check aria-label="Current workspace" className="size-4 shrink-0" />
      )}
    </>
  );
}

/** A link in the phone's workspace sheet, which closes the sheets as it navigates. */
function SheetLink({
  href,
  onNavigate,
  children,
}: {
  href: string;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href as Route}
      onClick={onNavigate}
      className="flex min-h-(--control-height-lg) items-center gap-2 rounded-sm px-2 text-label hover:bg-surface-inset focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {children}
    </Link>
  );
}

export function WorkspaceSwitcher({
  settingsUrl,
}: {
  /** The workspace settings page, when the person may open it. */
  settingsUrl?: string | null;
}) {
  const { isMobile, setOpenMobile } = useSidebar();
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

  const [sheetOpen, setSheetOpen] = React.useState(false);
  const handleSheetNavigate = () => {
    setSheetOpen(false);
    setOpenMobile(false);
  };

  const handleWorkspaceSelect = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    // The shell stays mounted across workspaces, so the phone's sheets would stay open over the page.
    setSheetOpen(false);
    setOpenMobile(false);
    // A workspace opens on its Home (FB2.5), whatever page the switch was made from.
    router.push(`/w/${workspace.slug}` as Route);
  };

  const displayWorkspace = currentWorkspace || workspaces[0] || null;
  // The list carries each workspace's favicon (G9); the stored current workspace may
  // predate it, so the list's copy wins.
  const displayFavicon =
    workspaces.find((workspace) => workspace.id === displayWorkspace?.id)
      ?.favicon_url ?? displayWorkspace?.favicon_url;
  // The plan is the workspace owner's, so it is read for the workspace shown: the shell's credits
  // are the signed-in person's own on account pages, which differ for a collaborator.
  const { data: workspaceCredits, isError: planFailed } = useQuery({
    ...subscriptionQueries.workspaceCredits(displayWorkspace?.id ?? ""),
    enabled: Boolean(displayWorkspace?.id),
  });
  const planName = workspaceCredits?.plan_name;
  const name = isLoading
    ? "Loading…"
    : getWorkspaceDisplayTitle(displayWorkspace, "Choose a workspace");
  const detail = isLoading
    ? null
    : (planName ?? (planFailed ? siteHost(displayWorkspace?.url) : null));
  const cap = max !== null && used !== null ? `${used} of ${max}` : null;
  const createLocked = isLimitReached || isLimitLoading;

  const trigger = (
    <SidebarMenuButton
      size="lg"
      className="px-2.5 text-foreground data-[state=open]:bg-sidebar-accent"
      tooltip={name}
    >
      <WorkspaceFavicon name={name} src={isLoading ? null : displayFavicon} />
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
  );

  // Phones: the sidebar is itself a sheet, so the list opens as a sheet from the bottom (FB2.5), with
  // the same entries; a disabled entry says why in words, as a touch screen shows no tooltip.
  if (isMobile) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>{trigger}</SheetTrigger>
            <SheetContent
              side="bottom"
              className="max-h-[80dvh] overflow-y-auto"
            >
              <SheetHeader>
                <SheetTitle>Workspaces</SheetTitle>
              </SheetHeader>
              <nav aria-label="Workspaces" className="grid gap-1 px-4 pb-4">
                {workspaces.map((workspace) => {
                  const title = getWorkspaceDisplayTitle(
                    workspace,
                    "Untitled workspace",
                  );
                  return (
                    <button
                      key={workspace.id}
                      type="button"
                      onClick={() => handleWorkspaceSelect(workspace)}
                      className="flex min-h-(--control-height-lg) items-center gap-2 rounded-sm px-2 text-left hover:bg-surface-inset focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <WorkspaceRow
                        title={title}
                        workspace={workspace}
                        current={currentWorkspace?.id === workspace.id}
                      />
                    </button>
                  );
                })}
                <hr className="my-1 border-border" />
                {settingsUrl && (
                  <SheetLink
                    href={settingsUrl}
                    onNavigate={handleSheetNavigate}
                  >
                    <Settings className="size-4 text-muted-foreground" />
                    Workspace settings
                  </SheetLink>
                )}
                <SheetLink href="/w" onNavigate={handleSheetNavigate}>
                  <LayoutGrid className="size-4 text-muted-foreground" />
                  All workspaces
                </SheetLink>
                {createLocked ? (
                  <p className="flex min-h-(--control-height-lg) items-center gap-2 px-2 text-label text-muted-foreground">
                    <Plus className="size-4" />
                    <span className="flex-1">
                      {isLimitReached
                        ? "Workspace limit reached: upgrade your plan to create more"
                        : "Checking your plan…"}
                    </span>
                    {cap && <span className="num text-caption">{cap}</span>}
                  </p>
                ) : (
                  <SheetLink href="/w/create" onNavigate={handleSheetNavigate}>
                    <Plus className="size-4 text-muted-foreground" />
                    <span className="flex-1">Create workspace</span>
                    {cap && (
                      <span className="num text-caption text-muted-foreground">
                        {cap}
                      </span>
                    )}
                  </SheetLink>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Desktop: the list opens to the right of the sidebar, expanded or collapsed (FB2.5), so it never
  // covers the sidebar's own entries.
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-60"
            align="start"
            side="right"
            sideOffset={8}
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
                    <WorkspaceRow
                      title={title}
                      workspace={workspace}
                      current={isCurrent}
                    />
                  </DropdownMenuItem>
                );
              })
            )}
            <DropdownMenuSeparator />
            {settingsUrl && (
              <DropdownMenuItem asChild>
                <Link
                  href={settingsUrl as Route}
                  onClick={() => setOpenMobile(false)}
                  className="gap-2"
                >
                  <Settings className="size-4 text-muted-foreground" />
                  Workspace settings
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link
                href="/w"
                onClick={() => setOpenMobile(false)}
                className="gap-2"
              >
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
                <Link
                  href="/w/create"
                  onClick={() => setOpenMobile(false)}
                  className="gap-2"
                >
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
