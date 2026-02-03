"use client";

import {
  ArrowLeftRight,
  BadgeCheck,
  Bell,
  Book,
  CircleHelp,
  CreditCard,
  Laptop,
  LifeBuoy,
  LogOut,
  Moon,
  PanelLeft,
  Search,
  Settings,
  Sparkles,
  Sun,
  Users,
  Plus,
} from "lucide-react";
import { useTheme } from "next-themes";

import { workspaceRoutes } from "@/lib/routes";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { CircleFlag } from "react-circle-flags";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNotificationStore } from "@/stores/notification-store";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useWorkspaceStore } from "@/stores/workspace";
import { useWorkspacePermissions } from "@/hooks/use-workspace-permissions";
import { apiClient } from "@/lib/api-client";
import { log } from "@/lib/logger";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";

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
import { NotificationsDrawer } from "./notifications-drawer";

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

function PageLayoutContent({
  title,
  hideTitle = false,
  description,
  breadcrumbs: _breadcrumbs = [],
  actions,
  children,
  className = "",
  fullWidth = false,
}: PageLayoutProps) {
  const { isDrawerOpen, setDrawerOpen } = useNotificationStore();
  const unreadNotifications = useNotificationStore(
    (state) => state.unreadCount,
  );
  const [searchOpen, setSearchOpen] = useState(false);

  // State for exclusive dropdowns
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { setTheme } = useTheme();
  const { isMobile } = useSidebar();

  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthSession();
  const [profileUser, setProfileUser] = useState<ApiUser | null>(null);

  // Workspace permissions
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const workspaceList = useWorkspaceStore((state) => state.workspaceList);
  const { role: fetchedWorkspaceRole } = useWorkspacePermissions(
    currentWorkspace?.id,
  );

  const hasWorkspaces = workspaceList.length > 0;

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
  const userName = profileUser?.full_name || user?.full_name || "User";
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
    <>
      <AppSidebar />
      <SidebarInset>
        {/* Mobile Workspace Switcher - full width at top on mobile only */}
        {isMobile && (
          <div className="sticky top-0 z-50 md:hidden border-b border-border bg-white dark:bg-sidebar px-4 py-3">
            <WorkspaceSwitcher />
          </div>
        )}
        <header
          className={`sticky z-50 flex h-20 shrink-0 items-center justify-between gap-4 border-b border-border bg-white px-6 dark:bg-sidebar transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-20 ${isMobile ? "top-[73px]" : "top-0"}`}
        >
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-1 h-10 w-10 border border-border bg-white text-slate-500 hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-700)] dark:bg-sidebar-accent dark:border-sidebar-border dark:text-sidebar-foreground dark:hover:bg-[var(--color-brand-900)]/50 dark:hover:text-[var(--color-brand-100)] [&_svg]:!text-current" />
            <div className="hidden md:flex items-center gap-4">
              <Button
                variant="outline"
                className="justify-start w-10 md:w-96 h-10 rounded-md bg-white border-input px-0 md:px-3 overflow-hidden relative shadow-none hover:border-input text-slate-500 hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-700)] dark:bg-sidebar-accent/50 dark:border-sidebar-border dark:text-sidebar-foreground dark:hover:bg-[var(--color-brand-900)]/50 dark:hover:text-[var(--color-brand-100)] [&_svg]:!text-current"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-4 w-4 md:mr-2 opacity-50 shrink-0 mx-auto md:mx-0" />
                <span className="text-sm font-normal hidden md:inline-block truncate">
                  Search or type command...
                </span>
                <kbd className="pointer-events-none absolute right-2 top-[50%] -translate-y-[50%] hidden h-6 select-none items-center gap-1 rounded bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 md:flex border border-border">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full hover:bg-[var(--color-brand-50)] text-slate-500 hover:text-[var(--color-brand-700)] dark:hover:bg-[var(--color-brand-900)]/50 dark:text-sidebar-foreground dark:hover:text-[var(--color-brand-100)] relative"
              onClick={() => setDrawerOpen(true)}
            >
              <Bell className="h-5 w-5" />
              {hasUnread && (
                <span className="absolute top-2.5 right-2.5 inline-flex h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-sidebar" />
              )}
            </Button>

            {/* Settings */}
            <DropdownMenu
              open={activeDropdown === "settings"}
              onOpenChange={(open) =>
                setActiveDropdown(open ? "settings" : null)
              }
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full hover:bg-[var(--color-brand-50)] text-slate-500 hover:text-[var(--color-brand-700)] dark:hover:bg-[var(--color-brand-900)]/50 dark:text-sidebar-foreground dark:hover:text-[var(--color-brand-100)]"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {currentWorkspace?.slug && (
                    <>
                      <DropdownMenuItem
                        className="focus:bg-[var(--color-brand-50)] hover:bg-[var(--color-brand-50)] text-slate-500 focus:text-[var(--color-brand-700)] hover:text-[var(--color-brand-700)] dark:focus:bg-[var(--color-brand-900)]/50 dark:hover:bg-[var(--color-brand-900)]/50 dark:text-sidebar-foreground dark:focus:text-[var(--color-brand-100)] dark:hover:text-[var(--color-brand-100)] [&_svg]:!text-current [&_[data-slot=dropdown-menu-shortcut]]:!text-current"
                        onClick={() =>
                          router.push(
                            workspaceRoutes.settings.root(
                              currentWorkspace.slug,
                            ),
                          )
                        }
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Workspace Settings</span>
                        <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="focus:bg-[var(--color-brand-50)] hover:bg-[var(--color-brand-50)] text-slate-500 focus:text-[var(--color-brand-700)] hover:text-[var(--color-brand-700)] dark:focus:bg-[var(--color-brand-900)]/50 dark:hover:bg-[var(--color-brand-900)]/50 dark:text-sidebar-foreground dark:focus:text-[var(--color-brand-100)] dark:hover:text-[var(--color-brand-100)] [&_svg]:!text-current"
                        onClick={() =>
                          router.push(
                            workspaceRoutes.members(currentWorkspace.slug),
                          )
                        }
                      >
                        <Users className="mr-2 h-4 w-4" />
                        <span>Workspace Members</span>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  {hasWorkspaces ? (
                    <DropdownMenuItem
                      className="focus:bg-[var(--color-brand-50)] hover:bg-[var(--color-brand-50)] text-slate-500 focus:text-[var(--color-brand-700)] hover:text-[var(--color-brand-700)] dark:focus:bg-[var(--color-brand-900)]/50 dark:hover:bg-[var(--color-brand-900)]/50 dark:text-sidebar-foreground dark:focus:text-[var(--color-brand-100)] dark:hover:text-[var(--color-brand-100)] [&_svg]:!text-current"
                      onClick={() => router.push("/")}
                    >
                      <ArrowLeftRight className="mr-2 h-4 w-4" />
                      <span>Switch Workspace</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      className="focus:bg-[var(--color-brand-50)] hover:bg-[var(--color-brand-50)] text-slate-500 focus:text-[var(--color-brand-700)] hover:text-[var(--color-brand-700)] dark:focus:bg-[var(--color-brand-900)]/50 dark:hover:bg-[var(--color-brand-900)]/50 dark:text-sidebar-foreground dark:focus:text-[var(--color-brand-100)] dark:hover:text-[var(--color-brand-100)] [&_svg]:!text-current"
                      onClick={() => router.push("/w/create")}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      <span>Create Workspace</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Help */}
            <DropdownMenu
              open={activeDropdown === "help"}
              onOpenChange={(open) => setActiveDropdown(open ? "help" : null)}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full hover:bg-[var(--color-brand-50)] text-slate-500 hover:text-[var(--color-brand-700)] dark:hover:bg-[var(--color-brand-900)]/50 dark:text-sidebar-foreground dark:hover:text-[var(--color-brand-100)]"
                  id="help-trigger"
                >
                  <CircleHelp className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Help & Support</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    asChild
                    className="focus:bg-[var(--color-brand-50)] hover:bg-[var(--color-brand-50)] text-slate-500 focus:text-[var(--color-brand-700)] hover:text-[var(--color-brand-700)] dark:focus:bg-[var(--color-brand-900)]/50 dark:hover:bg-[var(--color-brand-900)]/50 dark:text-sidebar-foreground dark:focus:text-[var(--color-brand-100)] dark:hover:text-[var(--color-brand-100)] [&_svg]:!text-current"
                  >
                    <a
                      href="https://rext.ai/help"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center cursor-pointer"
                    >
                      <Book className="mr-2 h-4 w-4" />
                      <span>Documentation</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="focus:bg-[var(--color-brand-50)] hover:bg-[var(--color-brand-50)] text-slate-500 focus:text-[var(--color-brand-700)] hover:text-[var(--color-brand-700)] dark:focus:bg-[var(--color-brand-900)]/50 dark:hover:bg-[var(--color-brand-900)]/50 dark:text-sidebar-foreground dark:focus:text-[var(--color-brand-100)] dark:hover:text-[var(--color-brand-100)] [&_svg]:!text-current"
                  >
                    <a
                      href="https://rext.ai/help"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center cursor-pointer"
                    >
                      <LifeBuoy className="mr-2 h-4 w-4" />
                      <span>Support</span>
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            <DropdownMenu
              open={activeDropdown === "theme"}
              onOpenChange={(open) => setActiveDropdown(open ? "theme" : null)}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full hover:bg-[var(--color-brand-50)] text-slate-500 hover:text-[var(--color-brand-700)] dark:hover:bg-[var(--color-brand-900)]/50 dark:text-sidebar-foreground dark:hover:text-[var(--color-brand-100)]"
                >
                  <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Theme</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setTheme("light")}
                  className="cursor-pointer focus:bg-[var(--color-brand-50)] hover:bg-[var(--color-brand-50)] text-slate-500 focus:text-[var(--color-brand-700)] hover:text-[var(--color-brand-700)] dark:focus:bg-[var(--color-brand-900)]/50 dark:hover:bg-[var(--color-brand-900)]/50 dark:text-sidebar-foreground dark:focus:text-[var(--color-brand-100)] dark:hover:text-[var(--color-brand-100)] [&_svg]:!text-current"
                >
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("dark")}
                  className="cursor-pointer focus:bg-[var(--color-brand-50)] hover:bg-[var(--color-brand-50)] text-slate-500 focus:text-[var(--color-brand-700)] hover:text-[var(--color-brand-700)] dark:focus:bg-[var(--color-brand-900)]/50 dark:hover:bg-[var(--color-brand-900)]/50 dark:text-sidebar-foreground dark:focus:text-[var(--color-brand-100)] dark:hover:text-[var(--color-brand-100)] [&_svg]:!text-current"
                >
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Dark</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("system")}
                  className="cursor-pointer focus:bg-[var(--color-brand-50)] hover:bg-[var(--color-brand-50)] text-slate-500 focus:text-[var(--color-brand-700)] hover:text-[var(--color-brand-700)] dark:focus:bg-[var(--color-brand-900)]/50 dark:hover:bg-[var(--color-brand-900)]/50 dark:text-sidebar-foreground dark:focus:text-[var(--color-brand-100)] dark:hover:text-[var(--color-brand-100)] [&_svg]:!text-current"
                >
                  <Laptop className="mr-2 h-4 w-4" />
                  <span>System</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="h-8 w-[1px] bg-border mx-2" />

            {/* Profile */}
            <DropdownMenu
              open={activeDropdown === "profile"}
              onOpenChange={(open) =>
                setActiveDropdown(open ? "profile" : null)
              }
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-10 w-10 rounded-full p-0 overflow-hidden border border-border transition-all"
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
                      <AvatarFallback className="bg-muted text-muted-foreground font-medium hover:bg-[var(--color-brand-50)] text-slate-500 hover:text-[var(--color-brand-700)] dark:hover:bg-[var(--color-brand-900)]/50 dark:text-sidebar-foreground dark:hover:text-[var(--color-brand-100)]">
                        {userInitials}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 p-1" forceMount>
                <DropdownMenuLabel className="p-0 font-normal mb-1">
                  <div className="flex items-center gap-3 px-2.5 py-3 rounded-lg bg-muted/40 mx-0.5 mt-0.5">
                    <div className="grid flex-1 text-left leading-tight">
                      <span className="truncate font-semibold text-sm text-foreground">
                        {userName}
                      </span>
                      <span className="truncate text-xs text-muted-foreground font-normal">
                        {userEmail}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border my-1" />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => router.push("/settings/subscription")}
                    className="cursor-pointer focus:bg-[var(--color-brand-50)] hover:bg-[var(--color-brand-50)] text-slate-500 focus:text-[var(--color-brand-700)] hover:text-[var(--color-brand-700)] dark:focus:bg-[var(--color-brand-900)]/50 dark:hover:bg-[var(--color-brand-900)]/50 dark:text-sidebar-foreground dark:focus:text-[var(--color-brand-100)] dark:hover:text-[var(--color-brand-100)] [&_svg]:!text-current"
                  >
                    <div className="flex items-center justify-center h-5 w-5 rounded-md bg-violet-50 mr-2">
                      <Sparkles className="h-3.5 w-3.5 text-violet-600 fill-violet-200/50" />
                    </div>
                    <span className="font-medium">Upgrade to Pro</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-border my-1" />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => router.push("/settings")}
                    className="cursor-pointer focus:bg-[var(--color-brand-50)] hover:bg-[var(--color-brand-50)] text-slate-500 focus:text-[var(--color-brand-700)] hover:text-[var(--color-brand-700)] dark:focus:bg-[var(--color-brand-900)]/50 dark:hover:bg-[var(--color-brand-900)]/50 dark:text-sidebar-foreground dark:focus:text-[var(--color-brand-100)] dark:hover:text-[var(--color-brand-100)] [&_svg]:!text-current"
                  >
                    <BadgeCheck className="mr-2 h-4 w-4" />
                    <span>Account</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/settings/billing")}
                    className="cursor-pointer focus:bg-[var(--color-brand-50)] hover:bg-[var(--color-brand-50)] text-slate-500 focus:text-[var(--color-brand-700)] hover:text-[var(--color-brand-700)] dark:focus:bg-[var(--color-brand-900)]/50 dark:hover:bg-[var(--color-brand-900)]/50 dark:text-sidebar-foreground dark:focus:text-[var(--color-brand-100)] dark:hover:text-[var(--color-brand-100)] [&_svg]:!text-current"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Billing</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/settings/security")}
                    className="cursor-pointer focus:bg-[var(--color-brand-50)] hover:bg-[var(--color-brand-50)] text-slate-500 focus:text-[var(--color-brand-700)] hover:text-[var(--color-brand-700)] dark:focus:bg-[var(--color-brand-900)]/50 dark:hover:bg-[var(--color-brand-900)]/50 dark:text-sidebar-foreground dark:focus:text-[var(--color-brand-100)] dark:hover:text-[var(--color-brand-100)] [&_svg]:!text-current"
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Security</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-border my-1" />
                <DropdownMenuItem
                  className="text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer hover:bg-rose-50 text-slate-500 hover:text-rose-700 dark:hover:bg-rose-900/50 dark:text-rose-400 dark:hover:text-rose-200 focus:text-rose-700 focus:bg-rose-50"
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
          className={`flex flex-1 flex-col gap-4 px-4 md:px-8 py-6 ${
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

      <NotificationsDrawer
        open={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}

export function PageLayout(props: PageLayoutProps) {
  return (
    <SidebarProvider>
      <PageLayoutContent {...props} />
    </SidebarProvider>
  );
}
