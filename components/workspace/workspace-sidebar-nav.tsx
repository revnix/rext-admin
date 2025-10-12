"use client";

import { BarChart3, Brain, FileText, Home, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCurrentWorkspace } from "@/stores/workspace-store";

/**
 * Workspace-specific navigation items
 */
const getWorkspaceNavItems = (workspaceSlug: string) => [
  {
    title: "Overview",
    url: `/w/${workspaceSlug}/overview`,
    icon: Home,
    description: "Workspace dashboard and summary",
  },
  {
    title: "Topics",
    url: `/w/${workspaceSlug}/topics`,
    icon: FileText,
    description: "Manage topics for content generation",
  },
  {
    title: "Content",
    url: `/w/${workspaceSlug}/content`,
    icon: FileText,
    description: "View and manage generated content",
  },
  {
    title: "Knowledge",
    url: `/w/${workspaceSlug}/knowledge`,
    icon: Brain,
    description: "Manage workspace knowledge base",
  },
  {
    title: "Users",
    url: `/w/${workspaceSlug}/users`,
    icon: Users,
    description: "Manage workspace team members",
  },
  {
    title: "Analytics",
    url: `/w/${workspaceSlug}/analytics`,
    icon: BarChart3,
    description: "Content statistics and insights",
  },
];

/**
 * Check if a navigation item is currently active based on pathname and search params
 */
function isNavItemActive(
  itemUrl: string,
  pathname: string,
  searchParams?: URLSearchParams,
): boolean {
  const url = new URL(itemUrl, window.location.origin);
  const itemPath = url.pathname;
  const itemParams = url.searchParams;

  // Check if pathname matches
  if (pathname !== itemPath) {
    return false;
  }

  // If no search params in item URL, just check pathname
  if (itemParams.toString() === "") {
    return (
      pathname === itemPath && (!searchParams || searchParams.toString() === "")
    );
  }

  // Check if all item search params match current search params
  if (!searchParams) {
    return false;
  }

  for (const [key, value] of itemParams.entries()) {
    if (searchParams.get(key) !== value) {
      return false;
    }
  }

  return true;
}

/**
 * WorkspaceSidebarNav component
 *
 * Renders workspace-specific navigation items when in a workspace context.
 * Provides quick access to key workspace features and sub-sections.
 *
 * Features:
 * - Dynamic navigation based on current workspace
 * - Active state detection for current page/tab
 * - Hierarchical navigation with sub-items
 * - Responsive design with proper ARIA labels
 * - Keyboard navigation support
 */
export function WorkspaceSidebarNav() {
  const currentWorkspace = useCurrentWorkspace();
  const pathname = usePathname();

  // Only render if we have a current workspace and we're on a workspace-related page
  if (!currentWorkspace || !pathname.startsWith("/w/")) {
    return null;
  }

  const workspaceSlug = currentWorkspace.slug;

  // Get search params for active state detection
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : undefined;

  const navItems = getWorkspaceNavItems(workspaceSlug);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{currentWorkspace.title}</SidebarGroupLabel>
      <SidebarMenu>
        {navItems.map((item) => {
          const isActive = isNavItemActive(item.url, pathname, searchParams);

          return (
            <SidebarMenuItem key={item.title}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <Link href={item.url} aria-label={item.description}>
                      {item.icon && <item.icon className="h-4 w-4" />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent>{item.description}</TooltipContent>
              </Tooltip>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
