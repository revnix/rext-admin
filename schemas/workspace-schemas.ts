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
