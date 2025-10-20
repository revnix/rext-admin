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
import { useWorkspaceStore } from "@/stores/workspace";
import type { NavGroup } from "@/types/navigation";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const workspaceList = useWorkspaceStore((state) => state.workspaceList);
  const hasWorkspaces = workspaceList.length > 0;

  const navigationGroups: NavGroup[] = [
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
          title: "Overview",
          url: currentWorkspace?.slug
            ? workspaceRoutes.overview(currentWorkspace.slug)
            : "/",
          icon: LayoutDashboard,
        },
        {
          title: "Topics",
          url: currentWorkspace?.slug
            ? workspaceRoutes.topics(currentWorkspace.slug)
            : "/",
          icon: Library,
        },
        {
          title: "Content",
          url: currentWorkspace?.slug
            ? workspaceRoutes.content(currentWorkspace.slug)
            : "/",
          icon: FileText,
        },
        {
          title: "Knowledge",
          url: currentWorkspace?.slug
            ? workspaceRoutes.knowledge(currentWorkspace.slug)
            : "/",
          icon: Brain,
        },
        {
          title: "Media",
          url: currentWorkspace?.slug
            ? workspaceRoutes.media(currentWorkspace.slug)
            : "/",
          icon: Image,
        },
        {
          title: "Users",
          url: currentWorkspace?.slug
            ? workspaceRoutes.users(currentWorkspace.slug)
            : "/",
          icon: Users,
        },
      ],
    },
    // TODO: Uncomment when integrations are ready
    // {
    //   groupLabel: "Integrations",
    //   items: [
    //     {
    //       title: "Integrations",
    //       url: "/integrations",
    //       icon: Puzzle,
    //       items: [
    //         {
    //           title: "Social Accounts",
    //           url: "/social-accounts",
    //           icon: Share2,
    //         },
    //         {
    //           title: "Notifications",
    //           url: "/notifications",
    //           icon: Bell,
    //         },
    //       ],
    //     },
    //   ],
    // },
    {
      groupLabel: "Personal",
      items: [
        {
          title: "Account",
          url: "/settings/account",
          icon: User,
        },
        {
          title: "Subscription",
          url: "/subscription",
          icon: CreditCard,
          items: [
            {
              title: "Overview",
              url: "/subscription",
            },
            {
              title: "Billing",
              url: "/billing",
            },
            {
              title: "Usage",
              url: "/usage",
            },
            {
              title: "Licenses",
              url: "/licenses",
            },
          ],
        },
        {
          title: "Settings",
          url: "/settings/general",
          icon: Settings2,
        },
      ],
    },
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
  const filteredNavigation = useFilteredNavigation(navigationGroups);

  // Filter out workspace group if no workspaces exist
  const displayNavigation = hasWorkspaces
    ? filteredNavigation
    : filteredNavigation.filter((group) => group.groupLabel !== "Workspace");

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {hasWorkspaces ? (
          <NavMain groups={displayNavigation} />
        ) : (
          <>
            <NavMain groups={displayNavigation} />
            <EmptyWorkspacePrompt />
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
