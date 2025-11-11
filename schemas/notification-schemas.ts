import { z } from "zod";

/**
 * Notification Categories Schema (API Spec v1)
 * Each category applies to both email and in-app channels
 */
export const notificationCategoriesSchema = z.object({
  mentions: z.boolean(),
  workspace_invites: z.boolean(),
  content_updates: z.boolean(),
  comments: z.boolean(),
  team_activity: z.boolean(),
  security_alerts: z.boolean(),
  billing_updates: z.boolean(),
  product_updates: z.boolean(),
});

export type NotificationCategories = z.infer<
  typeof notificationCategoriesSchema
>;

/**
 * Notification Preferences Schema (API Spec v1)
 * Master toggles + category-based notification controls
 */
export const notificationPreferencesSchema = z.object({
  // Master toggles for all notifications
  email_enabled: z.boolean(),
  in_app_enabled: z.boolean(),

  // Digest settings
  digest_enabled: z.boolean(),
  digest_frequency: z.enum(["daily", "weekly", "monthly"]),

  // Category-based notification toggles
  categories: notificationCategoriesSchema,
});

export type NotificationPreferences = z.infer<
  typeof notificationPreferencesSchema
>;

/**
 * Default notification preferences
 * Security alerts enabled by default, marketing disabled
 */
export const defaultNotificationPreferences: NotificationPreferences = {
  email_enabled: true,
  in_app_enabled: true,
  digest_enabled: false,
  digest_frequency: "weekly",
  categories: {
    mentions: true,
    workspace_invites: true,
    content_updates: true,
    comments: true,
    team_activity: true,
    security_alerts: true,
    billing_updates: true,
    product_updates: false,
  },
};
