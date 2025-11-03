import { RouteLoading } from "@/components/ui/route-loading";

/**
 * Admin monitoring page loading state
 */
export default function MonitoringLoading() {
  return (
    <RouteLoading
      variant="monitoring"
      statCards={4}
      title="System Monitoring"
    />
  );
}
