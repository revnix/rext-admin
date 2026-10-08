import { z } from "zod";

/**
 * Zod Validation Schemas for Workspace Management
 *
 * These schemas validate workspace forms, API requests, and responses.
 * Based on backend requirements and constraints defined in types/workspace.ts
 */

const DOMAIN =
  /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;

/**
 * A website as people type it, as the address that is read: "mysite.com", "www.MySite.com/shop"
 * and " http://mysite.com " all become an `https://` address. Null when there is no domain in it
 * (a word, an email address, something with a space inside).
 *
 * On launch morning 30 of 34 newcomers stopped at this field: it took only a full `https://`
 * address, and a bare domain was refused twice over, by the browser and by the form
 * (rext-control#854). The backend wants `https`, so the form adds it.
 */
export function normalizeWebsite(typed: string): string | null {
  const value = typed.trim();
  if (!value || /\s/.test(value)) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(value)
    ? value
    : `https://${value}`;
  let address: URL;
  try {
    address = new URL(withScheme);
  } catch {
    return null;
  }
  if (address.protocol !== "https:" && address.protocol !== "http:")
    return null;
  if (address.username || address.password) return null;
  if (!DOMAIN.test(address.hostname)) return null;
  address.protocol = "https:";
  const whole = address.toString();
  // "https://mysite.com", not "https://mysite.com/": the bare site has no path to show.
  return address.pathname === "/" && !address.search && !address.hash
    ? whole.replace(/\/$/, "")
    : whole;
}

export const WEBSITE_HELP = "Enter your website's address, like yoursite.com";

// The website, taken as typed and stored as the address read (see normalizeWebsite).
const urlSchema = z
  .string()
  .trim()
  .min(1, WEBSITE_HELP)
  .transform((typed, context) => {
    const address = normalizeWebsite(typed);
    if (address) return address;
    context.addIssue({ code: "custom", message: WEBSITE_HELP });
    return z.NEVER;
  });

/**
 * Any time zone the browser's Intl accepts. Not `Intl.supportedValuesOf("timeZone")`: that lists only
 * canonical names, without "UTC", "Etc/UTC" or the aliases browsers still report (Asia/Calcutta,
 * Europe/Kiev), and the create form's hidden time zone then refused those users silently (D22).
 */
export function isTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// Timezone validation schema with IANA timezone support
const timezoneSchema = z
  .string()
  .optional()
  .refine((tz) => !tz || isTimeZone(tz), "Please select a valid timezone");

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

/** A business described in place of a website (rext-control#853): the backend's own limits. */
export const DESCRIPTION_LIMITS = { min: 20, max: 1000 } as const;
export const DESCRIPTION_HELP =
  "Say what the business sells and who buys it, in a sentence or two";

const descriptionSchema = z
  .string()
  .trim()
  .min(DESCRIPTION_LIMITS.min, DESCRIPTION_HELP)
  .max(
    DESCRIPTION_LIMITS.max,
    `Keep it to ${DESCRIPTION_LIMITS.max.toLocaleString("en")} characters or fewer`,
  );

/**
 * Creating a workspace, two ways in (rext-control#853): from a website, which is read, or from a
 * description of the business, for someone with no website yet. Only the field of the way chosen
 * is checked; what was typed in the other stays in the form, so switching loses nothing.
 */
export const workspaceFormSchema = z.discriminatedUnion("from", [
  z.object({
    from: z.literal("website"),
    name: workspaceNameSchema,
    url: urlSchema,
    description: z.string().optional(),
    timezone: timezoneSchema,
  }),
  z.object({
    from: z.literal("description"),
    name: workspaceNameSchema,
    url: z.string().optional(),
    description: descriptionSchema,
    timezone: timezoneSchema,
  }),
]);

/**
 * Workspace settings, General section: the name and the website (the slug is shown, not edited).
 * Unlike the create form's `urlSchema`, an http:// address is accepted here, as it always was, and
 * so is no website at all.
 */
export const workspaceGeneralInfoSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Workspace name is required")
    .max(200, "Workspace name must be 200 characters or less")
    .regex(/\p{L}/u, "Workspace name must contain at least one letter"),
  slug: z.string(),
  // Empty for a workspace with no website (one made from a description, rext-control#853). A bare
  // domain is enough, as on the create form; an address typed with http:// or https:// is kept
  // as it is.
  url: z
    .string()
    .trim()
    .transform((typed, context) => {
      if (!typed) return "";
      const address = /^[a-z][a-z\d+.-]*:\/\//i.test(typed)
        ? typed
        : `https://${typed}`;
      try {
        const { protocol, hostname } = new URL(address);
        if (/^https?:$/.test(protocol) && DOMAIN.test(hostname)) return address;
      } catch {
        // Not an address: said below.
      }
      context.addIssue({ code: "custom", message: WEBSITE_HELP });
      return z.NEVER;
    }),
});

export type WorkspaceGeneralInfo = z.infer<typeof workspaceGeneralInfoSchema>;

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
  // Null for a workspace made from a description, until a website is added (rext-control#853).
  url: z.string().nullable(),
  // The site's favicon, kept by the backend (task G9); null until it was fetched.
  favicon_url: z.string().nullish(),
  created_at: z.string(),
  updated_at: z.string().optional(),
  brand_voice: brandVoiceSchema.optional(),
  analytics: workspaceAnalyticsSchema.optional(),
  members_count: z.number().optional(),
  content_count: z.number().optional(),
  /**
   * The workspace pipeline's latest run, as the backend gives it on the workspace's detail (the
   * resumable-creation work, rextaihq/rext-backend#901): running, completed, failed, or interrupted
   * when a restart ended it. Absent on a list, and before a first run.
   */
  pipeline: z
    .object({
      status: z.string(),
      operation_id: z.string().nullish(),
      started_at: z.string().nullish(),
    })
    .nullish(),
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

/** Change a member's role (the members list's dialog): one role, picked from the workspace's. */
export const changeMemberRoleSchema = z.object({
  role_id: z.string().min(1, "Choose a role"),
});

export type ChangeMemberRoleValues = z.infer<typeof changeMemberRoleSchema>;

/** Invite members (the members list's dialog): the role they join with and how long the links last. */
export const inviteMembersSchema = z.object({
  role_id: z.string().min(1, "Choose a role"),
  expires_in_days: z.number().int().min(1).max(30),
});

export type InviteMembersValues = z.infer<typeof inviteMembersSchema>;
