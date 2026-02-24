import { z } from "zod";

/**
 * Zod Validation Schemas for Workspace Management
 *
 * These schemas validate workspace forms, API requests, and responses.
 * Based on backend requirements and constraints defined in types/workspace.ts
 */

// URL validation schema with proper HTTP/HTTPS checking
const urlSchema = z
  .string()
  .min(1, "Website URL is required")
  .url("Please enter a valid URL")
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    },
    {
      message: "URL must start with http:// or https://",
    },
  );

// Timezone validation schema with IANA timezone support
const timezoneSchema = z
  .string()
  .optional()
  .refine(
    (tz) => !tz || Intl.supportedValuesOf("timeZone").includes(tz),
    "Please select a valid timezone",
  );

// Main workspace form validation schema
export const workspaceFormSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must be 200 characters or less")
    .trim(),

  url: urlSchema,

  timezone: timezoneSchema,
});

// Create workspace API request schema
export const createWorkspaceRequestSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  url: urlSchema,
  timezone: timezoneSchema,
});

// Update workspace API request schema
export const updateWorkspaceRequestSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  url: urlSchema.optional(),
  timezone: timezoneSchema,
});

export const workspaceSettingsSchema = z.object({
  name: z
    .string()
    .min(1, "Workspace name is required")
    .max(200, "Title must be 200 characters or less")
    .trim(),
  title: z
    .string()
    .min(1, "Workspace name is required")
    .max(200, "Title must be 200 characters or less")
    .trim(),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(50)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens",
    ),
  url: urlSchema.optional().or(z.literal("")),
});

export type WorkspaceSettingsFormData = z.infer<typeof workspaceSettingsSchema>;

// Type inference for forms
export type WorkspaceFormData = z.infer<typeof workspaceFormSchema>;
export type CreateWorkspaceRequest = z.infer<
  typeof createWorkspaceRequestSchema
>;
export type UpdateWorkspaceRequest = z.infer<
  typeof updateWorkspaceRequestSchema
>;

// Form validation constants
export const WORKSPACE_VALIDATION = {
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 200,
} as const;

/**
 * Workspace analytics schema (nested under 'analytics' key)
 */
export const workspaceAnalyticsSchema = z.object({
  knowledge_counts: z.object({
    web_knowledge: z.number(),
    files: z.number(),
    text_knowledge: z.number(),
    total_knowledge_items: z.number(),
  }),
  content_metrics: z.object({
    total_words: z.number(),
    web_content_words: z.number(),
    file_content_words: z.number(),
    avg_web_article_words: z.number(),
    avg_file_words: z.number(),
    estimated_reading_time_minutes: z.number(),
  }),
  team_metrics: z.object({
    total_members: z.number(),
  }),
});

/**
 * Brand voice schema for workspace response
 */
export const brandVoiceSchema = z.object({
  id: z.string().optional(),
  workspace_id: z.string(),
  about: z.string().optional(),
  customer_profile: z.string().optional(),
  selling_position: z.string().optional(),
  target_audience: z.array(z.string()).optional(),
  brand_voice: z.array(z.string()).optional(),
  competitors: z.array(z.string()).optional(),
  content_pillar: z.array(z.string()).optional(),
  personas: z.array(z.object({
    id: z.string().optional(),
    name: z.string(),
    description: z.string(),
    full_name: z.string().nullable().optional(),
    professional_title: z.string().nullable().optional(),
    areas_of_expertise: z.string().optional(),
    tone_of_voice: z.string().optional(),
    bio: z.string().optional(),
    linkedin_url: z.string().nullable().optional(),
    demographics: z.string().optional(),
    pain_points: z.string().optional(),
    goals: z.string().optional(),
    behaviors: z.string().optional(),
  })).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

/**
 * Core workspace schema matching backend WorkspaceModel response
 */
export const workspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  timezone: z.string().optional(),
  url: z.string(),
  created_at: z.string(),
  updated_at: z.string().optional(),
  brand_voice: brandVoiceSchema.optional(),
  analytics: workspaceAnalyticsSchema.optional(),
  members_count: z.number().optional(),
  content_count: z.number().optional(),
});

/**
 * Single workspace API response
 */
export const workspaceResponseSchema = z.object({
  workspace: workspaceSchema,
});

/**
 * Workspace list API response
 */
export const workspaceListResponseSchema = z.object({
  workspaces: z.array(workspaceSchema),
  total: z.number().optional(),
  total_count: z.number().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

/**
 * Create workspace API response (includes operation_id for SSE tracking)
 */
export const createWorkspaceResponseSchema = z.object({
  workspace: workspaceSchema,
  operation_id: z.string(),
  message: z.string().optional(),
});

/**
 * Workspace permissions API response
 */
export const workspacePermissionsResponseSchema = z.object({
  workspace_id: z.string(),
  workspace_slug: z.string(),
  user_role: z.string(),
  permissions: z.array(z.string()),
});

// Type inference for responses
export type WorkspaceSchemaType = z.infer<typeof workspaceSchema>;
export type WorkspaceResponseSchemaType = z.infer<typeof workspaceResponseSchema>;
export type WorkspaceListResponseSchemaType = z.infer<typeof workspaceListResponseSchema>;
export type CreateWorkspaceResponseSchemaType = z.infer<typeof createWorkspaceResponseSchema>;