"use client";

import { AlertTriangle, FileQuestion, Inbox, Search } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

type IllustrationType = "no-data" | "search" | "error" | "custom";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  };
  illustration?: IllustrationType;
}

/**
 * Standard empty state component for consistent empty/no-results displays
 *
 * @example
 * ```tsx
 * // No content yet
 * <EmptyState
 *   illustration="no-data"
 *   title="No content yet"
 *   description="Get started by creating your first piece of content."
 *   action={{
 *     label: "Create Content",
 *     href: "/content/new"
 *   }}
 * />
 *
 * // Search no results
 * <EmptyState
 *   illustration="search"
 *   title="No results found"
 *   description="Try adjusting your search or filters."
 *   action={{
 *     label: "Clear Filters",
 *     onClick: clearFilters
 *   }}
 * />
 * ```
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  illustration = "no-data",
}: EmptyStateProps) {
  const getDefaultIllustration = (type: IllustrationType): ReactNode => {
    const iconClassName = "h-8 w-8 text-muted-foreground";

    switch (type) {
      case "no-data":
        return <Inbox className={iconClassName} />;
      case "search":
        return <Search className={iconClassName} />;
      case "error":
        return <AlertTriangle className={iconClassName} />;
      default:
        return <FileQuestion className={iconClassName} />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Icon/Illustration */}
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        {icon || getDefaultIllustration(illustration)}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>

      {/* Description */}
      <p className="text-muted-foreground mb-6 max-w-md text-sm">
        {description}
      </p>

      {/* Action Button */}
      {action && (
        <Button
          variant={action.variant || "default"}
          onClick={action.onClick}
          asChild={!!action.href}
        >
          {action.href ? (
            <Link href={action.href}>{action.label}</Link>
          ) : (
            <span>{action.label}</span>
          )}
        </Button>
      )}
    </div>
  );
}

/**
 * Empty state specifically for search/filter no results
 */
export function SearchEmptyState({ onClear }: { onClear?: () => void }) {
  return (
    <EmptyState
      illustration="search"
      title="No results found"
      description="Try adjusting your search terms or filters to find what you're looking for."
      action={
        onClear
          ? {
              label: "Clear Filters",
              onClick: onClear,
              variant: "outline",
            }
          : undefined
      }
    />
  );
}

/**
 * Empty state specifically for error conditions
 */
export function ErrorEmptyState({
  error,
  onRetry,
}: {
  error?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      illustration="error"
      title="Failed to load data"
      description={
        error || "There was an error loading the content. Please try again."
      }
      action={
        onRetry
          ? {
              label: "Retry",
              onClick: onRetry,
              variant: "outline",
            }
          : undefined
      }
    />
  );
}

/**
 * Empty state for data that hasn't been created yet
 */
export function NoDataEmptyState({
  title = "No data available",
  description = "Get started by adding your first item.",
  actionLabel,
  actionHref,
  actionOnClick,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  actionOnClick?: () => void;
}) {
  return (
    <EmptyState
      illustration="no-data"
      title={title}
      description={description}
      action={
        actionLabel
          ? {
              label: actionLabel,
              href: actionHref,
              onClick: actionOnClick,
            }
          : undefined
      }
    />
  );
}
