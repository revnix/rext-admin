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
        if (parsed.protocol !== "https:") return false;

        const hostname = parsed.hostname;
        // Strict domain regex: supports subdomains, valid labels (hyphen in middle), and TLD (at least 2 chars)
        const domainRegex =
          /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;
        return domainRegex.test(hostname);
      } catch {
        return false;
      }
    },
    {
      message: "URL must start with https:// and contain a valid domain",
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

// Form validation constants
export const WORKSPACE_CONSTRAINTS = {
  TITLE_MIN_LENGTH: 1,
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 500,
  SLUG_MIN_LENGTH: 3,
  SLUG_MAX_LENGTH: 50,
  URL_PATTERN: /^https?:\/\/.+/,
} as const;

const workspaceNameSchema = z
  .string()
  .trim()
  .min(WORKSPACE_CONSTRAINTS.TITLE_MIN_LENGTH, "Name is required")
  .max(
    WORKSPACE_CONSTRAINTS.TITLE_MAX_LENGTH,
    `Name must be ${WORKSPACE_CONSTRAINTS.TITLE_MAX_LENGTH} characters or less`,
  )
  .refine((name) => /\p{L}/u.test(name), {
    message: "Workspace name must contain at least one letter",
  });

export const workspaceFormSchema = z.object({
  name: workspaceNameSchema,

  url: urlSchema,

  timezone: timezoneSchema,
});

export const createWorkspaceRequestSchema = z.object({
  name: workspaceNameSchema,
  title: z
    .string()
    .min(WORKSPACE_CONSTRAINTS.TITLE_MIN_LENGTH)
    .max(WORKSPACE_CONSTRAINTS.TITLE_MAX_LENGTH)
    .trim()
    .optional(),
  url: urlSchema,
  timezone: timezoneSchema,
});

export const updateWorkspaceRequestSchema = z.object({
  name: z
    .string()
    .min(WORKSPACE_CONSTRAINTS.TITLE_MIN_LENGTH)
    .max(WORKSPACE_CONSTRAINTS.TITLE_MAX_LENGTH)
    .trim()
    .optional(),
  title: z
    .string()
    .min(WORKSPACE_CONSTRAINTS.TITLE_MIN_LENGTH)
    .max(WORKSPACE_CONSTRAINTS.TITLE_MAX_LENGTH)
    .trim()
    .optional(),
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

/**
 * Workspace analytics schema (nested under 'analytics' key)
 */
export const workspaceAnalyticsSchema = z.object({
  team_metrics: z
    .object({
      total_members: z.number(),
    })
    .optional(),
});

/**
 * Brand voice schema for workspace response
 */
export const brandVoiceSchema = z.object({
  id: z.string().optional(),
  workspace_id: z.string(),
  brand_name: z.string().optional(),
  about: z.string().optional(),
  customer_profile: z.string().nullable().optional(),
  selling_position: z.string().optional(),
  target_audience: z.array(z.string()).optional(),
  brand_voice: z.array(z.string()).optional(),
  competitors: z.array(z.string()).optional(),
  content_pillar: z.array(z.string()).optional(),
  personas: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string(),
        description: z.string(),
        full_name: z.string().nullable().optional(),
        professional_title: z.string().nullable().optional(),
        areas_of_expertise: z
          .union([z.string(), z.array(z.string())])
          .optional(),
        tone_of_voice: z.string().optional(),
        bio: z.string().optional(),
        linkedin_url: z.string().nullable().optional(),
        demographics: z.string().optional(),
        pain_points: z.union([z.string(), z.array(z.string())]).optional(),
        goals: z.union([z.string(), z.array(z.string())]).optional(),
        behaviors: z.union([z.string(), z.array(z.string())]).optional(),
      }),
    )
    .optional(),
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
  // The site's favicon, kept by the backend (task G9); null until it was fetched.
  favicon_url: z.string().nullish(),
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

export const refreshBrandVoiceResponseSchema = z.object({
  operation_id: z.string(),
});

export const availableRolesResponseSchema = z.object({
  roles: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      display_name: z.string(),
      description: z.string().nullable(),
      is_system_role: z.boolean(),
      hierarchy_level: z.number(),
      created_at: z.string(),
      updated_at: z.string(),
    }),
  ),
  total_count: z.number(),
});

export const workspaceStatsSchema = z.object({
  workspace_exists: z.boolean(),
  content_count: z.number(),
  members_count: z.number(),
  has_content_builder: z.boolean(),
});

export const memberPermissionsResponseSchema = z.object({
  user_id: z.string(),
  workspace_id: z.string(),
  roles: z.array(
    z.object({
      name: z.string(),
      display_name: z.string(),
      workspace_scoped: z.boolean(),
      workspace_id: z.string().nullable(),
    }),
  ),
  permissions: z.array(z.string()),
});

export const updateBrandVoiceResponseSchema = z.object({
  brand_voice: brandVoiceSchema,
});

// Type inference for responses
export type WorkspaceSchemaType = z.infer<typeof workspaceSchema>;
export type WorkspaceResponseSchemaType = z.infer<
  typeof workspaceResponseSchema
>;
export type WorkspaceListResponseSchemaType = z.infer<
  typeof workspaceListResponseSchema
>;
export type CreateWorkspaceResponseSchemaType = z.infer<
  typeof createWorkspaceResponseSchema
>;
export type AvailableRolesResponseSchemaType = z.infer<
  typeof availableRolesResponseSchema
>;
export type WorkspaceStatsSchemaType = z.infer<typeof workspaceStatsSchema>;
export type MemberPermissionsResponseSchemaType = z.infer<
  typeof memberPermissionsResponseSchema
>;
export type UpdateBrandVoiceResponseSchemaType = z.infer<
  typeof updateBrandVoiceResponseSchema
>;
