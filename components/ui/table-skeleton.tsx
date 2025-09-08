import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  rows?: number;
  showHeader?: boolean;
}

/**
 * Skeleton component for data table loading states
 * Provides a realistic preview of the table structure while data loads
 */
export function TableSkeleton({
  rows = 5,
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
            <div className="grid grid-cols-8 gap-4 pb-2 border-b">
              <Skeleton className="h-4" /> {/* Idea Name */}
              <Skeleton className="h-4" /> {/* Category */}
              <Skeleton className="h-4" /> {/* Content Type */}
              <Skeleton className="h-4" /> {/* Status */}
              <Skeleton className="h-4" /> {/* Score */}
              <Skeleton className="h-4" /> {/* Priority */}
              <Skeleton className="h-4" /> {/* Rank */}
              <Skeleton className="h-4" /> {/* Updated */}
            </div>
          )}

          {/* Row skeletons */}
          {Array.from({ length: rows }, (_, i) => i).map((rowIndex) => (
            <div
              key={`skeleton-row-${rowIndex}`}
              className="grid grid-cols-8 gap-4 py-3"
            >
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-6 w-full rounded-full" />
              <Skeleton className="h-6 w-full rounded-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-6 w-full rounded-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
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
