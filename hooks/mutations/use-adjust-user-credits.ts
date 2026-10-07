/**
 * A super admin adds, deducts or resets a user's credits (FB2.28). A success toasts what was
 * really done and the balance it left, then reads the user's credits again, and the signed-in
 * person's own in case they are the same account. A failure is rethrown without a toast: the form
 * puts the backend's messages beside its fields.
 *
 * @module hooks/mutations/use-adjust-user-credits
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import type {
  AdminCreditAdjustmentRequest,
  AdminCreditAdjustmentResult,
} from "@/lib/api-client/admin-credits";
import { adjustmentOutcome } from "@/lib/billing/credit-adjustments";
import { creditKeys } from "@/lib/query-keys";

/** Whose credits change, as the toast names them, and the change. */
export interface CreditAdjustmentVariables {
  user: { id: string; email: string };
  body: AdminCreditAdjustmentRequest;
}

export function useAdjustUserCredits() {
  const queryClient = useQueryClient();

  return useMutation<
    AdminCreditAdjustmentResult,
    Error,
    CreditAdjustmentVariables
  >({
    mutationKey: [...creditKeys.adminAll(), "adjust"],
    mutationFn: ({ user, body }) =>
      apiClient.adminCredits.adjust(user.id, body),
    onSuccess: async (result, { user }) => {
      const { title, description } = adjustmentOutcome(result, user.email);
      toast.success(title, { description });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: creditKeys.adminUser(user.id),
        }),
        queryClient.invalidateQueries({ queryKey: creditKeys.mine() }),
      ]);
    },
  });
}
