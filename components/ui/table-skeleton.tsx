import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

/**
 * Skeleton component for data table loading states
 * Provides a realistic preview of the table structure while data loads
 */
export function TableSkeleton({
  rows = 5,
  columns = 8,
  showHeader = true,
}: TableSkeletonProps) {
  return (
    <div className="space-y-4">
      {/* Search and actions skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-[300px]" /> {/* Search input */}
        <Skeleton className="h-10 w-[120px]" /> {/* Action button */}
      </div>

      {/* Table container */}
      <div className="rounded-md border">
        <div className="p-4 space-y-3">
          {/* Header skeleton */}
          {showHeader && (
            <div
              className={`grid gap-4 pb-2 border-b`}
              style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
            >
              {Array.from({ length: columns }, (_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton grid doesn't reorder
                <Skeleton key={`header-col-${i}`} className="h-4" />
              ))}
            </div>
          )}

          {/* Row skeletons */}
          {Array.from({ length: rows }, (_, i) => i).map((rowIndex) => (
            <div
              key={`skeleton-row-${rowIndex}`}
              className={`grid gap-4 py-3`}
              style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
            >
              {Array.from({ length: columns }, (_, colIndex) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton grid doesn't reorder
                <div key={`row-${rowIndex}-col-${colIndex}`}>
                  {colIndex === 0 ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  ) : (
                    <Skeleton
                      className={`h-4 w-full ${colIndex % 3 === 0 ? "rounded-full" : ""}`}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Pagination skeleton */}
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <Skeleton className="h-4 w-[200px]" /> {/* Items count */}
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-[80px]" /> {/* Previous */}
            <Skeleton className="h-8 w-[80px]" /> {/* Next */}
          </div>
        </div>
      </div>
    </div>
  );
}
