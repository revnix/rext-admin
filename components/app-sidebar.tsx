"use client";

import {
  Bell,
  Brain,
  Database,
  FileText,
  LayoutDashboard,
  Library,
  Puzzle,
  Settings2,
  Share2,
  Users,
  Zap,
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
import { WorkspaceSidebarNav } from "@/components/workspace/workspace-sidebar-nav";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";

// This is sample data.
const data = {
  user: {
    name: "Mobeen A.",
    email: "mobeen@wrext.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
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
        },
        {
          title: "Topics",
          url: "/topics",
          icon: Library,
        },
        {
          title: "Content",
          url: "/content",
          icon: FileText,
        },
      ],
    },
    {
      groupLabel: "Configuration",
      items: [
        {
          title: "Knowledge",
          url: "/knowledge",
          icon: Brain,
          items: [
            {
              title: "Rules",
              url: "/rules",
              icon: Zap,
            },
            {
              title: "Memories",
              url: "/memories",
              icon: Database,
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
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <WorkspaceSidebarNav />
        <NavMain groups={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
