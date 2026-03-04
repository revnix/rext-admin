"use client";

import { LoadingIndicator } from "@/components/ui/loading-indicator";

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
      <LoadingIndicator variant="spinner" size="lg" message={message} />
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
    <LoadingIndicator variant="table" rows={rows} columns={columns} showHeader={true} />
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
  return <LoadingIndicator variant="card" />;
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
  return <LoadingIndicator variant="form" fields={fields} />;
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
  return <LoadingIndicator variant="spinner" size={size} />;
}
