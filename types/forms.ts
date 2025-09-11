import { z } from "zod";

/**
 * Form data interface for editing topics in TopicActions component
 *
 * This interface defines the shape of form data used when editing topics
 * in the TopicActions component, following React Hook Form v7.62.0 patterns.
 */
export interface TopicEditFormData {
  /** Topic title */
  title: string;
  /** Topic angle or approach */
  angle: string;
  /** Optional detailed description */
  description?: string;
  /** Explanation of why this topic works */
  why_it_works: string;
  /** Comma-separated tags string */
  tags: string;
}

/**
 * Zod schema for topic edit form validation
 *
 * Provides runtime validation for topic edit forms with appropriate
 * error messages and field constraints.
 */
export const topicEditFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  angle: z
    .string()
    .min(1, "Angle is required")
    .max(500, "Angle must be 500 characters or less"),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or less")
    .optional()
    .or(z.literal("")),
  why_it_works: z
    .string()
    .min(1, "Why it works explanation is required")
    .max(1000, "Why it works must be 1000 characters or less"),
  tags: z
    .string()
    .min(1, "At least one tag is required")
    .refine(
      (value) => value.split(",").filter((tag) => tag.trim()).length > 0,
      "Please provide at least one valid tag",
    ),
});

/**
 * TypeScript type inferred from the Zod schema
 */
export type TopicEditFormSchema = z.infer<typeof topicEditFormSchema>;
