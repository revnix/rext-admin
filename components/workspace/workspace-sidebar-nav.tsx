"use client";

import {
  BarChart3,
  Brain,
  FileText,
  Globe,
  Home,
  Search,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
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
const getWorkspaceNavItems = (workspaceId: string) => [
  {
    title: "Overview",
    url: `/workspaces/${workspaceId}`,
    icon: Home,
    description: "Workspace dashboard and summary",
  },
  {
    title: "Search",
    url: `/workspaces/${workspaceId}?tab=search`,
    icon: Search,
    description: "Search across all knowledge in this workspace",
  },
  {
    title: "Knowledge",
    url: `/workspaces/${workspaceId}?tab=knowledge`,
    icon: Brain,
    description: "Manage workspace knowledge base",
    items: [
      {
        title: "All Knowledge",
        url: `/workspaces/${workspaceId}?tab=knowledge&view=all`,
        description: "View all knowledge items",
      },
      {
        title: "Web URLs",
        url: `/workspaces/${workspaceId}?tab=knowledge&view=web`,
        icon: Globe,
        description: "Scraped web content",
      },
      {
        title: "Files",
        url: `/workspaces/${workspaceId}?tab=knowledge&view=files`,
        icon: Upload,
        description: "Uploaded documents and files",
      },
      {
        title: "Text Notes",
        url: `/workspaces/${workspaceId}?tab=knowledge&view=text`,
        icon: FileText,
        description: "Direct text content entries",
      },
    ],
  },
  {
    title: "Analytics",
    url: `/workspaces/${workspaceId}?tab=overview&section=analytics`,
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
  if (!currentWorkspace || !pathname.startsWith("/workspaces/")) {
    return null;
  }

  const workspaceId = currentWorkspace.id;

  // Get search params for active state detection
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : undefined;

  const navItems = getWorkspaceNavItems(workspaceId);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{currentWorkspace.title}</SidebarGroupLabel>
      <SidebarMenu>
        {navItems.map((item) => {
          const isParentActive = isNavItemActive(
            item.url,
            pathname,
            searchParams,
          );
          const isChildActive = item.items?.some((subItem) =>
            isNavItemActive(subItem.url, pathname, searchParams),
          );
          const isActive = isParentActive || isChildActive;

          if (item.items) {
            // Render navigation item with sub-items
            return (
              <SidebarMenuItem key={item.title}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      asChild
                      isActive={isParentActive}
                      className="mb-1"
                    >
                      <Link href={item.url} aria-label={item.description}>
                        {item.icon && <item.icon className="h-4 w-4" />}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent>{item.description}</TooltipContent>
                </Tooltip>

                {/* Sub-items */}
                <SidebarMenuSub>
                  {item.items.map((subItem) => {
                    const isSubItemActive = isNavItemActive(
                      subItem.url,
                      pathname,
                      searchParams,
                    );

                    return (
                      <SidebarMenuSubItem key={subItem.title}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isSubItemActive}
                            >
                              <Link
                                href={subItem.url}
                                aria-label={subItem.description}
                              >
                                {subItem.icon && (
                                  <subItem.icon className="h-3 w-3" />
                                )}
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </TooltipTrigger>
                          <TooltipContent>{subItem.description}</TooltipContent>
                        </Tooltip>
                      </SidebarMenuSubItem>
                    );
                  })}
                </SidebarMenuSub>
              </SidebarMenuItem>
            );
          } else {
            // Render simple navigation item
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
          }
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
