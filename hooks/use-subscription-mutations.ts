import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { subscriptionQueries } from "@/lib/query-keys";
import { retryTransient } from "@/lib/retry/transient-retry";
import type { BillingPeriod } from "@/types/subscription";

/**
 * Hook to access all subscription-related mutations.
 * Centralizes TanStack Query usage for upgrading, downgrading, and cancelling.
 */
export function useSubscriptionMutations() {
  const queryClient = useQueryClient();

  // Invalidate all related queries to ensuring data is fresh after mutation
  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: subscriptionQueries.all() }),
    ]);
  };

  /**
   * Upgrade to a new subscription plan
   */
  const upgradeMutation = useMutation({
    mutationFn: async ({
      planId,
      billingPeriod,
    }: {
      planId: string;
      billingPeriod?: BillingPeriod;
    }) => {
      return retryTransient(
        () =>
          apiClient.subscriptions.upgradeSubscription(planId, billingPeriod),
        { maxAttempts: 3, baseDelayMs: 500, maxDelayMs: 4000 },
      );
    },
    onSuccess: async () => {
      await invalidateAll();
    },
  });

  /**
   * Downgrade to a new subscription plan
   */
  const downgradeMutation = useMutation({
    mutationFn: async ({
      planId,
      billingPeriod,
    }: {
      planId: string;
      billingPeriod?: BillingPeriod;
    }) => {
      return retryTransient(
        () =>
          apiClient.subscriptions.downgradeSubscription(planId, billingPeriod),
        { maxAttempts: 3, baseDelayMs: 500, maxDelayMs: 4000 },
      );
    },
    onSuccess: async () => {
      await invalidateAll();
    },
  });

  /**
   * Cancel current subscription
   */
  const cancelMutation = useMutation({
    mutationFn: async (
      args: { reason?: string; cancelImmediately?: boolean } = {},
    ) => {
      const { reason, cancelImmediately } = args;
      return retryTransient(
        () =>
          apiClient.subscriptions.cancelSubscription(
            reason,
            cancelImmediately ?? false,
          ),
        { maxAttempts: 3, baseDelayMs: 500, maxDelayMs: 4000 },
      );
    },
    onSuccess: async () => {
      await invalidateAll();
    },
  });

  return {
    // Actions (Mutation objects)
    upgradeSubscription: upgradeMutation,
    downgradeSubscription: downgradeMutation,
    cancelSubscription: cancelMutation,

    // Mutation status helper
    isPending:
      upgradeMutation.isPending ||
      downgradeMutation.isPending ||
      cancelMutation.isPending,
  };
}
