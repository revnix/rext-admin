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
  StickyNote,
  Upload,
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
              title: "Web URLs",
              url: "/knowledge/web",
              icon: Globe,
            },
            {
              title: "Files",
              url: "/knowledge/files",
              icon: Upload,
            },
            {
              title: "Text Notes",
              url: "/knowledge/text",
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
        <NavMain groups={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
