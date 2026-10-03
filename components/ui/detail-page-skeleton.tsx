import { Skeleton } from "@/components/ui/skeleton";

interface DetailPageSkeletonProps {
  showSidebar?: boolean;
  sections?: number;
}

/**
 * Skeleton component for detail page loading states
 * Provides a realistic preview of the detail page structure while data loads
 */
export function DetailPageSkeleton({
  showSidebar = true,
  sections = 3,
}: DetailPageSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-8 w-[60%]" /> {/* Title */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16" /> {/* Status badge */}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Skeleton className="h-9 w-24" /> {/* Action button */}
          <Skeleton className="h-9 w-20" /> {/* Action button */}
          <Skeleton className="h-9 w-9" /> {/* Icon button */}
        </div>
      </div>

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main content skeleton */}
        <div
          className={
            showSidebar ? "lg:col-span-8 xl:col-span-9" : "col-span-12"
          }
        >
          <div className="space-y-8">
            {Array.from({ length: sections }, (_, i) => i).map((i) => (
              <div
                key={`section-${i}`}
                className="bg-muted/40 rounded-md p-6 border border-border"
              >
                <div className="space-y-4">
                  {/* Section header */}
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5" /> {/* Icon */}
                    <Skeleton className="h-6 w-48" /> {/* Section title */}
                  </div>

                  {/* Section content */}
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[85%]" />
                    <Skeleton className="h-4 w-[70%]" />
                  </div>

                  {/* Additional content based on section */}
                  {i === 1 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      {Array.from({ length: 4 }, (_, j) => j).map((j) => (
                        <div
                          key={`metric-${j}`}
                          className="bg-white/80 dark:bg-background/80 rounded-md p-4 text-center"
                        >
                          <Skeleton className="h-8 w-16 mx-auto mb-2" />
                          <Skeleton className="h-3 w-20 mx-auto" />
                        </div>
                      ))}
                    </div>
                  )}

                  {i === 2 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {Array.from({ length: 6 }, (_, j) => j).map((j) => (
                        <Skeleton
                          key={`tag-${j}`}
                          className="h-8 w-20 rounded-full"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar skeleton */}
        {showSidebar && (
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="space-y-6">
              {/* Metadata card skeleton */}
              <div className="bg-white dark:bg-background rounded-md border p-6">
                <Skeleton className="h-5 w-16 mb-4" /> {/* Card title */}
                <div className="space-y-3">
                  {Array.from({ length: 6 }, (_, i) => i).map((i) => (
                    <div
                      key={`metadata-${i}`}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4" /> {/* Icon */}
                        <Skeleton className="h-4 w-20" /> {/* Label */}
                      </div>
                      <Skeleton className="h-4 w-16" /> {/* Value */}
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional sidebar cards */}
              <div className="bg-white dark:bg-background rounded-md border p-6">
                <Skeleton className="h-5 w-24 mb-4" /> {/* Card title */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-2 w-full" /> {/* Progress bar */}
                  </div>

                  {Array.from({ length: 3 }, (_, i) => i).map((i) => (
                    <div
                      key={`sidebar-item-${i}`}
                      className="flex justify-between items-center"
                    >
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-10" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
