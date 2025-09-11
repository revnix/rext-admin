"use client";

import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageLayout } from "@/components/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Types
interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface NavigationItem {
  id: string;
  title: string;
  href: string;
}

interface MetadataItem {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
}

interface ActionButton {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: "default" | "secondary" | "outline" | "destructive";
  disabled?: boolean;
  loading?: boolean;
  tooltip?: string;
}

interface DetailPageWrapperProps {
  // Page metadata
  title: string;
  subtitle?: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];

  // Navigation
  backUrl?: string;
  backLabel?: string;
  prevItem?: NavigationItem;
  nextItem?: NavigationItem;

  // Content areas
  children: ReactNode; // Main content
  sidebar?: ReactNode; // Right sidebar content
  headerActions?: ReactNode; // Actions in the header
  quickActions?: ActionButton[]; // Quick action buttons in sidebar

  // Status & metadata
  status?: string;
  statusVariant?: "default" | "secondary" | "outline" | "destructive";
  metadata?: MetadataItem[];

  // Layout options
  layout?: "default" | "full-width" | "no-sidebar";
  sidebarWidth?: "sm" | "md" | "lg";

  // States
  isLoading?: boolean;
  error?: string | Error;
  loadingMessage?: string;

  // Additional styling
  className?: string;
  contentClassName?: string;
  sidebarClassName?: string;
}

export function DetailPageWrapper({
  title,
  subtitle,
  description,
  breadcrumbs = [],
  backUrl,
  backLabel = "Back",
  prevItem,
  nextItem,
  children,
  sidebar,
  headerActions,
  quickActions = [],
  status,
  statusVariant = "default",
  metadata = [],
  layout = "default",
  sidebarWidth = "md",
  isLoading = false,
  error,
  loadingMessage = "Loading...",
  className,
  contentClassName,
  sidebarClassName,
}: DetailPageWrapperProps) {
  // Error state
  if (error) {
    const errorMessage = typeof error === "string" ? error : error.message;
    return (
      <PageLayout
        title="Error"
        description="Failed to load details"
        breadcrumbs={breadcrumbs}
      >
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                {errorMessage ||
                  "Something went wrong while loading the details."}
              </p>
              {backUrl && (
                <Button asChild variant="outline">
                  <Link href={backUrl}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {backLabel}
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <PageLayout
        title={loadingMessage}
        description="Please wait while we load the details..."
        breadcrumbs={breadcrumbs}
      >
        <div className="space-y-8">
          <TableSkeleton rows={3} />
        </div>
      </PageLayout>
    );
  }

  // Build page actions for header
  const pageActions = (
    <div className="flex items-center gap-2">
      {headerActions}

      {/* Navigation controls */}
      {(prevItem || nextItem) && (
        <>
          <div className="flex items-center gap-1">
            {prevItem && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="outline" size="sm">
                    <Link href={prevItem.href}>
                      <ChevronLeft className="h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Previous: {prevItem.title}</TooltipContent>
              </Tooltip>
            )}

            {nextItem && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="outline" size="sm">
                    <Link href={nextItem.href}>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Next: {nextItem.title}</TooltipContent>
              </Tooltip>
            )}
          </div>

          <Separator orientation="vertical" className="h-6" />
        </>
      )}

      {/* Back button */}
      {backUrl && (
        <Button asChild variant="outline" size="sm">
          <Link href={backUrl}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {backLabel}
          </Link>
        </Button>
      )}
    </div>
  );

  // Get sidebar width classes
  const getSidebarWidthClasses = () => {
    switch (sidebarWidth) {
      case "sm":
        return "lg:col-span-3 xl:col-span-2";
      case "lg":
        return "lg:col-span-5 xl:col-span-4";
      default:
        return "lg:col-span-4 xl:col-span-3";
    }
  };

  const getContentWidthClasses = () => {
    if (layout === "no-sidebar") return "col-span-12";

    switch (sidebarWidth) {
      case "sm":
        return "lg:col-span-9 xl:col-span-10";
      case "lg":
        return "lg:col-span-7 xl:col-span-8";
      default:
        return "lg:col-span-8 xl:col-span-9";
    }
  };

  // Build enhanced title with subtitle and status
  const enhancedTitle = (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {status && (
          <Badge variant={statusVariant} className="capitalize">
            {status}
          </Badge>
        )}
      </div>
      {subtitle && (
        <p className="text-lg text-muted-foreground font-medium">{subtitle}</p>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <PageLayout
        title=""
        breadcrumbs={breadcrumbs}
        actions={pageActions}
        className={className}
      >
        {/* Custom header with enhanced title and metadata */}
        <div className="space-y-6">
          {/* Enhanced title section */}
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              {enhancedTitle}
              {description && (
                <p className="text-muted-foreground max-w-3xl">{description}</p>
              )}
            </div>
          </div>

          {/* Metadata section */}
          {metadata.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 py-4 border-y bg-muted/30 rounded-lg px-4">
              {metadata.map((item, index) => (
                <div key={`${item.label}-${index}`} className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {item.icon}
                    {item.label}
                  </div>
                  <div className="font-medium text-sm">{item.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Main content area */}
          <div
            className={cn(
              "grid grid-cols-1 gap-8",
              layout === "full-width"
                ? "grid-cols-1"
                : layout === "no-sidebar"
                  ? "grid-cols-1"
                  : "lg:grid-cols-12",
            )}
          >
            {/* Main content */}
            <div
              className={cn(
                "space-y-8",
                layout === "full-width" || layout === "no-sidebar"
                  ? "col-span-1"
                  : getContentWidthClasses(),
                contentClassName,
              )}
            >
              {children}
            </div>

            {/* Sidebar */}
            {layout !== "no-sidebar" &&
              (layout === "full-width" ? null : (
                <div
                  className={cn(
                    "space-y-6",
                    getSidebarWidthClasses(),
                    sidebarClassName,
                  )}
                >
                  {/* Quick Actions Card */}
                  {quickActions.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {quickActions.map((action, index) => (
                          <Tooltip key={`${action.label}-${index}`}>
                            <TooltipTrigger asChild>
                              <Button
                                variant={action.variant || "outline"}
                                className="w-full justify-start gap-2"
                                onClick={action.onClick}
                                disabled={action.disabled || action.loading}
                              >
                                {action.loading ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : (
                                  action.icon
                                )}
                                {action.loading ? "Loading..." : action.label}
                              </Button>
                            </TooltipTrigger>
                            {action.tooltip && (
                              <TooltipContent>{action.tooltip}</TooltipContent>
                            )}
                          </Tooltip>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Custom sidebar content */}
                  {sidebar}
                </div>
              ))}
          </div>
        </div>
      </PageLayout>
    </TooltipProvider>
  );
}

// Export types for external use
export type {
  DetailPageWrapperProps,
  BreadcrumbItem,
  NavigationItem,
  MetadataItem,
  ActionButton,
};
