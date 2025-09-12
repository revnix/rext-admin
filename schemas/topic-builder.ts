import { z } from "zod";

/**
 * Zod Validation Schemas for Topic Builder
 *
 * These schemas validate API requests, form data, and responses.
 * Separate from TypeScript types for better organization.
 */

// Base enum schemas
export const wizardModeSchema = z.enum(["subject-first", "industry-first"]);

export const industrySchema = z.enum([
  "technology",
  "healthcare",
  "finance",
  "education",
  "travel",
  "food",
  "fashion",
  "business",
  "marketing",
  "science",
  "sports",
  "lifestyle",
  "government",
  "real-estate",
  "ecommerce",
  "hr",
  "legal",
  "fitness",
  "other",
]);

export const purposeTypeSchema = z.enum([
  "educate-inform",
  "entertain-engage",
  "inspire-motivate",
  "persuade-convince",
  "promote-product",
  "drive-seo",
  "thought-leadership",
  "other",
]);

// Main form data schema
export const topicBuilderFormDataSchema = z.object({
  // Wizard configuration
  wizardMode: wizardModeSchema,

  // Subject-first specific
  subject: z.string().optional(),

  // Industry/Domain
  industry: industrySchema,
  industry_other: z.string().optional(),

  // Audience and targeting
  audience: z.array(z.string()).optional(),

  // Content goals and style
  purpose: z
    .array(purposeTypeSchema)
    .min(1, "Please select at least one purpose"),
  purpose_other: z.string().optional(),

  // Advanced options
  num_topics: z.number().min(1).max(20).default(5),
});

// Generated topic schema
export const generatedTopicSchema = z.object({
  id: z.string(),
  title: z.string(),
  angle: z.string(),
  description: z.string().optional(),
  channel_fit: z.array(z.string()),
  audience_fit: z.array(z.string()),
  why_it_works: z.string(),
  scores: z.object({
    relevance: z.number().min(0).max(1),
    freshness: z.number().min(0).max(1),
    novelty: z.number().min(0).max(1),
  }),
  tags: z.array(z.string()),
  is_saved: z.boolean().optional(),
});

// API request/response schemas
export const topicGenerationRequestSchema = z.object({
  formData: topicBuilderFormDataSchema,
  timestamp: z.string().datetime(),
});

export const topicGenerationResponseSchema = z.object({
  topics: z.array(generatedTopicSchema),
  request_id: z.string(),
  generated_at: z.string().datetime(),
  model_used: z.string().optional(),
  generation_time_ms: z.number().optional(),
});

// Backend API payload schema
export const backendTopicGenerationPayloadSchema = z.object({
  industry: z.string(),
  subject: z.string().optional(),
  audience: z.array(z.string()).optional(),
  purpose: z.array(z.string()),
  num_topics: z.number().min(1).max(20),
  timestamp: z.string().datetime(),
  wizard_mode: z.string(),
});

// Form validation schemas for individual steps
export const industryStepSchema = z
  .object({
    wizardMode: wizardModeSchema,
    industry: industrySchema,
    industry_other: z.string().optional(),
    subject: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.industry === "other" && !data.industry_other?.trim()) {
        return false;
      }
      if (data.wizardMode === "subject-first" && !data.subject?.trim()) {
        return false;
      }
      return true;
    },
    {
      message:
        "Please provide the required information based on your selections",
    },
  );

export const audienceStepSchema = z.object({
  audience: z
    .array(z.string())
    .min(1, "Please select at least one audience type"),
});

export const goalsStepSchema = z.object({
  purpose: z
    .array(purposeTypeSchema)
    .min(1, "Please select at least one purpose"),
  purpose_other: z.string().optional(),
});
