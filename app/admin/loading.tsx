import { RouteLoading } from "@/components/ui/route-loading";

/**
 * Admin section loading state
 */
export default function AdminLoading() {
  return <RouteLoading variant="table" rows={10} columns={6}/>;
}
