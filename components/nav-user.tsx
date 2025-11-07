"use client";

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuthSession } from "@/hooks/use-auth-session";
import { usePermissionStore } from "@/stores/permission-store";
import { useWorkspaceStore } from "@/stores/workspace";
import { useWorkspacePermissions } from "@/hooks/use-workspace-permissions";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { user, isAuthenticated, isLoading, logout } = useAuthSession();
  const router = useRouter();

  // Workspace role sources (hooks must be at top level)
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const workspacePermissionsMap = usePermissionStore(
    (state) => state.workspacePermissions,
  );
  const { role: fetchedWorkspaceRole } = useWorkspacePermissions(
    currentWorkspace?.id,
  );

  // Generate initials from user name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    await logout(); // logout already handles redirect in useAuthSession
  };

  // Friendly display for role keys (read-only)
  const getRoleDisplayName = (role?: string) => {
    if (!role) return "";
    const map: Record<string, string> = {
      super_admin: "Super Admin",
      admin: "Admin",
      manager: "Manager",
      developer: "Developer",
      editor: "Editor",
      viewer: "Viewer",
      user: "User",
      guest: "Guest",
      owner: "Owner",
    };
    if (map[role]) return map[role];
    return role.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Show loading state
  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg">...</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Loading...</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" onClick={() => router.push("/login")}>
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg">?</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Not logged in</span>
              <span className="truncate text-xs">Click to login</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const userName = user.name;
  const userEmail = user.email;
  const userInitials = getInitials(userName);
  // Prefer workspace-scoped role if available, else fall back to global session role
  const workspaceRoleRaw = currentWorkspace
    ? workspacePermissionsMap.get(currentWorkspace.id)?.role
    : undefined;
  // Ensure workspace permissions are fetched even if provider isn't mounted
  const effectiveWorkspaceRole = fetchedWorkspaceRole || workspaceRoleRaw;
  const userRole = getRoleDisplayName(effectiveWorkspaceRole || user.role);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{userName}</span>
                <span className="truncate text-xs">{userEmail}</span>
                {userRole && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="truncate text-[10px] text-muted-foreground cursor-help">
                        {userRole}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      This is your current role
                      {currentWorkspace?.name
                        ? ` in ${currentWorkspace.name}`
                        : ""}
                      .
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{userName}</span>
                  <span className="truncate text-xs">{userEmail}</span>
                  {userRole && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="truncate text-[10px] text-muted-foreground cursor-help">
                          {userRole}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        This is your current role
                        {currentWorkspace?.name
                          ? ` in ${currentWorkspace.name}`
                          : ""}
                        . It determines what you can do here.
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => router.push("/settings/subscription")}
              >
                <Sparkles />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/settings/billing")}
              >
                <CreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/settings/security")}
              >
                <Bell />
                Security
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
