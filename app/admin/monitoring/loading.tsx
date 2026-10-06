import { PageSkeleton } from "@/components/layouts";

/**
 * Admin monitoring page loading state
 */
export default function MonitoringLoading() {
  return <PageSkeleton stats={4} />;
}
