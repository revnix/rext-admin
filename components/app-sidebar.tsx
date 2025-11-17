"use client";

import {
  Brain,
  CreditCard,
  FileText,
  Image,
  LayoutDashboard,
  Library,
  Mail,
  Monitor,
  Settings2,
  Shield,
  User,
  UserCog,
  Users,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import type * as React from "react";
import { useState } from "react";

import { EmptyWorkspacePrompt } from "@/components/empty-workspace-prompt";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const workspaceList = useWorkspaceStore((state) => state.workspaceList);
  const hasWorkspaces = workspaceList.length > 0;
  const { workspacePermissions } = usePermissionStore();
  const storeRole = currentWorkspace
    ? workspacePermissions.get(currentWorkspace.id)?.role ??
      workspacePermissions.get(currentWorkspace.slug)?.role
    : undefined;
  const { role: fetchedRole } = useWorkspacePermissions(currentWorkspace?.id);
  const activeRole = fetchedRole || storeRole;

  const { state: sidebarState } = useSidebar();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(
    null
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
          title: "Topics",
          url: currentWorkspace?.slug
            ? workspaceRoutes.topics(currentWorkspace.slug)
            : "/",
          icon: Library,
          permission: "topic.read",
        },
        {
          title: "Content",
          url: currentWorkspace?.slug
            ? workspaceRoutes.content(currentWorkspace.slug)
            : "/",
          icon: FileText,
          permission: "content.read",
        },
        {
          title: "Knowledge",
          url: currentWorkspace?.slug
            ? workspaceRoutes.knowledge(currentWorkspace.slug)
            : "/",
          icon: Brain,
          permission: "knowledge.read",
        },
        {
          title: "Media",
          url: currentWorkspace?.slug
            ? workspaceRoutes.media(currentWorkspace.slug)
            : "/",
          icon: Image,
          permission: "media.read",
        },
        {
          title: "Members",
          url: currentWorkspace?.slug
            ? workspaceRoutes.members(currentWorkspace.slug)
            : "/",
          icon: Users,
          permission: "member.read",
        },
      ].filter((item) => item.title !== "Members" || activeRole !== "viewer"),
    },
  ];

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
        { title: "Settings", url: "/settings", icon: Settings2 },
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
    personalNavigationGroups
  );
  const filteredAdministratorNavigation = useFilteredNavigation(
    administratorNavigationGroups
  );

  const displayMainNavigation = hasWorkspaces
    ? filteredMainNavigation
    : filteredMainNavigation.filter(
        (group) => group.groupLabel !== "Workspace"
      );

  return (
    <Sidebar
      collapsible="icon"
      {...props}
      style={{ "--sidebar-width-icon": "4rem" } as React.CSSProperties}
    >
      <SidebarHeader>
        <WorkspaceSwitcher />
      </SidebarHeader>

      <SidebarContent className="flex flex-col overflow-y-auto scrollbar-hide">
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
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton tooltip={item.title} asChild>
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

        {!hasWorkspaces && <EmptyWorkspacePrompt />}

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

                  //  Fixed Collapsed Sidebar Popover
                  if (sidebarState === "collapsed" && hasChildren) {
                    return (
                      <SidebarMenuItem
                        key={item.title}
                        className="relative flex items-center"
                      >
                        <Popover
                          open={openDropdown === item.title}
                          onOpenChange={(open) =>
                            setOpenDropdown(open ? item.title : null)
                          }
                        >
                          <div className="flex items-center ml-[16px]">
                            {/* Left side: navigates to main subscription page */}
                            <SidebarMenuButton
                              asChild
                              tooltip={item.title}
                              className="flex items-center flex-1"
                            >
                              <Link href={item.url}>
                                {Icon && <Icon className="shrink-0 pr-0.5" />}
                                <span className="truncate">{item.title}</span>
                              </Link>
                            </SidebarMenuButton>

                            {/* Right side: chevron toggles dropdown */}
                            <PopoverTrigger asChild>
                              <button
                                type="submit"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setOpenDropdown(
                                    openDropdown === item.title
                                      ? null
                                      : item.title
                                  );
                                }}
                                className="rounded-md hover:bg-sidebar-accent transition  hover:cursor-pointer"
                              >
                                <ChevronRight
                                  size={16}
                                  className={`transition-transform ${
                                    openDropdown === item.title
                                      ? "rotate-90"
                                      : ""
                                  }`}
                                />
                              </button>
                            </PopoverTrigger>
                          </div>

                          {/* Dropdown Popover */}
                          <PopoverContent
                            side="right"
                            align="start"
                            className="w-40 bg-gray-100 dark:bg-gray-800 border border-sidebar-border dark:border-gray-700 rounded-md shadow-md"
                          >
                            <SidebarMenu>
                              {item.items?.map((subItem) => (
                                <SidebarMenuItem
                                  key={subItem.title}
                                  className="rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 transition"
                                >
                                  <SidebarMenuButton
                                    asChild
                                    className="rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 transition"
                                  >
                                    <Link href={subItem.url}>
                                      {subItem.title}
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
                  return (
                    <SidebarMenuItem
                      key={item.title}
                      className="relative flex flex-col"
                    >
                      <div className="flex items-center justify-between">
                        {/* Clicking the text navigates directly */}
                        <SidebarMenuButton tooltip={item.title} asChild>
                          <Link
                            href={item.url}
                            className="flex items-center gap-2"
                          >
                            {Icon && <Icon />}
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>

                        {/* Clicking the chevron toggles the accordion only */}
                        {hasChildren && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation(); // prevent link click
                              setExpandedAccordion(
                                expandedAccordion === item.title
                                  ? null
                                  : item.title
                              );
                            }}
                            className="p-1 ml-auto"
                          >
                            <ChevronDown
                              size={16}
                              className={`transition-transform hover:cursor-pointer ${
                                expandedAccordion === item.title
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </button>
                        )}
                      </div>

                      {hasChildren && expandedAccordion === item.title && (
                        <SidebarMenu className="pl-7 ml-1 mt-1 flex flex-col gap-1 border-l border-sidebar-border my-2">
                          {item.items?.map((subItem) => (
                            <SidebarMenuItem key={subItem.title}>
                              <SidebarMenuButton asChild>
                                <Link href={subItem.url}>{subItem.title}</Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </SidebarMenu>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Admin navigation */}
        {filteredAdministratorNavigation.length > 0 && (
          <div className="border-t border-sidebar-border my-2" />
        )}
        {filteredAdministratorNavigation.map((group) => (
          <SidebarGroup key={group.groupLabel || "admin-group"}>
            {group.groupLabel && (
              <SidebarGroupLabel>{group.groupLabel}</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon as React.ElementType;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton tooltip={item.title} asChild>
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

      <SidebarFooter className="border-t border-sidebar-border">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
