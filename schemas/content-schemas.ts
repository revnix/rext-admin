import { z } from "zod";

// Enhanced input validation with Zod v4.1.5 performance optimizations
export const GenerateContentRequestSchema = z.object({
  prompt: z
    .string()
    .min(1, "Prompt is required")
    .max(2000, "Prompt must be less than 2000 characters")
    .refine(
      (val) => {
        // Sanitize and validate content
        const sanitized = val.trim();
        return sanitized.length > 0 && !containsUnsafeContent(sanitized);
      },
      { message: "Prompt contains invalid content" },
    ),

  model: z.enum(["claude-3-5-sonnet", "gpt-4o", "gpt-4o-mini"], {
    message: "Invalid model selection",
  }),

  options: z
    .object({
      temperature: z
        .number()
        .min(0, "Temperature must be between 0 and 2")
        .max(2, "Temperature must be between 0 and 2")
        .optional(),
      maxTokens: z
        .number()
        .min(1, "Max tokens must be at least 1")
        .max(4000, "Max tokens cannot exceed 4000")
        .optional(),
      topP: z
        .number()
        .min(0, "Top P must be between 0 and 1")
        .max(1, "Top P must be between 0 and 1")
        .optional(),
    })
    .optional(),

  metadata: z
    .object({
      userId: z.string().uuid().optional(),
      sessionId: z.string().uuid().optional(),
      source: z.enum(["web", "api", "mobile"]).optional(),
    })
    .optional(),
});

// Content sanitization utility
function containsUnsafeContent(content: string): boolean {
  const unsafePatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi,
  ];

  return unsafePatterns.some((pattern) => pattern.test(content));
}

// Topic validation schema
export const TopicSchema = z.object({
  id: z.string().uuid(),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters")
    .refine((val) => val.trim().length > 0, "Title cannot be only whitespace"),

  description: z
    .string()
    .min(1, "Description is required")
    .max(1000, "Description must be less than 1000 characters"),

  tags: z
    .array(z.string().max(50))
    .max(10, "Cannot have more than 10 tags")
    .optional(),

  status: z.enum(["draft", "published", "archived"]),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type GenerateContentRequest = z.infer<
  typeof GenerateContentRequestSchema
>;
export type Topic = z.infer<typeof TopicSchema>;
