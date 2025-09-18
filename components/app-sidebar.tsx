"use client";

import {
  Bell,
  BotMessageSquare,
  Brain,
  Database,
  FileText,
  LayoutDashboard,
  Library,
  Puzzle,
  Settings2,
  Share2,
  Users,
  Workflow,
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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

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
          title: "Topics",
          url: "/topics",
          icon: Library,
        },
        {
          title: "Flows",
          url: "/flows",
          icon: Workflow,
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
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="bg-blue-500 text-white flex aspect-square size-8 items-center justify-center rounded-lg">
                <BotMessageSquare className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">WREXT</span>
                <span className="truncate text-xs">AI Content Studio</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
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
