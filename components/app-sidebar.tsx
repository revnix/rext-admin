"use client";

import {
  Bell,
  Brain,
  ChartBar as ChartBarIcon,
  Database,
  FileText,
  LayoutDashboard,
  Library,
  Puzzle,
  Settings2,
  Share2,
  Shield,
  User,
  UserCog,
  Users,
} from "lucide-react";
import type * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { useFilteredNavigation } from "@/hooks/use-filtered-navigation";
import { PERMISSIONS, ROLES } from "@/lib/permissions";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { NavGroup } from "@/types/navigation";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);

  const navigationGroups: NavGroup[] = [
    {
      groupLabel: "",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      groupLabel: "Workspace",
      items: [
        {
          title: "Overview",
          url: currentWorkspace?.slug
            ? `/w/${currentWorkspace.slug}/overview`
            : "/workspaces",
          icon: LayoutDashboard,
        },
        {
          title: "Topics",
          url: currentWorkspace?.slug
            ? workspaceRoutes.topics(currentWorkspace.slug)
            : "/workspaces",
          icon: Library,
        },
        {
          title: "Content",
          url: currentWorkspace?.slug
            ? workspaceRoutes.content(currentWorkspace.slug)
            : "/workspaces",
          icon: FileText,
        },
        {
          title: "Users",
          url: currentWorkspace?.slug
            ? workspaceRoutes.users(currentWorkspace.slug)
            : "/workspaces",
          icon: Users,
          anyPermission: [PERMISSIONS.USER_READ],
        },
        {
          title: "Analytics",
          url: currentWorkspace?.slug
            ? workspaceRoutes.analytics(currentWorkspace.slug)
            : "/workspaces",
          icon: ChartBarIcon,
        },
      ],
    },
    {
      groupLabel: "Knowledge",
      items: [
        {
          title: "Knowledge",
          url: currentWorkspace?.slug
            ? `/w/${currentWorkspace.slug}/knowledge`
            : "/workspaces",
          icon: Brain,
        },
        {
          title: "Integrations",
          url: "/integrations",
          icon: Puzzle,
          items: [
            {
              title: "Social Accounts",
              url: "/social-accounts",
              icon: Share2,
            },
            {
              title: "Notifications",
              url: "/notifications",
              icon: Bell,
            },
          ],
        },
      ],
    },
    {
      groupLabel: "Manage",
      items: [
        {
          title: "Workspaces",
          url: "/workspaces",
          icon: Database,
          anyPermission: [
            PERMISSIONS.WORKSPACE_READ,
            PERMISSIONS.WORKSPACE_CREATE,
          ],
        },
      ],
    },
    {
      groupLabel: "Personal",
      items: [
        {
          title: "Settings",
          url: "/settings/general",
          icon: Settings2,
        },
        {
          title: "Profile",
          url: "/profile",
          icon: User,
        },
      ],
    },
    {
      groupLabel: "Administration",
      anyRole: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
      items: [
        {
          title: "User Management",
          url: "/admin/users",
          icon: UserCog,
          permission: PERMISSIONS.USER_READ,
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
  const filteredNavigation = useFilteredNavigation(navigationGroups);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={filteredNavigation} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
