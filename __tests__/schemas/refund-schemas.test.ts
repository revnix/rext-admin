/**
 * A refund request's reason (F7): required, trimmed, and within the backend's 2,000 characters.
 */

import {
  REFUND_REASON_MAX,
  refundRequestSchema,
} from "@/schemas/refund-schemas";

describe("refundRequestSchema", () => {
  it("trims the reason", () => {
    expect(refundRequestSchema.parse({ reason: "  Not for me \n" })).toEqual({
      reason: "Not for me",
    });
  });

  it.each([
    ["an empty reason", ""],
    ["spaces only", "   "],
    ["a reason past the limit", "x".repeat(REFUND_REASON_MAX + 1)],
  ])("refuses %s", (_case, reason) => {
    expect(refundRequestSchema.safeParse({ reason }).success).toBe(false);
  });
});
