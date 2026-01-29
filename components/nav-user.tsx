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
import { useEffect, useState } from "react";

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

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useAuthSession } from "@/hooks/use-auth-session";
import { useWorkspaceStore } from "@/stores/workspace";
import { useWorkspacePermissions } from "@/hooks/use-workspace-permissions";

import { apiClient } from "@/lib/api-client";
import Image from "next/image";
import { log } from "@/lib/logger";

export type ApiUser = {
  id: string;
  email: string;
  username: string;
  full_name: string;
  email_verified: boolean;
  status: string;
  avatar_url?: string;
  bio?: string;
  language?: string;
  timezone?: string;
  created_at: string;
  updated_at: string;
};

export function NavUser() {
  const router = useRouter();
  const { isMobile } = useSidebar();

  const { user, isAuthenticated, isLoading, logout } = useAuthSession();

  const [profileUser, setProfileUser] = useState<ApiUser | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // ----------------------------------
  // Fetch API user once
  // ----------------------------------
  useEffect(() => {
    let mounted = true;

    async function fetchUser() {
      try {
        const res = await apiClient.profile.get();
        if (mounted) {
          setProfileUser(res);
        }
      } catch (err) {
        log.error("Profile fetch failed:", err);
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    }

    fetchUser();
    return () => {
      mounted = false;
    };
  }, []);

  // Workspace permissions
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const { role: fetchedWorkspaceRole } = useWorkspacePermissions(
    currentWorkspace?.id,
  );

  // Helper
  const getInitials = (name?: string) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "?";

  const getRoleDisplayName = (role?: string) => {
    const map: Record<string, string> = {
      super_admin: "Super Admin",
      workspace_owner: "Workspace Owner",
      workspace_admin: "Workspace Admin",
      admin: "Admin",
      manager: "Manager",
      developer: "Developer",
      editor: "Editor",
      viewer: "Viewer",
      user: "User",
      guest: "Guest",
      owner: "Owner",
    };
    if (!role) return "";
    return (
      map[role] ??
      role.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    );
  };

  // Loading
  if (isLoading || loadingProfile) {
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

  // Not logged in
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

  // Extract user data from API or fallback to auth user
  const userName = profileUser?.full_name || user.name || "User";
  const userEmail = profileUser?.email || user.email || "";
  const userInitials = getInitials(userName);

  const effectiveRoleKey = fetchedWorkspaceRole || user.role;
  const userRole = getRoleDisplayName(effectiveRoleKey);

  const baseUrl =
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://127.0.0.1:2024";

  // Helper to get full avatar URL
  const getAvatarUrl = (avatarUrl?: string) => {
    if (!avatarUrl) return null;
    // If already absolute URL (http:// or https://), return as-is
    if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
      return avatarUrl;
    }
    // Otherwise prepend base URL for relative paths
    return `${baseUrl}${avatarUrl}`;
  };

  // ----------------------------------
  // UI
  // ----------------------------------
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg overflow-hidden relative">
                {profileUser?.avatar_url ? (
                  <Image
                    src={getAvatarUrl(profileUser.avatar_url) || ""}
                    alt="User avatar"
                    fill
                    className="object-cover"
                    sizes="32px"
                  />
                ) : (
                  <AvatarFallback className="rounded-lg">
                    {userInitials}
                  </AvatarFallback>
                )}
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

                    <TooltipContent side="right">
                      This is your current role
                      {currentWorkspace?.name && ` in ${currentWorkspace.name}`}
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
                <Avatar className="h-8 w-8 rounded-lg overflow-hidden relative">
                  {profileUser?.avatar_url ? (
                    <Image
                      src={getAvatarUrl(profileUser.avatar_url) || ""}
                      alt="User avatar"
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  ) : (
                    <AvatarFallback className="rounded-lg">
                      {userInitials}
                    </AvatarFallback>
                  )}
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
                      <TooltipContent side="right">
                        This is your current role
                        {currentWorkspace?.name &&
                          ` in ${currentWorkspace.name}`}
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

            <DropdownMenuItem onClick={logout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
