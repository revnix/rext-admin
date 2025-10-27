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

  // Main navigation groups (top section)
  const mainNavigationGroups: NavGroup[] = [
    {
      groupLabel: "",
      items: [
        {
          title: "Dashboard",
          url: "/",
          icon: LayoutDashboard,
          // No permission required - available to all authenticated users
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
  ];

  // Personal navigation groups (sticky bottom section)
  const personalNavigationGroups: NavGroup[] = [
    {
      groupLabel: "Personal",
      items: [
        {
          title: "Account",
          url: "/settings",
          icon: User,
          // No permission required - users can view their own account
        },
        {
          title: "Subscription",
          url: "/subscription",
          icon: CreditCard,
          permission: "subscription.read", // Owner-only (workspace owner or super_admin)
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
          // No permission required - users can access their own settings
        },
      ],
    },
  ];

  // Administrator navigation groups (sticky bottom section, below Personal)
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
  const filteredPersonalNavigation = useFilteredNavigation(
    personalNavigationGroups,
  );
  const filteredAdministratorNavigation = useFilteredNavigation(
    administratorNavigationGroups,
  );

  // Filter out workspace group if no workspaces exist
  const displayMainNavigation = hasWorkspaces
    ? filteredMainNavigation
    : filteredMainNavigation.filter(
        (group) => group.groupLabel !== "Workspace",
      );

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher />
      </SidebarHeader>
      <SidebarContent className="flex flex-col">
        {/* Main navigation area - grows to fill space */}
        <div className="flex-1">
          <NavMain groups={displayMainNavigation} />
          {/* Empty workspace prompt appears after Dashboard link */}
          {!hasWorkspaces && <EmptyWorkspacePrompt />}
        </div>

        {/* Personal section - sticky to bottom with separator */}
        <div className="border-t border-sidebar-border pt-2 mt-auto">
          {/* Personal menu items */}
          <NavMain groups={filteredPersonalNavigation} />

          {/* Separator between Personal and Administrator */}
          {filteredAdministratorNavigation.length > 0 && (
            <div className="border-t border-sidebar-border my-2" />
          )}

          {/* Administrator menu items */}
          <NavMain groups={filteredAdministratorNavigation} />
        </div>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
