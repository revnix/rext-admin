import { RouteLoading } from "@/components/ui/route-loading";

/**
 * Admin customers page loading state
 */
export default function CustomersLoading() {
  return <RouteLoading variant="table" rows={15} columns={7} />;
}
