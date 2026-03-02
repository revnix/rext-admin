import { z } from "zod";

export const DEACTIVATION_CONFIRM_TEXT = "DEACTIVATE" as const;

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
