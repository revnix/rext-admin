/**
 * A super admin moves a user to another plan, or gives a trial a later end (FB2.29). A success
 * toasts what was done, then reads again everything the change touched: the user's plan, their
 * credits (a plan change sets the month's), the rows of Admin > Users, and the signed-in person's
 * own subscription in case they are the same account. A failure is rethrown without a toast (the
 * form shows the backend's message), and the plan is read again all the same: one refusal says
 * Lemon Squeezy has changed the plan although the change couldn't be recorded here.
 *
 * @module hooks/mutations/use-change-user-plan
 */

import {
  type QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import type {
  AdminPlanChangeRequest,
  AdminPlanChangeResult,
  AdminTrialExtensionRequest,
  AdminTrialExtensionResult,
} from "@/lib/api-client/admin-plan";
import {
  planChangeOutcome,
  trialExtensionOutcome,
} from "@/lib/billing/plan-changes";
import {
  adminPlanKeys,
  creditKeys,
  subscriptionQueries,
} from "@/lib/query-keys";

/** Whose plan changes, as the toast names them, and the change. */
export interface PlanChangeVariables {
  user: { id: string; email: string };
  body: AdminPlanChangeRequest;
}

/** Whose trial is extended, and to when. */
export interface TrialExtensionVariables {
  user: { id: string; email: string };
  body: AdminTrialExtensionRequest;
}

const readPlanAgain = (queryClient: QueryClient, userId: string) =>
  queryClient.invalidateQueries({ queryKey: adminPlanKeys.user(userId) });

const refresh = (queryClient: QueryClient, userId: string) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: adminPlanKeys.user(userId) }),
    queryClient.invalidateQueries({ queryKey: adminPlanKeys.usersList() }),
    queryClient.invalidateQueries({ queryKey: creditKeys.adminUser(userId) }),
    queryClient.invalidateQueries({ queryKey: subscriptionQueries.all() }),
  ]);

export function useChangeUserPlan() {
  const queryClient = useQueryClient();

  return useMutation<AdminPlanChangeResult, Error, PlanChangeVariables>({
    mutationKey: [...adminPlanKeys.all(), "change"],
    mutationFn: ({ user, body }) => apiClient.adminPlan.change(user.id, body),
    onSuccess: async (result, { user }) => {
      const { title, description } = planChangeOutcome(result, user.email);
      toast.success(title, { description });
      await refresh(queryClient, user.id);
    },
    onError: (_error, { user }) => void readPlanAgain(queryClient, user.id),
  });
}

export function useExtendUserTrial() {
  const queryClient = useQueryClient();

  return useMutation<AdminTrialExtensionResult, Error, TrialExtensionVariables>(
    {
      mutationKey: [...adminPlanKeys.all(), "extend-trial"],
      mutationFn: ({ user, body }) =>
        apiClient.adminPlan.extendTrial(user.id, body),
      onSuccess: async (result, { user }) => {
        const { title, description } = trialExtensionOutcome(
          result,
          user.email,
        );
        toast.success(title, { description });
        await refresh(queryClient, user.id);
      },
      onError: (_error, { user }) => void readPlanAgain(queryClient, user.id),
    },
  );
}
