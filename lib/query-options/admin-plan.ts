import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { adminPlanKeys } from "@/lib/query-keys";

/**
 * A user's plan as a super admin reads it (FB2.29): the subscription that grants access now, the
 * plans it may change to with what each choice leaves, and whether a trial may be extended.
 */
export const adminUserPlanQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: adminPlanKeys.user(userId),
    queryFn: () => apiClient.adminPlan.get(userId),
  });
