import { log } from "@/lib/logger";
import type { z } from "zod";

/**
 * Validates an API response against a Zod schema.
 * Logs a warning if validation fails but returns the data as-is to avoid
 * breaking the application. This provides observability without disruption.
 *
 * @param schema - Zod schema to validate against
 * @param data - The API response data to validate
 * @param context - Description of the API call for logging
 * @returns The original data (typed via the schema)
 */
export function validateResponse<T extends z.ZodType>(
  schema: T,
  data: unknown,
  context: string,
): z.infer<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    log.warn(
      `[API Response Validation] ${context}: Response does not match expected schema`,
      {
        context,
        issues: result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    );
  }

  // Return the original data regardless of validation result
  // This prevents breaking the app while still logging mismatches
  return data as z.infer<T>;
}
