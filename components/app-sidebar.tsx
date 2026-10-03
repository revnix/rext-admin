"use client";

import {
  CreditCard,
  LayoutDashboard,
  Mail,
  Monitor,
  Plus,
  Shield,
  User,
  UserCog,
  ChevronDown,
  Settings2,
  FolderOpen,
  Sparkles,
  Library,
  CalendarDays,
  ShieldCheck,
  DollarSign,
  FileText,
} from "lucide-react";
import type * as React from "react";
import { useState } from "react";

// EmptyWorkspacePrompt removed
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";

import { useFilteredNavigation } from "@/hooks/use-filtered-navigation";
import {
  AUDIT_PERMISSIONS,
  BILLING_PERMISSIONS,
  ROLE_PERMISSIONS,
  ROLES,
  SECURITY_PERMISSIONS,
} from "@/lib/permissions";
import { workspaceRoutes, settingsRoutes } from "@/lib/routes";
import { useWorkspaceStore } from "@/stores/workspace";
import { useResourceLimit } from "@/components/subscription/usage-limit-warning";
import { LockedFeatureTooltip } from "@/components/permission/locked-feature-tooltip";
import type { NavGroup, NavItem } from "@/types/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSidebar } from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import type { Route } from "next";

function ThreeDotsSeparator() {
  return (
    <div className="flex justify-center py-2 text-sidebar-foreground/40">
      <div className="flex gap-1">
        <div className="h-1 w-1 rounded-full bg-current" />
        <div className="h-1 w-1 rounded-full bg-current" />
        <div className="h-1 w-1 rounded-full bg-current" />
      </div>
    </div>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const workspaceList = useWorkspaceStore((state) => state.workspaceList);
  const hasWorkspaces = workspaceList.length > 0;
  // Workspace permissions are fetched once by WorkspaceProvider (keyed by
  // the workspace UUID) and consumed via useWorkspacePermission()/the
  // permission store. Do not add a useWorkspacePermissions() call here — it
  // duplicated the permissions request under a different cache key and its
  // result was unused.
  const { state: sidebarState } = useSidebar();
  const { isLimitReached } = useResourceLimit("workspaces");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  // undefined = not toggled yet, so the accordion follows the active route.
  const [expandedAccordion, setExpandedAccordion] = useState<
    string | null | undefined
  >(undefined);

  // Main navigation groups
  const mainNavigationGroups: NavGroup[] = [
    {
      groupLabel: "",
      items: [
        {
          title: "Dashboard",
          url: "/",
          icon: LayoutDashboard,
          prefetch: false,
        },
        {
          title: "All Workspaces",
          url: "/w",
          icon: FolderOpen,
          prefetch: false,
        },
      ],
    },
    {
      groupLabel: "Workspace",
      items: [
        {
          title: "Generate Content",
          // Always the blank generation page. It used to point at the running
          // job instead, which meant the only nav entry for generating content
          // took you back into work already in progress and gave no way to
          // start another. Running jobs are reachable from the dock.
          url: currentWorkspace?.slug
            ? workspaceRoutes.generate_content(currentWorkspace.slug)
            : "/",
          icon: Sparkles,
          permission: "content.create",
          prefetch: false,
        },
        {
          title: "Content Library",
          url: currentWorkspace?.slug
            ? workspaceRoutes.content(currentWorkspace.slug)
            : "/",
          icon: Library,
          permission: "content.read",
          prefetch: false,
        },
        {
          title: "Content Calendar",
          url: currentWorkspace?.slug
            ? workspaceRoutes.content_calendar(currentWorkspace.slug)
            : "/",
          icon: CalendarDays,
          permission: "content.read",
          prefetch: false,
        },
        {
          title: "Personas",
          url: currentWorkspace?.slug
            ? workspaceRoutes.personas(currentWorkspace.slug)
            : "/",
          icon: User,
          permission: "persona.read",
          prefetch: false,
        },
        {
          // No parent permission: each child is filtered on its own, and the
          // dropdown hides only when every child is filtered out.
          title: "Settings",
          url: currentWorkspace?.slug
            ? workspaceRoutes.settings.root(currentWorkspace.slug)
            : "/",
          icon: Settings2,
          items: currentWorkspace?.slug
            ? [
                {
                  title: "General",
                  url: workspaceRoutes.settings.root(currentWorkspace.slug),
                  permission: "workspace.update",
                  prefetch: false,
                },
                {
                  title: "Brand Voice",
                  url: workspaceRoutes.brand_voice(currentWorkspace.slug),
                  permission: "brand_voice.read",
                  prefetch: false,
                },
                {
                  title: "Members",
                  url: workspaceRoutes.members(currentWorkspace.slug),
                  permission: "member.read",
                  prefetch: false,
                },
                {
                  title: "Integrations",
                  url: workspaceRoutes.integrations(currentWorkspace.slug),
                  permission: "integration.read",
                  prefetch: false,
                },
              ]
            : [],
        },
      ],
    },
  ];

  if (!hasWorkspaces) {
    mainNavigationGroups[0].items.push({
      title: "Create Workspace",
      url: isLimitReached ? "#" : "/w/create",
      icon: Plus,
    });
  }

  // Personal navigation groups
  const personalNavigationGroups: NavGroup[] = [
    {
      groupLabel: "Personal",
      items: [
        {
          title: "Account",
          url: settingsRoutes.root,
          icon: User,
          prefetch: false,
        },
        {
          title: "Subscription",
          url: "/subscription",
          icon: CreditCard,
          items: [
            { title: "Overview", url: "/subscription", prefetch: false },
            { title: "Billing", url: "/billing", prefetch: false },
            { title: "Usage", url: "/usage", prefetch: false },
            { title: "Licenses", url: "/licenses", prefetch: false },
          ],
        },
        // { title: "Settings", url: "/settings", icon: Settings2 },
      ],
    },
  ];

  // Admin navigation groups
  const administratorNavigationGroups: NavGroup[] = [
    {
      groupLabel: "Administration",
      // Visibility is per-item: a role holding only audit.read (support) gets
      // just the Audit Logs entry, not the whole admin area.
      // Admin pages are global-scoped (proxy.ts); a workspace grant of the
      // same permission must not surface them.
      globalOnly: true,
      items: [
        {
          title: "Dashboard",
          url: "/admin",
          icon: LayoutDashboard,
          anyRole: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
          prefetch: false,
        },
        {
          title: "User Management",
          url: "/admin/users",
          icon: UserCog,
          // user.manage is held only by admin/super_admin; the global support
          // role additionally gets read-only visibility (user.read itself is
          // the self-service permission every account holds, so it can't gate).
          anyRole: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.SUPPORT],
          prefetch: false,
        },
        {
          title: "Subscriptions",
          url: "/admin/subscriptions",
          icon: CreditCard,
          permission: BILLING_PERMISSIONS.READ,
          prefetch: false,
        },
        {
          title: "Refund Management",
          url: "/admin/refunds",
          icon: DollarSign,
          permission: BILLING_PERMISSIONS.READ,
          prefetch: false,
        },
        {
          title: "System Monitoring",
          url: "/admin/monitoring",
          icon: Monitor,
          permission: SECURITY_PERMISSIONS.READ,
          prefetch: false,
        },
        {
          title: "Email Analytics",
          url: "/admin/email-analytics",
          icon: Mail,
          permission: SECURITY_PERMISSIONS.READ,
          prefetch: false,
        },
        {
          title: "Roles & Permissions",
          url: "/admin/roles",
          icon: Shield,
          permission: ROLE_PERMISSIONS.READ,
          prefetch: false,
        },
        {
          title: "Audit Logs",
          url: "/admin/audit-logs",
          icon: FileText,
          permission: AUDIT_PERMISSIONS.READ,
          prefetch: false,
        },
        {
          title: "Security",
          url: "/admin/security",
          icon: ShieldCheck,
          permission: SECURITY_PERMISSIONS.READ,
          prefetch: false,
        },
      ],
    },
  ];

  const navButtonClass =
    "hover:bg-sidebar-accent-foreground/5 hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent-foreground/[0.08] data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-medium";

  // Exact match, or a nested page under the item (e.g. /settings/trash).
  const isPathActive = (url: string) => {
    const path = url.split("?")[0];
    return (
      pathname === path || (path !== "/" && pathname.startsWith(`${path}/`))
    );
  };

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon as React.ElementType;
    const hasChildren = !!item.items && item.items.length > 0;
    const isChildActive =
      hasChildren && !!item.items?.some((sub) => isPathActive(sub.url));
    const isActive = hasChildren
      ? isChildActive
      : pathname === item.url.split("?")[0];

    if (item.title === "Create Workspace" && isLimitReached) {
      return (
        <SidebarMenuItem key={item.title}>
          <LockedFeatureTooltip message="Upgrade your plan to create more workspaces.">
            <SidebarMenuButton
              tooltip={"Upgrade your plan to create more workspaces."}
              isActive={false}
              className="cursor-not-allowed opacity-60 hover:bg-transparent data-[active=true]:bg-transparent"
              onClick={(event) => event.preventDefault()}
              aria-disabled="true"
            >
              {Icon && <Icon />}
              <span className="font-medium">{item.title}</span>
            </SidebarMenuButton>
          </LockedFeatureTooltip>
        </SidebarMenuItem>
      );
    }

    // Collapsed sidebar: children open in a popover beside the icon.
    if (sidebarState === "collapsed" && hasChildren) {
      return (
        <SidebarMenuItem key={item.title}>
          <Popover
            open={openDropdown === item.title}
            onOpenChange={(open) => setOpenDropdown(open ? item.title : null)}
          >
            <PopoverTrigger asChild>
              <SidebarMenuButton
                tooltip={item.title}
                className="justify-center hover:bg-sidebar-accent-foreground/5 hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent-foreground/[0.08] data-[state=open]:text-sidebar-accent-foreground"
                isActive={isActive}
              >
                {Icon && <Icon />}
                <span className="sr-only">{item.title}</span>
              </SidebarMenuButton>
            </PopoverTrigger>
            <PopoverContent side="right" align="start" className="w-48 p-2">
              <div className="mb-2 px-2 text-xs font-medium text-muted-foreground">
                {item.title}
              </div>
              <SidebarMenu>
                {item.items?.map((subItem) => (
                  <SidebarMenuItem key={subItem.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isPathActive(subItem.url)}
                      className={navButtonClass}
                    >
                      <Link
                        href={subItem.url as Route}
                        prefetch={subItem.prefetch}
                        onClick={() => setOpenDropdown(null)}
                      >
                        <span>{subItem.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </PopoverContent>
          </Popover>
        </SidebarMenuItem>
      );
    }

    // Expanded sidebar: the parent toggles an accordion. It starts open when
    // one of its pages is active, until the user toggles it.
    if (hasChildren) {
      const isOpen =
        expandedAccordion === undefined
          ? isChildActive
          : expandedAccordion === item.title;
      return (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            tooltip={item.title}
            className={`group/menu-button flex w-full items-center justify-between ${navButtonClass}`}
            isActive={isActive}
            aria-expanded={isOpen}
            onClick={(e) => {
              e.preventDefault();
              setExpandedAccordion(isOpen ? null : item.title);
            }}
          >
            <div className="flex items-center gap-2">
              {Icon && <Icon />}
              <span className="font-medium">{item.title}</span>
            </div>
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </SidebarMenuButton>

          {isOpen && (
            <SidebarMenu className="mt-1 flex flex-col gap-1">
              {item.items?.map((subItem) => (
                <SidebarMenuItem key={subItem.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isPathActive(subItem.url)}
                    className={`${navButtonClass} pl-9 transition-colors`}
                  >
                    <Link
                      href={subItem.url as Route}
                      prefetch={subItem.prefetch}
                    >
                      {subItem.title}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          )}
        </SidebarMenuItem>
      );
    }

    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          tooltip={item.title}
          asChild
          isActive={isActive}
          className={navButtonClass}
        >
          {/* prefetch passthrough: undefined = framework default (auto);
              false = skip viewport prefetch */}
          <Link
            href={item.url as Route}
            prefetch={item.prefetch}
            className="flex items-center gap-2"
          >
            {Icon && <Icon />}
            <span className="font-medium">{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const filteredMainNavigation = useFilteredNavigation(mainNavigationGroups);
  const filteredPersonalNavigation = useFilteredNavigation(
    personalNavigationGroups,
  );
  const filteredAdministratorNavigation = useFilteredNavigation(
    administratorNavigationGroups,
  );

  const displayMainNavigation = hasWorkspaces
    ? filteredMainNavigation
    : filteredMainNavigation.filter(
        (group) => group.groupLabel !== "Workspace",
      );

  return (
    <Sidebar
      collapsible="icon"
      {...props}
      style={{ "--sidebar-width-icon": "5rem" }}
    >
      <SidebarHeader className="hidden md:block">
        <WorkspaceSwitcher />
      </SidebarHeader>

      <SidebarContent className="flex flex-col overflow-y-auto scrollbar-hide py-4 gap-6">
        {/* Main navigation */}
        {displayMainNavigation.map((group) => (
          <SidebarGroup key={group.groupLabel || "main-group"}>
            {group.groupLabel && (
              <SidebarGroupLabel>{group.groupLabel}</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>{group.items.map(renderNavItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Separator between Main and Personal */}
        {displayMainNavigation.length > 0 &&
          filteredPersonalNavigation.length > 0 &&
          sidebarState === "collapsed" && <ThreeDotsSeparator />}

        {/* Personal navigation */}
        {filteredPersonalNavigation.map((group) => (
          <SidebarGroup key={group.groupLabel || "personal-group"}>
            {group.groupLabel && (
              <SidebarGroupLabel>{group.groupLabel}</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>{group.items.map(renderNavItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Separator between Personal and Admin */}
        {(filteredPersonalNavigation.length > 0 ||
          displayMainNavigation.length > 0) &&
          filteredAdministratorNavigation.length > 0 &&
          sidebarState === "collapsed" && <ThreeDotsSeparator />}

        {/* Admin navigation */}
        {filteredAdministratorNavigation.map((group) => (
          <SidebarGroup key={group.groupLabel || "admin-group"}>
            {group.groupLabel && (
              <SidebarGroupLabel>{group.groupLabel}</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon as React.ElementType;
                  const isActive = pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        tooltip={item.title}
                        asChild
                        isActive={isActive}
                        className="hover:bg-sidebar-accent-foreground/5 hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent-foreground/[0.08] data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-medium"
                      >
                        <Link href={item.url as Route} prefetch={item.prefetch}>
                          {Icon && <Icon />}
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
