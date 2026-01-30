"use client";

import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Full page loading state
 *
 * @example
 * ```tsx
 * if (isLoading) {
 *   return <PageLoader />;
 * }
 * ```
 */
export function PageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

/**
 * Table loading skeleton
 *
 * @example
 * ```tsx
 * {isLoading ? (
 *   <TableSkeleton rows={5} columns={4} />
 * ) : (
 *   <DataTable data={data} columns={columns} />
 * )}
 * ```
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <output className="space-y-3" aria-label="Loading table data">
      {/* Header row */}
      <div className="flex gap-4">
        {Array.from({ length: columns }, (_, j) => `header-col-${j}`).map(
          (key) => (
            <Skeleton key={key} className="h-10 flex-1" />
          ),
        )}
      </div>

      {/* Data rows */}
      {Array.from({ length: rows }, (_, i) => `row-${i}`).map((rowKey) => (
        <div key={rowKey} className="flex gap-4">
          {Array.from({ length: columns }, (_, j) => `${rowKey}-col-${j}`).map(
            (cellKey) => (
              <Skeleton key={cellKey} className="h-12 flex-1" />
            ),
          )}
        </div>
      ))}
    </output>
  );
}

/**
 * Card loading skeleton
 *
 * @example
 * ```tsx
 * {isLoading ? (
 *   <CardSkeleton />
 * ) : (
 *   <Card>...</Card>
 * )}
 * ```
 */
export function CardSkeleton() {
  return (
    <output aria-label="Loading card content" className="block">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-2/3 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    </output>
  );
}

/**
 * Form loading skeleton
 *
 * @example
 * ```tsx
 * {isLoading ? (
 *   <FormSkeleton fields={3} />
 * ) : (
 *   <FormPage>...</FormPage>
 * )}
 * ```
 */
export function FormSkeleton({ fields = 3 }: { fields?: number }) {
  return (
    <output className="space-y-6" aria-label="Loading form">
      {Array.from({ length: fields }, (_, i) => `form-field-${i}`).map(
        (key) => (
          <div key={key} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ),
      )}
      <div className="flex gap-3 mt-8">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </output>
  );
}

/**
 * Inline loading spinner
 *
 * @example
 * ```tsx
 * <Button disabled={isLoading}>
 *   {isLoading && <LoadingSpinner />}
 *   Save Changes
 * </Button>
 * ```
 */
export function LoadingSpinner({
  size = "default",
}: {
  size?: "sm" | "default" | "lg";
}) {
  const sizeClasses = {
    sm: "h-3 w-3",
    default: "h-4 w-4",
    lg: "h-6 w-6",
  };

  return (
    <output aria-label="Loading" className="inline-block">
      <Loader2 className={`${sizeClasses[size]} animate-spin`} />
    </output>
  );
}
