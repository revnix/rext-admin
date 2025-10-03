"use client";

import {
  Bell,
  Brain,
  Database,
  FileText,
  Globe,
  LayoutDashboard,
  Library,
  Puzzle,
  Settings2,
  Share2,
  Shield,
  StickyNote,
  Upload,
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
  const { currentWorkspace } = useWorkspaceStore();

  // Generate dynamic URLs based on current workspace
  const getKnowledgeUrl = (view?: string) => {
    if (!currentWorkspace) {
      return "/workspaces"; // Fallback to workspaces list
    }
    return workspaceRoutes.knowledge(currentWorkspace.id, view);
  };

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
        {
          title: "Topics",
          url: currentWorkspace
            ? workspaceRoutes.topics(currentWorkspace.id)
            : "/workspaces",
          icon: Library,
        },
        {
          title: "Content",
          url: currentWorkspace
            ? workspaceRoutes.content(currentWorkspace.id)
            : "/workspaces",
          icon: FileText,
        },
      ],
    },
    {
      groupLabel: "Configuration",
      items: [
        {
          title: "Knowledge",
          url: getKnowledgeUrl(),
          icon: Brain,
          items: [
            {
              title: "Web URLs",
              url: getKnowledgeUrl("web"),
              icon: Globe,
            },
            {
              title: "Files",
              url: getKnowledgeUrl("files"),
              icon: Upload,
            },
            {
              title: "Text Notes",
              url: getKnowledgeUrl("text"),
              icon: StickyNote,
            },
          ],
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
        {
          title: "Users",
          url: "/users",
          icon: Users,
          anyPermission: [PERMISSIONS.USER_READ, PERMISSIONS.USER_CREATE],
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
    {
      groupLabel: "Settings",
      items: [
        {
          title: "General",
          url: "/settings/general",
          icon: Settings2,
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
