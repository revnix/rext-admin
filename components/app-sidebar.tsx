"use client"

import * as React from "react"
import {
  Bot,
  Building2,
  Crown,
  Database,
  FileText,
  GalleryVerticalEnd,
  GitBranch,
  LayoutDashboard,
  Library,
  Lightbulb,
  MessageSquare,
  Puzzle,
  Settings2,
  Shield,
  Type,
  Users,
  Zap,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { ProjectSwitcher } from "@/components/project-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  projectsDropdown: [
    {
      name: "All Projects",
      logo: GalleryVerticalEnd,
      description: "View all projects",
      bgColor: "bg-slate-500",
    },
    {
      name: "Revnix",
      logo: Building2,
      description: "Software & AI Solutions",
      bgColor: "bg-blue-500",
    },
    {
      name: "Ficonz",
      logo: Type,
      description: "Font Icons Library",
      bgColor: "bg-purple-500",
    },
    {
      name: "WPAegis",
      logo: Shield,
      description: "WP Maintenance Services",
      bgColor: "bg-green-500",
    },
    {
      name: "WPGrit",
      logo: Crown,
      description: "Enterprise WP Development",
      bgColor: "bg-orange-500",
    },
  ],
  navMain: [
    {
      groupLabel: "",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: LayoutDashboard,
        }
      ],
    },
    {
      groupLabel: "Create",
      items: [
        {
          title: "Idea Builder",
          url: "/idea-builder",
          icon: Lightbulb,
        },
        {
          title: "Flows",
          url: "#",
          icon: GitBranch,
          items: [
            {
              title: "All Flows",
              url: "#",
            },
            {
              title: "Create New Flow",
              url: "#",
            },
          ],
        },
      ],
    },
    {
      groupLabel: "Library",
      items: [
        {
          title: "Ideas",
          url: "/ideas",
          icon: Library,
        },
        {
          title: "Content",
          url: "#",
          icon: FileText,
        },
      ],
    },
    {
      groupLabel: "Configuration",
      items: [
        {
          title: "Social Accounts",
          url: "/social-accounts",
          icon: Users,
        },
        {
          title: "Integrations",
          url: "/integrations",
          icon: Puzzle,
        },
        {
          title: "Models",
          url: "/models",
          icon: Bot,
        },
        {
          title: "Prompt Templates",
          url: "/prompt-templates",
          icon: MessageSquare,
        },
      ],
    },
    {
      groupLabel: "Knowledge",
      items: [
        {
          title: "Memories",
          url: "/memories",
          icon: Database,
        },
        {
          title: "Rules",
          url: "/rules",
          icon: Zap,
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
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <ProjectSwitcher projects={data.projectsDropdown} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
