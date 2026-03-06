import { LoadingIndicator } from "@/components/ui/loading-indicator";

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
    <LoadingIndicator
      variant="table"
      rows={rows}
      columns={columns}
      showHeader={showHeader}
      showFilters={true}
      showPagination={true}
    />
  );
}
