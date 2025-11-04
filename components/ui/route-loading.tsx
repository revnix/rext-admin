import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { PageLayout } from "../page-layout";

/**
 * Reusable Route Loading Component
 *
 * A centralized loading UI component that can be used across all route segments.
 * Provides different loading skeletons based on the page type.
 *
 * @example
 * // Simple table loading
 * import { RouteLoading } from "@/components/ui/route-loading"
 * export default function Loading() {
 *   return <RouteLoading variant="table" rows={15} columns={7} />
 * }
 *
 * @example
 * // Dashboard with stats cards
 * export default function Loading() {
 *   return <RouteLoading variant="dashboard" />
 * }
 */

export interface RouteLoadingProps {
  /** The type of loading skeleton to display */
  variant:
    | "spinner"
    | "table"
    | "dashboard"
    | "workspace"
    | "list"
    | "grid"
    | "form"
    | "monitoring"
    | "settings";
  /** Number of rows (for table/list variants) */
  rows?: number;
  /** Number of columns (for table variant) */
  columns?: number;
  /** Number of stat cards (for dashboard/workspace/monitoring variants) */
  statCards?: number;
  /** Additional CSS classes */
  className?: string;
  title?: string;
}

export function RouteLoading({
  variant,
  rows = 5,
  columns = 6,
  statCards = 4,
  className = "",
  title = "",
}: RouteLoadingProps) {
  // Simple spinner for root-level or fast transitions
  if (variant === "spinner") {
    return (
      <PageLayout title={title}>
        <div
          className={`flex h-screen items-center justify-center ${className}`}
        >
          <div className="space-y-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Table skeleton for admin/data-heavy pages
  if (variant === "table") {
    return (
      <PageLayout title={title}>
        <div className={`container mx-auto p-6 ${className}`}>
          <TableSkeleton rows={rows} columns={columns} />
        </div>
      </PageLayout>
    );
  }

  // Dashboard skeleton with stats cards and charts
  if (variant === "dashboard") {
    return (
      <PageLayout title={title}>
        <div className={`container mx-auto p-6 space-y-6 ${className}`}>
          {/* Page header */}
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }, (_, i) => i).map((i) => (
              <Card key={`dashboard-stat-${i}`}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-3 w-20 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main chart */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>

          {/* Recent activity */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 5 }, (_, i) => i).map((i) => (
                <div
                  key={`dashboard-activity-${i}`}
                  className="flex items-center gap-4"
                >
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  // Workspace overview skeleton
  if (variant === "workspace") {
    return (
      <PageLayout title={title}>
        <div className={`container mx-auto p-6 space-y-6 ${className}`}>
          {/* Page header */}
          <div className="space-y-2">
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-4 w-96" />
          </div>

          {/* Stats cards */}
          <div
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4`}
          >
            {Array.from({ length: statCards }, (_, i) => i).map((i) => (
              <Card key={`workspace-stat-${i}`}>
                <CardHeader>
                  <Skeleton className="h-4 w-28" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent activity */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 4 }, (_, i) => i).map((i) => (
                <div
                  key={`workspace-activity-${i}`}
                  className="flex items-start gap-3"
                >
                  <Skeleton className="h-8 w-8 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  // List skeleton for content pages
  if (variant === "list") {
    return (
      <PageLayout title={title}>
        <div className={`container mx-auto p-6 ${className}`}>
          <div className="space-y-4">
            {/* Search and filters */}
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 flex-1 max-w-md" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
            </div>

            {/* List items */}
            <div className="space-y-3">
              {Array.from({ length: rows }, (_, i) => i).map((i) => (
                <div
                  key={`list-item-${i}`}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                    <Skeleton className="h-8 w-20 rounded-full" />
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4">
              <Skeleton className="h-4 w-40" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Grid skeleton for knowledge/topics pages
  if (variant === "grid") {
    return (
      <PageLayout title={title}>
        <div className={`container mx-auto p-6 space-y-6 ${className}`}>
          {/* Tabs/header */}
          <div className="flex gap-2 border-b">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Search and actions */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 flex-1 max-w-md" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-28" />
          </div>

          {/* Grid items */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }, (_, i) => i).map((i) => (
              <div
                key={`grid-item-${i}`}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-3/5" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }

  // Form skeleton for settings pages
  if (variant === "form" || variant === "settings") {
    return (
      <PageLayout title={title}>
        <div
          className={`container mx-auto p-6 max-w-4xl space-y-6 ${className}`}
        >
          {/* Page header */}
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>

          {/* Settings form */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Form fields */}
              {Array.from({ length: 4 }, (_, i) => i).map((i) => (
                <div key={`form-field-${i}`} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-3 w-64" />
                </div>
              ))}

              {/* Save button */}
              <div className="flex justify-end gap-2 pt-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
              </div>
            </CardContent>
          </Card>

          {/* Additional settings section */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }, (_, i) => i).map((i) => (
                <div
                  key={`settings-option-${i}`}
                  className="flex items-center justify-between py-2"
                >
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  // Monitoring dashboard skeleton
  if (variant === "monitoring") {
    return (
      <PageLayout title={title}>
        <div className={`container mx-auto p-6 space-y-6 ${className}`}>
          {/* Health status cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: statCards }, (_, i) => i).map((i) => (
              <Card key={`monitoring-stat-${i}`}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-3 w-20 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs skeleton */}
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Main chart */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[400px] w-full" />
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  // Fallback to spinner if variant not recognized
  return (
    <PageLayout title={title}>
      <div className={`flex h-screen items-center justify-center ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </PageLayout>
  );
}
