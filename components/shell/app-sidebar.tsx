"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown, SquarePen } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import * as React from "react";

import { Logo, LogoMark } from "@/components/brand-logo";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { dashboardQueries } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/stores/workspace";
import type { NavItem } from "@/types/navigation";
import { CreditMeter } from "./credit-meter";
import type { ShellNavigation } from "./use-shell-navigation";
import { UserMenu } from "./user-menu";
import { WorkspaceSwitcher } from "./workspace-switcher";

/** Remembers whether a sidebar group is open, per browser; storage can be refused. */
function useRememberedOpen(key: string, fallback: boolean) {
  const [open, setOpen] = React.useState(fallback);
  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(key);
      if (saved !== null) setOpen(saved === "true");
    } catch {
      // Private windows and blocked storage keep the default.
    }
  }, [key]);
  const remember = React.useCallback(
    (value: boolean) => {
      setOpen(value);
      try {
        window.localStorage.setItem(key, String(value));
      } catch {
        // Same as above: the choice lasts until the page reloads.
      }
    },
    [key],
  );
  return [open, remember] as const;
}

/** A tooltip for a control in the 56 px rail; there is nothing to name when labels show. */
function RailTooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactElement;
}) {
  const { state, isMobile } = useSidebar();
  if (state !== "collapsed" || isMobile) return children;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

/** The one primary action at the top of the sidebar (language §5), with its shortcut, C. */
function GenerateButton({ navigation }: { navigation: ShellNavigation }) {
  const { generate, workspaceSlug, activeUrl } = navigation;
  const { setOpenMobile } = useSidebar();
  if (!workspaceSlug) return null;

  const className =
    "flex h-9 w-full items-center gap-2 rounded-sm bg-primary px-3 max-lg:h-(--control-height-lg) text-body font-medium text-primary-foreground transition-colors duration-(--duration-fast) ease-out hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none [&>svg]:size-4 [&>svg]:shrink-0";

  if (!generate) {
    // Locked, not hidden (language §8): the role can read the workspace but not write in it.
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {/* aria-disabled, not disabled: it stays focusable, so the tooltip can say why. */}
          <button
            data-rec="show"
            type="button"
            aria-disabled="true"
            className={cn(className, "cursor-not-allowed opacity-50")}
          >
            <SquarePen />
            <span data-collapse="label">Generate</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          Your role in this workspace can't create content.
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <RailTooltip label="Generate (C)">
      <Link
        href={generate.url as Route}
        prefetch={generate.prefetch}
        aria-keyshortcuts="c"
        aria-current={generate.url === activeUrl ? "page" : undefined}
        onClick={() => setOpenMobile(false)}
        className={className}
      >
        <SquarePen />
        <span data-collapse="label" className="flex-1">
          Generate
        </span>
        <kbd
          data-collapse="hide"
          className="hidden rounded-sm border border-primary-foreground/30 px-1.5 font-mono text-caption lg:inline"
        >
          C
        </kbd>
      </Link>
    </RailTooltip>
  );
}

/** Drafts waiting in the workspace, for the Content row's badge. */
function useDraftCount(enabled: boolean): number {
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspace?.id);
  const { data } = useQuery({
    ...dashboardQueries.stats(workspaceId ?? ""),
    enabled: enabled && !!workspaceId,
  });
  return data?.content.draft ?? 0;
}

function NavRow({
  item,
  active,
  badge,
}: {
  item: NavItem;
  active: boolean;
  badge?: number;
}) {
  const { setOpenMobile } = useSidebar();
  const Icon = item.icon;
  return (
    <SidebarMenuItem>
      {/* The entry's title is one of the shell's own (use-shell-navigation.ts). */}
      <SidebarMenuButton
        asChild
        isActive={active}
        tooltip={item.title}
        data-rec="own"
      >
        <Link
          href={item.url as Route}
          prefetch={item.prefetch}
          onClick={() => setOpenMobile(false)}
        >
          {Icon && <Icon />}
          <span>{item.title}</span>
          {badge ? (
            <span className="sr-only">
              , {badge} {badge === 1 ? "draft" : "drafts"}
            </span>
          ) : null}
        </Link>
      </SidebarMenuButton>
      {badge ? (
        <SidebarMenuBadge aria-hidden="true">{badge}</SidebarMenuBadge>
      ) : null}
    </SidebarMenuItem>
  );
}

/**
 * Workspace settings, whose pages are listed beneath it until D5 makes them sections of one page:
 * open while one of them is the current page, a menu beside the icon in the rail.
 */
function SettingsRow({
  item,
  activeUrl,
}: {
  item: NavItem;
  activeUrl: string | null;
}) {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const pages = item.items ?? [];
  const Icon = item.icon;
  const current = pages.find((page) => page.url === activeUrl);
  const [open, setOpen] = React.useState(Boolean(current));
  React.useEffect(() => {
    if (current) setOpen(true);
  }, [current]);

  if (state === "collapsed" && !isMobile) {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton isActive={Boolean(current)} tooltip={item.title}>
              {Icon && <Icon />}
              <span>{item.title}</span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="min-w-48">
            <DropdownMenuLabel className="text-caption font-medium text-muted-foreground">
              {item.title}
            </DropdownMenuLabel>
            {pages.map((page) => (
              <DropdownMenuItem key={page.url} asChild>
                <Link
                  href={page.url as Route}
                  prefetch={page.prefetch}
                  aria-current={page.url === activeUrl ? "page" : undefined}
                >
                  {page.title}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          {/* An open group is not a selection: the fill stays for menus that are open. */}
          <SidebarMenuButton
            isActive={Boolean(current) && !open}
            className="data-[state=open]:bg-transparent data-[state=open]:hover:bg-sidebar-accent"
            data-rec="own"
          >
            {Icon && <Icon />}
            <span className="flex-1">{item.title}</span>
            <ChevronDown
              data-collapse="hide"
              className={cn(
                "ml-auto transition-transform duration-(--duration-base) ease-out",
                open && "rotate-180",
              )}
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {pages.map((page) => (
              <SidebarMenuSubItem key={page.url}>
                <SidebarMenuSubButton
                  asChild
                  isActive={page.url === activeUrl}
                  data-rec="own"
                >
                  <Link
                    href={page.url as Route}
                    prefetch={page.prefetch}
                    onClick={() => setOpenMobile(false)}
                  >
                    <span>{page.title}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

/** A group with a 12 px eyebrow that folds away; always open in the rail, where labels hide. */
function FoldingGroup({
  label,
  storageKey,
  items,
  activeUrl,
  defaultOpen,
}: {
  label: string;
  storageKey: string;
  items: NavItem[];
  activeUrl: string | null;
  defaultOpen: boolean;
}) {
  const { state, isMobile } = useSidebar();
  const [remembered, remember] = useRememberedOpen(storageKey, defaultOpen);
  const holdsCurrent = items.some((item) => item.url === activeUrl);
  const open =
    remembered || holdsCurrent || (state === "collapsed" && !isMobile);

  return (
    <Collapsible open={open} onOpenChange={remember} asChild>
      <SidebarGroup>
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className="w-full cursor-pointer hover:text-foreground">
            {label}
            <ChevronDown
              className={cn(
                "ml-auto transition-transform duration-(--duration-base) ease-out",
                !open && "-rotate-90",
              )}
            />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <NavRow
                  key={item.url}
                  item={item}
                  active={item.url === activeUrl}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

/**
 * The sidebar (design/app-language.md §5, DECISIONS D9): the wordmark, the workspace switcher,
 * Generate, then Home, Content, Keywords, Calendar, the Setup group, Settings; the admin
 * group last, for the roles that hold it; the credits meter and the user menu at the foot.
 */
export function AppSidebar({ navigation }: { navigation: ShellNavigation }) {
  const { main, setup, settings, admin, activeUrl, workspaceSlug } = navigation;
  const contentUrl = main.find((item) => item.title === "Content")?.url;
  const drafts = useDraftCount(Boolean(contentUrl));

  return (
    <Sidebar>
      <SidebarHeader className="gap-3 pt-3">
        <Link
          href="/"
          aria-label="Rext AI home"
          className="flex h-8 items-center rounded-sm px-3 focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none max-lg:h-(--control-height-lg)"
        >
          <span data-collapse="hide">
            <Logo className="h-5" />
          </span>
          <LogoMark className="hidden size-4 group-data-[collapsible=icon]:block lg:max-xl:group-data-[collapsible=auto]:block" />
        </Link>
        <WorkspaceSwitcher settingsUrl={settings?.url ?? null} />
        <GenerateButton navigation={navigation} />
      </SidebarHeader>

      <SidebarContent className="pt-2 pb-3">
        <nav aria-label="Main" className="flex flex-col gap-4">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {main.map((item) => (
                  <NavRow
                    key={item.url}
                    item={item}
                    active={item.url === activeUrl}
                    badge={item.url === contentUrl ? drafts : undefined}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {setup.length > 0 && (
            <FoldingGroup
              label="Setup"
              storageKey="rext.sidebar.setup-open"
              items={setup}
              activeUrl={activeUrl}
              defaultOpen
            />
          )}

          {settings && workspaceSlug && (
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SettingsRow item={settings} activeUrl={activeUrl} />
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {admin.length > 0 && (
            <FoldingGroup
              label="Admin"
              storageKey="rext.sidebar.admin-open"
              items={admin}
              activeUrl={activeUrl}
              defaultOpen={false}
            />
          )}
        </nav>
      </SidebarContent>

      <SidebarFooter>
        <CreditMeter />
        <UserMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
