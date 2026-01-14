"use client";

import { Bell } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { ImpersonationBanner } from "@/components/impersonation/impersonation-banner";
import { NotificationsDrawer } from "@/components/notifications-drawer";
import { QuickAddDropdown } from "@/components/quick-add-dropdown";
import { SearchDialog } from "@/components/search-dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useNotificationStore } from "@/stores/notification-store";

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

export function PageLayout({
  title,
  hideTitle = false,
  description,
  breadcrumbs = [],
  actions,
  children,
  className = "",
  fullWidth = false,
}: PageLayoutProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const unreadNotifications = useNotificationStore(
    (state) => state.unreadCount,
  );

  const hasUnread = unreadNotifications > 0;
  const notificationSummary = hasUnread
    ? `${unreadNotifications} Notifications`
    : "Notifications";

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

  // Track client-side mounting to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b border-border">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            {breadcrumbs.length > 0 && (
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((breadcrumb, index) => (
                    <div
                      key={`${breadcrumb.label}-${index}`}
                      className="flex items-center"
                    >
                      {index > 0 && (
                        <BreadcrumbSeparator className="hidden md:block" />
                      )}
                      <BreadcrumbItem className="hidden md:block">
                        {breadcrumb.href ? (
                          <BreadcrumbLink href={breadcrumb.href}>
                            {breadcrumb.label}
                          </BreadcrumbLink>
                        ) : (
                          <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                    </div>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            )}
          </div>
          <div className="flex-1 flex justify-center px-4">
            <Button
              variant="outline"
              className="justify-between w-64 text-muted-foreground"
              onClick={() => setSearchOpen(true)}
            >
              <span>Search everything...</span>
              <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">
                  {isMounted &&
                  navigator.userAgent.toLowerCase().includes("mac")
                    ? "⌘"
                    : "Ctrl+"}
                </span>
                K
              </kbd>
            </Button>
          </div>
          <div className="px-4 flex items-center gap-2">
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => setNotificationsOpen(true)}
            >
              <div className="relative">
                <Bell className="h-4 w-4" />
                {hasUnread && (
                  <span className="absolute -top-0.5 -right-0 inline-flex h-2 w-2 rounded-full bg-red-500" />
                )}
              </div>
              <span className="text-sm font-medium" aria-live="polite">
                {notificationSummary}
              </span>
            </Button>
            <QuickAddDropdown />
          </div>
        </header>

        {/* Impersonation Banner */}
        <ImpersonationBanner />

        <div
          className={`flex flex-1 flex-col gap-4 p-4 pt-6 ${
            fullWidth ? "w-full" : "max-w-[1600px] mx-auto w-full"
          } ${className}`}
        >
          {/* Page Header */}
          <div className="flex items-start justify-between">
            {!hideTitle && (
              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                {description && (
                  <p className="text-muted-foreground max-w-2xl">
                    {description}
                  </p>
                )}
              </div>
            )}
            {actions && (
              <div className="flex items-start gap-2 mt-1">{actions}</div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1">{children}</div>
        </div>
      </SidebarInset>

      <NotificationsDrawer
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </SidebarProvider>
  );
}
