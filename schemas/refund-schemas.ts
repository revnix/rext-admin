import { z } from "zod";

/** A refund request's reason; the backend keeps 2,000 characters. */
export const REFUND_REASON_MAX = 2000;

export const refundRequestSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "Tell us why you're asking for a refund")
    .max(REFUND_REASON_MAX, "Use at most 2,000 characters"),
});

export type RefundRequestFormData = z.infer<typeof refundRequestSchema>;
