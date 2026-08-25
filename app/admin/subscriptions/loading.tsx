import { RouteLoading } from "@/components/ui/route-loading";

/**
 * Admin subscriptions page loading state
 */
export default function SubscriptionsLoading() {
  return (
    <RouteLoading
      variant="table"
      rows={12}
      columns={8}
      title="Subscription Management"
    />
  );
}
