import { useQuery } from "@tanstack/react-query";
import { subscriptionQueries } from "@/lib/query-keys";

/**
 * Hook to access all subscription-related server state.
 * Centralizes TanStack Query usage for subscription, usage, plans, and invoices.
 */
export function useSubscriptionData() {
  const subscriptionQuery = useQuery(subscriptionQueries.current());
  const usageQuery = useQuery(subscriptionQueries.usage());
  const plansQuery = useQuery(subscriptionQueries.plans());
  const invoicesQuery = useQuery(subscriptionQueries.invoices());

  // Helper to refetch all subscription-related data
  const refetchAll = async () => {
    await Promise.all([
      subscriptionQuery.refetch(),
      usageQuery.refetch(),
      plansQuery.refetch(),
      invoicesQuery.refetch(),
    ]);
  };

  return {
    // Data
    subscription: subscriptionQuery.data ?? null,
    usage: usageQuery.data ?? null,
    plans: plansQuery.data?.plans ?? [],
    invoices: invoicesQuery.data?.invoices ?? [],

    // Loading states
    isLoading:
      subscriptionQuery.isLoading ||
      usageQuery.isLoading ||
      plansQuery.isLoading ||
      invoicesQuery.isLoading,

    // Fetching states (for background refreshes)
    isFetching:
      subscriptionQuery.isFetching ||
      usageQuery.isFetching ||
      plansQuery.isFetching ||
      invoicesQuery.isFetching,

    // Errors
    error:
      subscriptionQuery.error ||
      usageQuery.error ||
      plansQuery.error ||
      invoicesQuery.error,

    // Actions
    refetchAll,

    // Individual query objects for advanced use cases
    queries: {
      subscription: subscriptionQuery,
      usage: usageQuery,
      plans: plansQuery,
      invoices: invoicesQuery,
    },
  };
}
