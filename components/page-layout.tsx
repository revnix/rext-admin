"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { QuickAddDropdown } from "@/components/quick-add-dropdown";
import { NotificationsDrawer } from "@/components/notifications-drawer";
import { Bell, Search } from "lucide-react";
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

interface BreadcrumbItemData {
  label: string;
  href?: string;
}

interface PageLayoutProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItemData[];
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PageLayout({
  title,
  description,
  breadcrumbs = [],
  actions,
  children,
  className = "",
}: PageLayoutProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
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
                    <div key={index} className="flex items-center">
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
            <Button variant="outline" className="justify-between w-64 text-muted-foreground">
              <span>Search</span>
              <Search className="h-4 w-4" />
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
                <div className="absolute -top-0.5 -right-0 h-2 w-2 rounded-full bg-red-500"></div>
              </div>
              3 Notifications
            </Button>
            <QuickAddDropdown />
          </div>
        </header>

        <div className={`flex flex-1 flex-col gap-4 p-4 pt-0 ${className}`}>
          {/* Page Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              {description && (
                <p className="text-muted-foreground max-w-2xl">{description}</p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2">{actions}</div>
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
    </SidebarProvider>
  );
}
