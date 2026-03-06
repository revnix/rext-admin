import { z } from "zod";
export const DEACTIVATION_CONFIRM_TEXT = "DEACTIVATE" as const;

export const dataExportSchema = z
  .object({
    include_profile: z.boolean(),
    include_roles: z.boolean(),
    include_workspaces: z.boolean(),
    include_activity: z.boolean(),
    include_billing: z.boolean(),
    include_usage: z.boolean(),
  })
  .refine((value) => Object.values(value).some(Boolean), {
    message: "Select at least one category to export",
    path: ["include_profile"],
  });

export type DataExportFormValues = z.infer<typeof dataExportSchema>;

export const defaultDataExportValues: DataExportFormValues = {
  include_profile: true,
  include_roles: true,
  include_workspaces: true,
  include_activity: true,
  include_billing: true,
  include_usage: true,
};

export interface DeactivateAccountFormValues {
  reason: string;
  confirm_text: string;
  password: string;
  understood: boolean;
  cancel_subscriptions: boolean;
}

export function createDeactivateAccountSchema(hasActiveSubscriptions: boolean) {
  return z
    .object({
      reason: z
        .string()
        .trim()
        .max(500, "Reason must be 500 characters or fewer"),
      confirm_text: z
        .string()
        .trim()
        .refine((value) => value === DEACTIVATION_CONFIRM_TEXT, {
          message: `Type ${DEACTIVATION_CONFIRM_TEXT} to continue`,
        }),
      password: z.string().min(1, "Current password is required"),
      understood: z.boolean().refine((val) => val === true, {
        message: "You must confirm that you understand this action",
      }),
      cancel_subscriptions: z.boolean(),
    })
    .superRefine((data, ctx) => {
      if (hasActiveSubscriptions && !data.cancel_subscriptions) {
        ctx.addIssue({
          code: "custom",
          path: ["cancel_subscriptions"],
          message:
            "You must confirm subscription cancellation before deactivation",
        });
      }
    });
}
