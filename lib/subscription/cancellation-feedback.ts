/**
 * Cancellation Feedback Utilities
 *
 * Helpers for serializing UI-collected cancellation reasons and free-text
 * feedback into a single, backend-safe reason string.
 *
 * Backend constraint: `reason` field is capped at 500 characters.
 * @see rext-backend/src/api/schema/subscription/user_subscription_schemas.py
 */

const MAX_CANCELLATION_REASON_LENGTH = 500;

/**
 * Combines an array of selected reasons and optional free-text feedback into
 * a single string suitable for passing to the cancel subscription API.
 *
 * - Trims whitespace from every element.
 * - Filters out empty strings after trimming.
 * - Returns `undefined` when both inputs are blank (preserves optional semantics
 *   on the backend schema field).
 * - Truncates the final string to `MAX_CANCELLATION_REASON_LENGTH` (500 chars)
 *   to satisfy the backend `max_length` constraint and avoid 422 errors.
 *
 * @param reasons - Selected cancellation reason labels from the UI checkboxes
 * @param feedback - Free-text additional feedback entered by the user
 * @returns A formatted reason string, or `undefined` if no content provided
 *
 * @example
 * buildCancellationReason(["Too expensive", "Missing features"], "Need SSO")
 * // => "Reasons: Too expensive, Missing features | Feedback: Need SSO"
 *
 * @example
 * buildCancellationReason([], "")
 * // => undefined
 */
export function buildCancellationReason(
  reasons: string[],
  feedback: string,
): string | undefined {
  const normalizedReasons = reasons
    .map((reason) => reason.trim())
    .filter((reason) => reason.length > 0);

  const normalizedFeedback = feedback.trim();

  if (normalizedReasons.length === 0 && normalizedFeedback.length === 0) {
    return undefined;
  }

  const parts: string[] = [];

  if (normalizedReasons.length > 0) {
    parts.push(`Reasons: ${normalizedReasons.join(", ")}`);
  }

  if (normalizedFeedback.length > 0) {
    parts.push(`Feedback: ${normalizedFeedback}`);
  }

  return parts.join(" | ").slice(0, MAX_CANCELLATION_REASON_LENGTH);
}
