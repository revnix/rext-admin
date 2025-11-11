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
} from "lucide-react";
import type * as React from "react";

import { EmptyWorkspacePrompt } from "@/components/empty-workspace-prompt";
// import { NavMain } from "@/components/nav-main";
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const workspaceList = useWorkspaceStore((state) => state.workspaceList);
  const hasWorkspaces = workspaceList.length > 0;
  const { workspacePermissions } = usePermissionStore();
  const storeRole = currentWorkspace
    ? (workspacePermissions.get(currentWorkspace.id)?.role ??
        workspacePermissions.get(currentWorkspace.slug)?.role)
    : undefined;
  // Also fetch directly to avoid timing/key mismatches
  const { role: fetchedRole } = useWorkspacePermissions(currentWorkspace?.id);
  const activeRole = fetchedRole || storeRole;

  // Main navigation groups (top section)
  const mainNavigationGroups: NavGroup[] = [
    {
      groupLabel: "",
      items: [
        {
          title: "Dashboard",
          url: "/",
          icon: LayoutDashboard,
        },
      ],
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
        {
          title: "Account",
          url: "/settings",
          icon: User,
        },
        {
          title: "Subscription",
          url: "/subscription",
          icon: CreditCard,
          permission: "subscription.read",
          items: [
            {
              title: "Overview",
              url: "/subscription",
              permission: "subscription.read",
            },
            {
              title: "Billing",
              url: "/billing",
              permission: "billing.read",
            },
            {
              title: "Usage",
              url: "/usage",
              permission: "usage.read",
            },
            {
              title: "Licenses",
              url: "/licenses",
              permission: "license.read",
            },
          ],
        },
        {
          title: "Settings",
          url: "/settings",
          icon: Settings2,
        },
      ],
    },
  ];

  // Administrator navigation groups
  const administratorNavigationGroups: NavGroup[] = [
    {
      groupLabel: "Administration",
      anyRole: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
      items: [
        {
          title: "Dashboard",
          url: "/admin",
          icon: LayoutDashboard,
        },
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

  // Filter navigation based on user permissions
  const filteredMainNavigation = useFilteredNavigation(mainNavigationGroups);
  const filteredPersonalNavigation = useFilteredNavigation(personalNavigationGroups);
  const filteredAdministratorNavigation = useFilteredNavigation(administratorNavigationGroups);

  // Filter out workspace group if no workspaces exist
  const displayMainNavigation = hasWorkspaces
    ? filteredMainNavigation
    : filteredMainNavigation.filter((group) => group.groupLabel !== "Workspace");

  return (
    <Sidebar
      collapsible="icon"
      {...props}
      style={
        {
          "--sidebar-width-icon": "4rem",
        } as React.CSSProperties
      }
    >
      <SidebarHeader>
        <WorkspaceSwitcher />
      </SidebarHeader>

      <SidebarContent className="flex flex-col overflow-y-auto scrollbar-hide ">
        {/* ✅ NEW: Grouped main navigation with group labels */}
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
                        <a href={item.url}>
                          {Icon && <Icon />}
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {!hasWorkspaces && <EmptyWorkspacePrompt />}

        {/* ✅ NEW: Grouped personal + admin sections with group labels */}
        <div className="border-t border-sidebar-border pt-2 mt-auto">
          {filteredPersonalNavigation.map((group) => (
            <SidebarGroup key={group.groupLabel || "personal-group"}>
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
                          <a href={item.url}>
                            {Icon && <Icon />}
                            <span>{item.title}</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}

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
                          <a href={item.url}>
                            {Icon && <Icon />}
                            <span>{item.title}</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </div>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
