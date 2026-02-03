"use client";

import {
  CreditCard,
  FileText,
  Plug,
  LayoutDashboard,
  Mail,
  Monitor,
  Plus,
  Shield,
  User,
  UserCog,
  Users,
  VenetianMask,
  ChevronDown,
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
import { PERMISSIONS, ROLES } from "@/lib/permissions";
import { workspaceRoutes } from "@/lib/routes";
import { usePermissionStore } from "@/stores/permission-store";
import { useWorkspaceStore } from "@/stores/workspace";
import type { NavGroup } from "@/types/navigation";
import { useWorkspacePermissions } from "@/hooks/use-workspace-permissions";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSidebar } from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";

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
  const { workspacePermissions } = usePermissionStore();
  const storeRole = currentWorkspace
    ? (workspacePermissions.get(currentWorkspace.id)?.role ??
      workspacePermissions.get(currentWorkspace.slug)?.role)
    : undefined;
  const { role: fetchedRole } = useWorkspacePermissions(currentWorkspace?.id);
  const activeRole = fetchedRole || storeRole;

  const { state: sidebarState } = useSidebar();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(
    null,
  );

  // Main navigation groups
  const mainNavigationGroups: NavGroup[] = [
    {
      groupLabel: "",
      items: [{ title: "Dashboard", url: "/", icon: LayoutDashboard }],
    },
    {
      groupLabel: "Workspace",
      items: [
        {
          title: "Generate Content",
          url: currentWorkspace?.slug
            ? workspaceRoutes.generate_content(currentWorkspace.slug)
            : "/",
          icon: FileText, // Or Sparkles if better suited, keeping FileText for now as seemingly standard
          permission: "content.read",
        },
        {
          title: "Content Library",
          url: currentWorkspace?.slug
            ? workspaceRoutes.content(currentWorkspace.slug)
            : "/",
          icon: FileText,
          permission: "content.read",
        },
        {
          title: "Persona",
          url: currentWorkspace?.slug
            ? workspaceRoutes.personas(currentWorkspace.slug)
            : "/",
          icon: VenetianMask,
          permission: "content.read",
        },
        {
          title: "Brand Voice",
          url: currentWorkspace?.slug
            ? workspaceRoutes.brand_voice(currentWorkspace.slug)
            : "/",
          icon: VenetianMask,
          permission: "content.read",
        },
        {
          title: "Members",
          url: currentWorkspace?.slug
            ? workspaceRoutes.members(currentWorkspace.slug)
            : "/",
          icon: Users,
          permission: "member.read",
        },
        {
          title: "Integrations",
          url: currentWorkspace?.slug
            ? workspaceRoutes.integrations(currentWorkspace.slug)
            : "/",
          icon: Plug,
          permission: "workspace.update",
        },
      ].filter((item) => item.title !== "Members" || activeRole !== "viewer"),
    },
  ];

  if (!hasWorkspaces) {
    mainNavigationGroups[0].items.push({
      title: "Create Workspace",
      url: "/w/create",
      icon: Plus,
    });
  }

  // Personal navigation groups
  const personalNavigationGroups: NavGroup[] = [
    {
      groupLabel: "Personal",
      items: [
        { title: "Account", url: "/settings", icon: User },
        {
          title: "Subscription",
          url: "/subscription",
          icon: CreditCard,
          items: [
            { title: "Overview", url: "/subscription" },
            { title: "Billing", url: "/billing" },
            { title: "Usage", url: "/usage" },
            { title: "Licenses", url: "/licenses" },
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
      anyRole: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
      items: [
        { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
        {
          title: "User Management",
          url: "/admin/users",
          icon: UserCog,
          permission: PERMISSIONS.USER_READ,
        },
        {
          title: "Subscriptions",
          url: "/admin/subscriptions",
          icon: CreditCard,
          anyPermission: ["subscription.analytics", "subscription.read"],
        },
        {
          title: "System Monitoring",
          url: "/admin/monitoring",
          icon: Monitor,
          permission: "system.manage",
        },
        {
          title: "Email Analytics",
          url: "/admin/email-analytics",
          icon: Mail,
          anyPermission: ["system.manage", "audit.read"],
        },
        {
          title: "Roles & Permissions",
          url: "/admin/roles",
          icon: Shield,
          anyPermission: [PERMISSIONS.ROLE_READ, PERMISSIONS.PERMISSION_READ],
        },
      ],
    },
  ];

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

  const { isMobile } = useSidebar();

  return (
    <Sidebar
      collapsible="icon"
      {...props}
      style={{ "--sidebar-width-icon": "5rem" } as React.CSSProperties}
    >
      {/* Hide WorkspaceSwitcher on mobile - it's rendered in the page header instead */}
      {!isMobile && (
        <SidebarHeader>
          <WorkspaceSwitcher />
        </SidebarHeader>
      )}

      <SidebarContent className="flex flex-col overflow-y-auto scrollbar-hide py-4 gap-6">
        {/* Main navigation */}
        {displayMainNavigation.map((group) => (
          <SidebarGroup key={group.groupLabel || "main-group"}>
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
                        isActive={isActive}
                        asChild
                        className="hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-700)] dark:hover:bg-[var(--color-brand-900)]/50 dark:hover:text-[var(--color-brand-100)] data-[active=true]:bg-[var(--color-brand-50)] data-[active=true]:text-[var(--color-brand-700)] dark:data-[active=true]:bg-[var(--color-brand-900)]/50 dark:data-[active=true]:text-[var(--color-brand-100)]"
                      >
                        <Link href={item.url}>
                          {Icon && <Icon />}
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
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
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon as React.ElementType;
                  const hasChildren = item.items && item.items.length > 0;
                  const isActive =
                    pathname === item.url ||
                    (hasChildren &&
                      item.items?.some((sub) => pathname === sub.url));

                  //  Fixed Collapsed Sidebar Popover
                  if (sidebarState === "collapsed" && hasChildren) {
                    return (
                      <SidebarMenuItem key={item.title}>
                        <Popover
                          open={openDropdown === item.title}
                          onOpenChange={(open) =>
                            setOpenDropdown(open ? item.title : null)
                          }
                        >
                          <PopoverTrigger asChild>
                            <SidebarMenuButton
                              tooltip={item.title}
                              className="justify-center hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-700)] dark:hover:bg-[var(--color-brand-900)]/50 dark:hover:text-[var(--color-brand-100)] data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                              isActive={isActive}
                            >
                              {Icon && <Icon />}
                              <span className="sr-only">{item.title}</span>
                            </SidebarMenuButton>
                          </PopoverTrigger>

                          {/* Dropdown Popover */}
                          <PopoverContent
                            side="right"
                            align="start"
                            className="w-48 p-2"
                          >
                            <div className="mb-2 px-2 text-xs font-medium text-muted-foreground">
                              {item.title}
                            </div>
                            <SidebarMenu>
                              {item.items?.map((subItem) => (
                                <SidebarMenuItem key={subItem.title}>
                                  <SidebarMenuButton
                                    asChild
                                    isActive={pathname === subItem.url}
                                    className="hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-700)] dark:hover:bg-[var(--color-brand-900)]/50 dark:hover:text-[var(--color-brand-100)] data-[active=true]:bg-[var(--color-brand-50)] data-[active=true]:text-[var(--color-brand-700)] dark:data-[active=true]:bg-[var(--color-brand-900)]/50 dark:data-[active=true]:text-[var(--color-brand-100)]"
                                  >
                                    <Link href={subItem.url}>
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

                  // Expanded Sidebar → Accordion
                  // If has children, we make the parent a TOGGLE, not a link.
                  // This assumes the "Overview" link exists as the first child if navigation is needed.
                  if (hasChildren) {
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          tooltip={item.title}
                          className="group/menu-button flex w-full items-center justify-between hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-700)] dark:hover:bg-[var(--color-brand-900)]/50 dark:hover:text-[var(--color-brand-100)] data-[active=true]:bg-[var(--color-brand-50)] data-[active=true]:text-[var(--color-brand-700)] dark:data-[active=true]:bg-[var(--color-brand-900)]/50 dark:data-[active=true]:text-[var(--color-brand-100)]"
                          isActive={isActive}
                          onClick={(e) => {
                            e.preventDefault();
                            setExpandedAccordion(
                              expandedAccordion === item.title
                                ? null
                                : item.title,
                            );
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {Icon && <Icon />}
                            <span>{item.title}</span>
                          </div>
                          <ChevronDown
                            size={16}
                            className={`transition-transform duration-200 ${
                              expandedAccordion === item.title
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </SidebarMenuButton>

                        {expandedAccordion === item.title && (
                          <SidebarMenu className="mt-1 flex flex-col gap-1">
                            {item.items?.map((subItem) => (
                              <SidebarMenuItem key={subItem.title}>
                                <SidebarMenuButton
                                  asChild
                                  isActive={pathname === subItem.url}
                                  className="hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-700)] dark:hover:bg-[var(--color-brand-900)]/50 dark:hover:text-[var(--color-brand-100)] data-[active=true]:bg-[var(--color-brand-50)] data-[active=true]:text-[var(--color-brand-700)] dark:data-[active=true]:bg-[var(--color-brand-900)]/50 dark:data-[active=true]:text-[var(--color-brand-100)] pl-9 transition-colors"
                                >
                                  <Link href={subItem.url}>
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

                  // Standard Item (No Children)
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        tooltip={item.title}
                        asChild
                        isActive={isActive}
                        className="hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-700)] dark:hover:bg-[var(--color-brand-900)]/50 dark:hover:text-[var(--color-brand-100)] data-[active=true]:bg-[var(--color-brand-50)] data-[active=true]:text-[var(--color-brand-700)] dark:data-[active=true]:bg-[var(--color-brand-900)]/50 dark:data-[active=true]:text-[var(--color-brand-100)]"
                      >
                        <Link
                          href={item.url}
                          className="flex items-center gap-2"
                        >
                          {Icon && <Icon />}
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
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
                        className="hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-700)] dark:hover:bg-[var(--color-brand-900)]/50 dark:hover:text-[var(--color-brand-100)] data-[active=true]:bg-[var(--color-brand-50)] data-[active=true]:text-[var(--color-brand-700)] dark:data-[active=true]:bg-[var(--color-brand-900)]/50 dark:data-[active=true]:text-[var(--color-brand-100)]"
                      >
                        <Link href={item.url}>
                          {Icon && <Icon />}
                          <span>{item.title}</span>
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
