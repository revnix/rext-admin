"use client";

import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { DetailPage } from "@/components/layouts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DetailCard } from "@/components/ui/detail-card";
import { DetailPageSkeleton } from "@/components/ui/detail-page-skeleton";
import { InfoSection } from "@/components/ui/info-section";
import { CircularProgress } from "@/components/ui/progress";
import { SectionHeader } from "@/components/ui/section-header";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type {
  ActionButton,
  BreadcrumbItem,
  CompactDetailWrapperProps,
  CustomCardConfig,
  DetailLayoutConfig,
  DetailPageWrapperProps,
  FullWidthDetailWrapperProps,
  InfoCardConfig,
  MetadataItem,
  NarrowDetailWrapperProps,
  NavigationItem,
  ScoreCardConfig,
  SidebarCard,
  SidebarConfig,
  StatsCardConfig,
  WideDetailWrapperProps,
} from "@/types/detail-page";
import type { Route } from "next";

export function DetailPageWrapper({
  title,
  backUrl,
  backLabel = "Back",
  prevItem,
  nextItem,
  children,
  headerActions,
  quickActions = [],
  sidebarConfig,
  sidebar,
  scoreCard,
  statsCard,
  status,
  statusVariant = "default",
  metadata = [],
  layout = "default",
  sidebarWidth = "md",
  contentWidth = "normal",
  spacing = "normal",
  responsive = true,
  showGridLines: _showGridLines = false,
  isLoading = false,
  error,
  loadingMessage = "Loading...",
  // The page's frame and header are DetailPage's now: these two no longer apply.
  className: _className,
  contentClassName,
  sidebarClassName,
  headerClassName: _headerClassName,
  containerClassName: _containerClassName,
  variant: _variant = "default",
}: DetailPageWrapperProps) {
  // Helper function to render score card
  const renderScoreCard = (config: ScoreCardConfig) => (
    <DetailCard variant="default" key="score-card">
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center mb-4">
          <CircularProgress
            value={config.score}
            size="lg"
            className={cn(
              "text-primary",
              config.variant === "success" && "text-green-500",
              config.variant === "warning" && "text-yellow-500",
              config.variant === "destructive" && "text-red-500",
            )}
          />
        </div>
        <CardTitle className="text-lg">{config.title}</CardTitle>
        <CardDescription>
          <div
            className={cn(
              "text-2xl font-bold mt-1",
              config.variant === "success" && "text-green-600",
              config.variant === "warning" && "text-yellow-600",
              config.variant === "destructive" && "text-red-600",
              !config.variant && "text-primary",
            )}
          >
            {config.score}%
          </div>
          {config.description && (
            <div className="text-sm text-muted-foreground">
              {config.description}
            </div>
          )}
        </CardDescription>
      </CardHeader>
      {config.content && (
        <CardContent className="pt-0 text-center">{config.content}</CardContent>
      )}
    </DetailCard>
  );

  // Helper function to render stats card
  const renderStatsCard = (config: StatsCardConfig) => (
    <DetailCard variant="default" key="stats-card">
      <CardHeader>
        <CardTitle className="text-lg">{config.title}</CardTitle>
        {config.description && (
          <CardDescription>{config.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {config.items.map((item) => (
          <div key={item.label} className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {item.icon && (
                <div className="text-muted-foreground">{item.icon}</div>
              )}
              <span className="text-sm text-muted-foreground">
                {item.label}
              </span>
            </div>
            <div
              className={cn(
                "text-sm font-medium",
                item.highlight && "text-primary font-semibold",
              )}
            >
              {item.value}
            </div>
          </div>
        ))}
      </CardContent>
    </DetailCard>
  );

  // Helper function to render info card using existing InfoSection
  const renderInfoCard = (config: InfoCardConfig) => (
    <DetailCard variant="default" key="info-card">
      <CardHeader>
        <CardTitle className="text-lg">{config.title}</CardTitle>
        {config.description && (
          <CardDescription>{config.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <InfoSection
          items={config.items}
          variant={config.variant}
          columns={config.columns}
        />
      </CardContent>
    </DetailCard>
  );

  // Helper function to render custom card
  const renderCustomCard = (config: CustomCardConfig) => (
    <div key={config.id}>{config.content}</div>
  );

  // Helper function to render any sidebar card
  const renderSidebarCard = (card: SidebarCard) => {
    switch (card.type) {
      case "score":
        return renderScoreCard(card.config);
      case "stats":
        return renderStatsCard(card.config);
      case "info":
        return renderInfoCard(card.config);
      case "custom":
        return renderCustomCard(card.config);
      default:
        return null;
    }
  };

  // Build sidebar configuration (handle legacy props)
  const effectiveSidebarConfig: SidebarConfig = sidebarConfig || {};

  // Convert legacy props to new format
  const legacyCards: SidebarCard[] = [];
  if (scoreCard) {
    legacyCards.push({ type: "score", config: scoreCard });
  }
  if (statsCard) {
    legacyCards.push({ type: "stats", config: statsCard });
  }

  // Combine legacy and new cards
  const allCards = [...legacyCards, ...(effectiveSidebarConfig.cards || [])];

  // Sort cards by priority if specified
  const sortedCards = allCards.sort((a, b) => {
    const aPriority =
      (a.type === "custom" ? a.config.priority : undefined) || 0;
    const bPriority =
      (b.type === "custom" ? b.config.priority : undefined) || 0;
    return bPriority - aPriority; // Higher priority first
  });

  // Build sidebar sections based on order
  type SidebarSectionKey = "cards" | "metadata" | "quickActions";

  const defaultOrder: SidebarSectionKey[] = [
    "cards",
    "metadata",
    "quickActions",
  ];
  const sectionOrder: SidebarSectionKey[] =
    effectiveSidebarConfig.order ?? defaultOrder;

  const cardSections = sortedCards
    .map(renderSidebarCard)
    .filter(
      (card): card is NonNullable<ReturnType<typeof renderSidebarCard>> =>
        card !== null,
    );

  const sidebarSections: Record<
    SidebarSectionKey,
    ReactNode | ReactNode[] | null
  > = {
    cards: cardSections,
    metadata:
      metadata.length > 0 ? (
        <DetailCard variant="default" className="p-0" key="metadata">
          <div className="p-6">
            <SectionHeader title="Details" variant="compact" className="mb-4" />
            <InfoSection
              items={metadata.map((item) => ({
                label: item.label,
                value: item.value,
                icon: item.icon,
                copyable: item.copyable,
                href: item.href,
                description: item.description,
              }))}
              variant="compact"
              columns={1}
            />
          </div>
        </DetailCard>
      ) : null,
    quickActions:
      quickActions.length > 0 ? (
        <DetailCard variant="default" className="p-0" key="quickActions">
          <div className="p-6">
            <SectionHeader
              title="Quick Actions"
              variant="compact"
              className="mb-4"
            />
            <div className="space-y-3">
              {quickActions.map((action) => (
                <Tooltip key={`${action.label}-${action.label}`}>
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
            </div>
          </div>
        </DetailCard>
      ) : null,
  };

  // Build final sidebar content based on order
  const orderedSidebarContent = sectionOrder.flatMap((sectionKey) => {
    const content = sidebarSections[sectionKey];

    if (Array.isArray(content)) {
      return content;
    }

    return content ? [content] : [];
  });

  // Check if we have any sidebar content
  const hasSidebarContent = orderedSidebarContent.length > 0 || sidebar;

  // Dynamically adjust layout based on content
  const effectiveLayout =
    hasSidebarContent && layout !== "no-sidebar" ? layout : "no-sidebar";
  // Error state
  if (error) {
    const errorMessage = typeof error === "string" ? error : error.message;
    return (
      <DetailPage title="Error" description="Failed to load details">
        <DetailCard variant="warning" className="text-center">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                {errorMessage ||
                  "Something went wrong while loading the details."}
              </p>
              {backUrl && (
                <Button asChild variant="outline">
                  <Link href={backUrl as Route}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {backLabel}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </DetailCard>
      </DetailPage>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <DetailPage
        title={loadingMessage}
        description="Please wait while we load the details..."
      >
        <DetailPageSkeleton
          showSidebar={layout !== "no-sidebar"}
          sections={3}
        />
      </DetailPage>
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
                    <Link href={prevItem.href as Route}>
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
                    <Link href={nextItem.href as Route}>
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
          <Link href={backUrl as Route}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {backLabel}
          </Link>
        </Button>
      )}
    </div>
  );

  // Enhanced layout calculation functions
  const getLayoutConfig = (): DetailLayoutConfig => ({
    sidebar: effectiveLayout === "no-sidebar" ? "none" : sidebarWidth,
    content: contentWidth,
    spacing,
    responsive,
  });

  const getGridClasses = () => {
    const config = getLayoutConfig();
    const baseClasses = ["grid", "gap-8"];

    if (config.sidebar === "none" || effectiveLayout === "no-sidebar") {
      baseClasses.push("grid-cols-1");
    } else if (effectiveLayout === "full-width") {
      baseClasses.push("grid-cols-1");
    } else {
      // Responsive grid with sidebar
      baseClasses.push("grid-cols-1", "lg:grid-cols-12");

      if (config.spacing === "compact") {
        baseClasses[baseClasses.length - 1] = "lg:grid-cols-12 lg:gap-6";
      } else if (config.spacing === "relaxed") {
        baseClasses[baseClasses.length - 1] = "lg:grid-cols-12 lg:gap-10";
      }
    }

    return baseClasses.join(" ");
  };

  const getSidebarClasses = () => {
    const config = getLayoutConfig();

    if (
      config.sidebar === "none" ||
      effectiveLayout === "no-sidebar" ||
      effectiveLayout === "full-width" ||
      !hasSidebarContent
    ) {
      return "hidden";
    }

    const baseClasses = ["space-y-6"];

    switch (config.sidebar) {
      case "sm":
        baseClasses.push("lg:col-span-3", "xl:col-span-2");
        break;
      case "lg":
        baseClasses.push("lg:col-span-5", "xl:col-span-4");
        break;
      default: // "md"
        baseClasses.push("lg:col-span-4", "xl:col-span-3");
        break;
    }

    if (config.spacing === "compact") baseClasses.push("space-y-4");
    else if (config.spacing === "relaxed") baseClasses.push("space-y-8");

    return baseClasses.join(" ");
  };

  const getContentClasses = () => {
    const config = getLayoutConfig();
    const baseClasses = ["space-y-8"];

    if (
      effectiveLayout === "full-width" ||
      effectiveLayout === "no-sidebar" ||
      !hasSidebarContent
    ) {
      baseClasses.push("col-span-1");
    } else {
      // Calculate content columns based on sidebar width
      switch (config.sidebar) {
        case "sm":
          baseClasses.push("lg:col-span-9", "xl:col-span-10");
          break;
        case "lg":
          baseClasses.push("lg:col-span-7", "xl:col-span-8");
          break;
        default: // "md"
          baseClasses.push("lg:col-span-8", "xl:col-span-9");
          break;
      }
    }

    if (config.spacing === "compact") baseClasses[0] = "space-y-6";
    else if (config.spacing === "relaxed") baseClasses[0] = "space-y-10";

    return baseClasses.join(" ");
  };

  return (
    <TooltipProvider>
      <DetailPage
        title={title}
        status={
          status ? (
            <Badge variant={statusVariant} className="shrink-0">
              {status}
            </Badge>
          ) : undefined
        }
        actions={pageActions}
      >
        <div className="space-y-6">
          {/* Main content area */}
          <div className={getGridClasses()}>
            {/* Main content */}
            <div className={cn(getContentClasses(), contentClassName)}>
              {children}
            </div>

            {/* Sidebar */}
            <div className={cn(getSidebarClasses(), sidebarClassName)}>
              {/* Flexible sidebar content */}
              {orderedSidebarContent}

              {/* Legacy custom sidebar content */}
              {sidebar}
            </div>
          </div>
        </div>
      </DetailPage>
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
  ScoreCardConfig,
  StatsCardConfig,
  InfoCardConfig,
  CustomCardConfig,
  SidebarCard,
  SidebarConfig,
};

// Re-export grid components for convenience
export {
  DetailGrid,
  DetailGridItem,
  FourColumnGrid,
  SixColumnGrid,
  ThreeColumnGrid,
  TwoColumnGrid,
} from "@/components/ui/detail-grid";

// Enhanced wrapper variants for common use cases
export const NarrowDetailWrapper = (props: NarrowDetailWrapperProps) => (
  <DetailPageWrapper {...props} contentWidth="narrow" layout="default" />
);

export const WideDetailWrapper = (props: WideDetailWrapperProps) => (
  <DetailPageWrapper {...props} contentWidth="wide" layout="default" />
);

export const FullWidthDetailWrapper = (props: FullWidthDetailWrapperProps) => (
  <DetailPageWrapper {...props} layout="full-width" />
);

export const CompactDetailWrapper = (props: CompactDetailWrapperProps) => (
  <DetailPageWrapper {...props} spacing="compact" />
);
