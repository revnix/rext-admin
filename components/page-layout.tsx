"use client";

import {
  Bell,
  Mail,
  Settings,
  CircleHelp,
  Search,
  User,
  CreditCard,
  LogOut,
  Book,
  LifeBuoy,
  Keyboard,
  Sparkles,
  BadgeCheck,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AppSidebar } from "@/components/app-sidebar";
import { ImpersonationBanner } from "@/components/impersonation/impersonation-banner";
// import { QuickAddDropdown } from "@/components/quick-add-dropdown"; // Removed
import { SearchDialog } from "@/components/search-dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { CircleFlag } from "react-circle-flags";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNotificationStore } from "@/stores/notification-store";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useWorkspaceStore } from "@/stores/workspace";
import { useWorkspacePermissions } from "@/hooks/use-workspace-permissions";
import { apiClient } from "@/lib/api-client";
import { log } from "@/lib/logger";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

import { PageHeader } from "@/components/page-header";

interface BreadcrumbItemData {
  label: string;
  href?: string;
}

interface PageLayoutProps {
  title: string;
  hideTitle?: boolean;
  description?: string;
  breadcrumbs?: BreadcrumbItemData[];
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
}

// Redefine ApiUser locally to ensure safety if not exported
type ApiUser = {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  display_name: string;
  email_verified: boolean;
  status: string;
  avatar_url?: string;
  bio?: string;
  language?: string;
  timezone?: string;
  created_at: string;
  updated_at: string;
};

export function PageLayout({
  title,
  hideTitle = false,
  description,
  breadcrumbs: _breadcrumbs = [],
  actions,
  children,
  className = "",
  fullWidth = false,
}: PageLayoutProps) {
  // const [notificationsOpen, setNotificationsOpen] = useState(false); // Removed
  const [searchOpen, setSearchOpen] = useState(false);
  const unreadNotifications = useNotificationStore(
    (state) => state.unreadCount,
  );

  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthSession();
  const [profileUser, setProfileUser] = useState<ApiUser | null>(null);

  // Workspace permissions
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const { role: fetchedWorkspaceRole } = useWorkspacePermissions(
    currentWorkspace?.id,
  );

  const hasUnread = unreadNotifications > 0;

  // Fetch API user once
  useEffect(() => {
    let mounted = true;

    async function fetchUser() {
      // Only fetch if authenticated
      if (!isAuthenticated) return;
      try {
        const res = await apiClient.profile.get();
        if (mounted) {
          setProfileUser(res);
        }
      } catch (err) {
        log.error("Profile fetch failed:", err);
      }
    }

    fetchUser();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

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

  // User data
  const userName = profileUser?.display_name || user?.name || "User";
  const userEmail = profileUser?.email || user?.email || "";
  const userInitials = getInitials(userName);
  const effectiveRoleKey = fetchedWorkspaceRole || user?.role;
  const userRole = getRoleDisplayName(effectiveRoleKey);

  const baseUrl =
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://127.0.0.1:2024";

  const getAvatarUrl = (avatarUrl?: string) => {
    if (!avatarUrl) return null;
    if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
      return avatarUrl;
    }
    return `${baseUrl}${avatarUrl}`;
  };

  // Add keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md flex h-20 shrink-0 items-center justify-between gap-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-20 px-8 pt-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 h-10 w-10 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-xl" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4 bg-slate-200"
            />
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                className="justify-start w-full md:w-64 h-10 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 px-2"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Search...</span>
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Mail */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                >
                  <div className="relative">
                    <Mail className="h-5 w-5" />
                    <span className="absolute top-0 right-0 inline-flex h-2 w-2 rounded-full bg-sky-500 border-2 border-white" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-80 p-0 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b bg-sky-50/50">
                  <span className="font-semibold text-sm">Messages</span>
                  <span className="text-xs text-sky-600 hover:text-sky-700 cursor-pointer font-medium">
                    Mark all read
                  </span>
                </div>
                <ScrollArea className="h-[300px]">
                  <div className="flex flex-col">
                    {[1, 2, 3].map((id) => (
                      <DropdownMenuItem
                        key={id}
                        className="flex flex-col items-start gap-1 p-3 cursor-pointer border-b border-border/50 last:border-0 hover:bg-slate-50 focus:bg-slate-50 rounded-none transition-colors"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-semibold text-sm text-slate-900">
                            Alice Johnson
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            2m ago
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          Hey, just checking in on the content calendar for next
                          week.
                        </p>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-2 border-t bg-slate-50/30 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto py-1.5 text-xs w-full text-slate-500 hover:text-sky-600"
                  >
                    View all messages
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                >
                  <div className="relative">
                    <Bell className="h-5 w-5" />
                    {hasUnread && (
                      <span className="absolute top-0 right-0 inline-flex h-2.5 w-2.5 rounded-full bg-rose-500 border-2 border-white" />
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-80 p-0 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b bg-rose-50/50">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">Notifications</span>
                    {unreadNotifications > 0 && (
                      <Badge
                        variant="secondary"
                        className="px-1.5 h-5 text-[10px] font-medium bg-white text-rose-600 border border-rose-100 shadow-sm"
                      >
                        {unreadNotifications} new
                      </Badge>
                    )}
                  </div>
                </div>
                <ScrollArea className="h-[350px]">
                  {useNotificationStore.getState().notifications.length ===
                  0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-3">
                      <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center">
                        <Bell className="h-6 w-6 opacity-20" />
                      </div>
                      <p className="text-sm font-medium">
                        No new notifications
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {useNotificationStore
                        .getState()
                        .notifications.map((n) => (
                          <DropdownMenuItem
                            key={n.id}
                            className="flex flex-col items-start gap-1 p-3 cursor-pointer border-b border-border/50 last:border-0 hover:bg-slate-50 focus:bg-slate-50 rounded-none transition-colors"
                          >
                            <div className="flex items-center gap-2 w-full">
                              <div
                                className={`h-2 w-2 shrink-0 rounded-full ${!n.read ? "bg-sky-500 shadow-sm shadow-sky-200" : "bg-transparent"}`}
                              />
                              <span
                                className={`text-sm flex-1 truncate ${!n.read ? "font-semibold text-slate-900" : "font-medium text-slate-600"}`}
                              >
                                {n.title}
                              </span>
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                Now
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 pl-4">
                              {n.message}
                            </p>
                          </DropdownMenuItem>
                        ))}
                    </div>
                  )}
                </ScrollArea>
                <div className="p-2 border-t bg-slate-50/30">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-8 bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-sm"
                    onClick={() =>
                      useNotificationStore.getState().markAllAsRead()
                    }
                  >
                    Mark all as read
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Settings */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Account</span>
                    <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Billing</span>
                    <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Workspace</span>
                    <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Help */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                  id="help-trigger"
                >
                  <CircleHelp className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Help & Support</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <Book className="mr-2 h-4 w-4" />
                    <span>Documentation</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <LifeBuoy className="mr-2 h-4 w-4" />
                    <span>Support</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Keyboard className="mr-2 h-4 w-4" />
                    <span>Keyboard Shortcuts</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Language */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full hover:bg-slate-100"
                  id="language-trigger"
                >
                  <div className="h-5 w-5 overflow-hidden rounded-full flex items-center justify-center">
                    <CircleFlag countryCode="gb" height={20} />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel>Language</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2">
                  <div className="h-4 w-4 overflow-hidden rounded-full flex items-center justify-center">
                    <CircleFlag countryCode="gb" height={16} />
                  </div>
                  <span>English</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <div className="h-4 w-4 overflow-hidden rounded-full flex items-center justify-center">
                    <CircleFlag countryCode="fr" height={16} />
                  </div>
                  <span>Français</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <div className="h-4 w-4 overflow-hidden rounded-full flex items-center justify-center">
                    <CircleFlag countryCode="de" height={16} />
                  </div>
                  <span>Deutsch</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="h-8 w-[1px] bg-slate-200 mx-2" />

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-10 w-10 rounded-full p-0 overflow-hidden border border-slate-200 hover:ring-2 hover:ring-slate-100 transition-all"
                  id="profile-trigger"
                >
                  <Avatar className="h-full w-full">
                    {profileUser?.avatar_url ? (
                      <Image
                        src={getAvatarUrl(profileUser.avatar_url) || ""}
                        alt="User avatar"
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    ) : (
                      <AvatarFallback className="bg-slate-100 text-slate-600 font-medium">
                        {userInitials}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 p-1" forceMount>
                <DropdownMenuLabel className="p-0 font-normal mb-1">
                  <div className="flex items-center gap-3 px-2.5 py-3 rounded-lg bg-slate-50/80 border border-slate-100 mx-0.5 mt-0.5">
                    <Avatar className="h-9 w-9 rounded-lg border border-white shadow-sm overflow-hidden relative">
                      {profileUser?.avatar_url ? (
                        <Image
                          src={getAvatarUrl(profileUser.avatar_url) || ""}
                          alt="User avatar"
                          fill
                          className="object-cover"
                          sizes="36px"
                        />
                      ) : (
                        <AvatarFallback className="rounded-lg bg-white text-slate-700 font-semibold">
                          {userInitials}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="grid flex-1 text-left leading-tight">
                      <span className="truncate font-semibold text-sm text-slate-900">
                        {userName}
                      </span>
                      <span className="truncate text-xs text-slate-500 font-normal">
                        {userEmail}
                      </span>
                      {userRole && (
                        <Badge
                          variant="outline"
                          className="mt-1 w-fit rounded-sm px-1 py-0 text-[9px] h-4 font-normal text-slate-500 border-slate-200 bg-white"
                        >
                          {userRole}
                        </Badge>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => router.push("/settings/subscription")}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-center h-5 w-5 rounded-md bg-violet-50 mr-2">
                      <Sparkles className="h-3.5 w-3.5 text-violet-600 fill-violet-200/50" />
                    </div>
                    <span className="font-medium text-slate-700">
                      Upgrade to Pro
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-slate-100 my-1" />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => router.push("/settings")}
                    className="cursor-pointer"
                  >
                    <BadgeCheck className="mr-2 h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                    <span className="text-slate-600 group-hover:text-slate-900">
                      Account
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/settings/billing")}
                    className="cursor-pointer"
                  >
                    <CreditCard className="mr-2 h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                    <span className="text-slate-600 group-hover:text-slate-900">
                      Billing
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/settings/security")}
                    className="cursor-pointer"
                  >
                    <Bell className="mr-2 h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                    <span className="text-slate-600 group-hover:text-slate-900">
                      Security
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-slate-100 my-1" />
                <DropdownMenuItem
                  className="text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer"
                  onClick={() => logout()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span className="font-medium">Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Impersonation Banner */}
        <ImpersonationBanner />

        <div
          className={`flex flex-1 flex-col gap-4 px-8 py-6 ${
            fullWidth ? "w-full" : "max-w-[1600px] mx-auto w-full"
          } ${className}`}
        >
          {/* Page Header */}
          {!hideTitle && (
            <PageHeader
              title={title}
              description={description}
              actions={actions}
            />
          )}

          {/* Main Content */}
          <div className="flex-1">{children}</div>
        </div>
      </SidebarInset>

      {/* <NotificationsDrawer // Removed
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      /> */}

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </SidebarProvider>
  );
}
