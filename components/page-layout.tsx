"use client";

import { resolveApiBaseUrl } from "@/lib/api-base-url";
import {
  BadgeCheck,
  Bell,
  Book,
  CircleHelp,
  CreditCard,
  Laptop,
  LifeBuoy,
  LogOut,
  Moon,
  Search,
  Settings,
  Sparkles,
  Sun,
  Users,
} from "lucide-react";
import { useTheme } from "@/providers/theme-provider";

import { workspaceRoutes, settingsRoutes } from "@/lib/routes";
import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { profileQueries } from "@/lib/query-keys";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { ImpersonationBanner } from "@/components/impersonation/impersonation-banner";
// import { QuickAddDropdown } from "@/components/quick-add-dropdown"; // Removed
import { SearchDialog } from "@/components/search-dialog";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNotificationStore } from "@/stores/notification-store";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useWorkspaceStore } from "@/stores/workspace";
import { useSubscriptionStore } from "@/stores/subscription-store";

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

import { PageHeader } from "@/components/page-header";
import { NotificationsDrawer } from "./notifications-drawer";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { CreditBalanceWidget } from "@/components/subscription/credit-balance-widget";
import { BackgroundGenerationDock } from "@/components/background-generation-dock";

interface PageLayoutProps {
  title: string;
  hideTitle?: boolean;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
}

import type { Route } from "next";

export function PageLayout({
  title,
  hideTitle = false,
  description,
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

  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthSession();

  // Workspace permissions
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  // const { role: fetchedWorkspaceRole } = useWorkspacePermissions(
  //   currentWorkspace?.id,
  // );
  const hasUnread = unreadNotifications > 0;

  const subscription = useSubscriptionStore((state) => state.subscription);
  const usage = useSubscriptionStore((state) => state.usage);
  // Note: subscription data is fetched by the gated consumers in the chrome
  // (useResourceLimit in AppSidebar/WorkspaceSwitcher) via the subscription
  // store, which single-flights and TTL-throttles the burst. Do not add an
  // ungated fetchSubscription() effect here — it re-fired the 3-request
  // burst on every page navigation.

  const planName =
    subscription?.subscription?.plan_display_name ||
    subscription?.subscription?.plan_name ||
    usage?.plan_name;

  const displayPlanLabel = planName
    ? planName.toLowerCase() === "free"
      ? "Upgrade to Pro"
      : `${planName} Plan`
    : "Upgrade to Pro";

  const { data: profileUser } = useQuery({
    ...profileQueries.detail(),
    enabled: isAuthenticated,
  });

  // Helper
  const getInitials = (name?: string) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "?";

  // const getRoleDisplayName = (role?: string) => {
  //   const map: Record<string, string> = {
  //     super_admin: "Super Admin",
  //     workspace_owner: "Workspace Owner",
  //     workspace_admin: "Workspace Admin",
  //     admin: "Admin",
  //     manager: "Manager",
  //     developer: "Developer",
  //     editor: "Editor",
  //     viewer: "Viewer",
  //     user: "User",
  //     guest: "Guest",
  //     owner: "Owner",
  //   };
  //   if (!role) return "";
  //   return (
  //     map[role] ??
  //     role.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  //   );
  // };

  // User data
  const userName = profileUser?.full_name || user?.full_name || "User";
  const userEmail = profileUser?.email || user?.email || "";
  const userInitials = getInitials(userName);

  const baseUrl = resolveApiBaseUrl();

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
        {/* Mobile/Tablet Workspace Switcher + Header - stick together as one unit so they don't overlap while scrolling */}
        <div className="sticky top-0 z-50 bg-sidebar">
          <div className="lg:hidden border-b border-border px-4 py-3">
            <WorkspaceSwitcher />
          </div>

          <header className="flex h-20 shrink-0 items-center justify-between gap-4 border-b border-border bg-sidebar px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-20">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="-ml-1 h-10 w-10 border border-border bg-background text-slate-500 hover:bg-foreground/5 hover:text-foreground dark:text-sidebar-foreground [&_svg]:!text-current" />
              <div className="hidden lg:flex items-center gap-4">
                {/* Plain button on purpose: the shared Button adds a press
                    scale (btn-active) and a tinted shadow this field shouldn't have. */}
                <button
                  type="button"
                  className="relative flex h-10 w-74 xl:w-96 cursor-pointer items-center justify-start overflow-hidden rounded-md border border-border bg-sidebar-accent/30 px-3 text-sm text-sidebar-foreground/70 transition-colors outline-none hover:bg-foreground/5 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:border-sidebar-border dark:bg-sidebar-accent/50 dark:text-sidebar-foreground"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="h-4 w-4 mr-2 opacity-50 shrink-0" />
                  <span className="text-sm font-normal inline-block truncate">
                    Search or type command...
                  </span>
                  <kbd className="pointer-events-none absolute right-2 top-[50%] -translate-y-[50%] hidden h-6 select-none items-center gap-1 rounded-md bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 lg:flex border border-border">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {/* Credits Widget */}
              <CreditBalanceWidget className="hidden sm:flex" />

              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full hover:bg-foreground/5 text-slate-500 hover:text-foreground dark:text-sidebar-foreground relative"
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
                    className="h-10 w-10 rounded-full hover:bg-foreground/5 text-slate-500 hover:text-foreground dark:text-sidebar-foreground"
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
                          className="focus:bg-foreground/5 hover:bg-foreground/5 text-slate-500 focus:text-foreground hover:text-foreground dark:text-sidebar-foreground [&_svg]:!text-current [&_[data-slot=dropdown-menu-shortcut]]:!text-current"
                          onClick={() =>
                            router.push(
                              workspaceRoutes.settings.root(
                                currentWorkspace.slug,
                              ) as Route,
                            )
                          }
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Workspace Settings</span>
                          <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="focus:bg-foreground/5 hover:bg-foreground/5 text-slate-500 focus:text-foreground hover:text-foreground dark:text-sidebar-foreground [&_svg]:!text-current"
                          onClick={() =>
                            router.push(
                              workspaceRoutes.members(
                                currentWorkspace.slug,
                              ) as Route,
                            )
                          }
                        >
                          <Users className="mr-2 h-4 w-4" />
                          <span>Workspace Members</span>
                        </DropdownMenuItem>
                      </>
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
                    className="h-10 w-10 rounded-full hover:bg-foreground/5 text-slate-500 hover:text-foreground dark:text-sidebar-foreground"
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
                      className="focus:bg-foreground/5 hover:bg-foreground/5 text-slate-500 focus:text-foreground hover:text-foreground dark:text-sidebar-foreground [&_svg]:!text-current"
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
                      className="focus:bg-foreground/5 hover:bg-foreground/5 text-slate-500 focus:text-foreground hover:text-foreground dark:text-sidebar-foreground [&_svg]:!text-current"
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
                onOpenChange={(open) =>
                  setActiveDropdown(open ? "theme" : null)
                }
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full hover:bg-foreground/5 text-slate-500 hover:text-foreground dark:text-sidebar-foreground"
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
                    className="cursor-pointer focus:bg-foreground/5 hover:bg-foreground/5 text-slate-500 focus:text-foreground hover:text-foreground dark:text-sidebar-foreground [&_svg]:!text-current"
                  >
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Light</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTheme("dark")}
                    className="cursor-pointer focus:bg-foreground/5 hover:bg-foreground/5 text-slate-500 focus:text-foreground hover:text-foreground dark:text-sidebar-foreground [&_svg]:!text-current"
                  >
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Dark</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTheme("system")}
                    className="cursor-pointer focus:bg-foreground/5 hover:bg-foreground/5 text-slate-500 focus:text-foreground hover:text-foreground dark:text-sidebar-foreground [&_svg]:!text-current"
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
                        <img
                          src={getAvatarUrl(profileUser.avatar_url) || ""}
                          alt="User avatar"
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <AvatarFallback className="bg-muted text-muted-foreground font-medium hover:bg-foreground/5 text-slate-500 hover:text-foreground dark:text-sidebar-foreground">
                          {userInitials}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-60 p-1"
                  forceMount
                >
                  <DropdownMenuLabel className="p-0 font-normal mb-1">
                    <div className="flex items-center gap-3 px-2.5 py-3 rounded-md bg-muted/40 mx-0.5 mt-0.5">
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

                  <div className="sm:hidden px-0.5 pb-1">
                    {activeDropdown === "profile" && (
                      <CreditBalanceWidget variant="row" />
                    )}
                  </div>

                  <DropdownMenuSeparator className="bg-border my-1" />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() => router.push(settingsRoutes.subscription)}
                      className="cursor-pointer focus:bg-foreground/5 hover:bg-foreground/5 text-slate-500 focus:text-foreground hover:text-foreground dark:text-sidebar-foreground [&_svg]:!text-current"
                    >
                      <div className="flex items-center justify-center h-5 w-5 rounded-md mr-2">
                        <Sparkles className="h-3.5 w-3.5 text-gray-600 fill-gray-100/50 dark:fill-gray-600/50" />
                      </div>
                      <span className="font-medium">{displayPlanLabel}</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="bg-border my-1" />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() => router.push(settingsRoutes.root)}
                      className="cursor-pointer focus:bg-foreground/5 hover:bg-foreground/5 text-slate-500 focus:text-foreground hover:text-foreground dark:text-sidebar-foreground [&_svg]:!text-current"
                    >
                      <BadgeCheck className="mr-2 h-4 w-4" />
                      <span>Account</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push(settingsRoutes.subscription)}
                      className="cursor-pointer focus:bg-foreground/5 hover:bg-foreground/5 text-slate-500 focus:text-foreground hover:text-foreground dark:text-sidebar-foreground [&_svg]:!text-current"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>Billing</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push(settingsRoutes.security)}
                      className="cursor-pointer focus:bg-foreground/5 hover:bg-foreground/5 text-slate-500 focus:text-foreground hover:text-foreground dark:text-sidebar-foreground [&_svg]:!text-current"
                    >
                      <Bell className="mr-2 h-4 w-4" />
                      <span>Security</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="bg-border my-1" />
                  <DropdownMenuItem
                    className="cursor-pointer text-slate-500 hover:bg-foreground/5 focus:bg-foreground/5 hover:text-foreground focus:text-foreground dark:text-sidebar-foreground"
                    onClick={() => logout()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span className="font-medium">Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
        </div>
        {/* Impersonation Banner */}
        <ImpersonationBanner />

        <div
          className={`flex flex-1 flex-col gap-8 px-4 sm:px-8 py-6 min-w-0 ${
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
          <div className="flex-1 min-w-0">{children}</div>
        </div>
        {/* Bottom generation progress dock */}
        <BackgroundGenerationDock />
      </SidebarInset>

      <NotificationsDrawer
        open={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </SidebarProvider>
  );
}
