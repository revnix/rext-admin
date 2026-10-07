import { PageSkeleton } from "@/components/layouts";

/**
 * Admin subscriptions page loading state
 */
export default function SubscriptionsLoading() {
  return <PageSkeleton rows={12} stats={4} />;
}
