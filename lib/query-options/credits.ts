import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { creditKeys } from "@/lib/query-keys";

/**
 * A user's credits as a super admin reads them (FB2.28): what they can spend now, by where it
 * comes from, and the admin changes to it, newest first.
 */
export const adminUserCreditsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: creditKeys.adminUser(userId),
    queryFn: () => apiClient.adminCredits.get(userId),
  });

/** What Rext support changed in the signed-in person's credits, newest first. */
export const creditHistoryQueryOptions = () =>
  queryOptions({
    queryKey: creditKeys.history(),
    queryFn: () => apiClient.subscriptions.getCreditHistory(),
  });
