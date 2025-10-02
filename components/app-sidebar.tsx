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
import { useWorkspaceStore } from "@/stores/workspace-store";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { currentWorkspace } = useWorkspaceStore();

  // Generate dynamic URLs based on current workspace
  const getKnowledgeUrl = (view?: string) => {
    if (!currentWorkspace) {
      return "/workspaces"; // Fallback to workspaces list
    }
    const baseUrl = `/workspaces/${currentWorkspace.id}?tab=knowledge`;
    return view ? `${baseUrl}&view=${view}` : baseUrl;
  };

  const data = {
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

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
