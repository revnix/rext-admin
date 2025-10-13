import { z } from "zod";

export const notificationPreferencesSchema = z.object({
  // Workspace Notifications
  workspace_invitation: z.boolean(),
  invitation_accepted: z.boolean(),
  role_changed: z.boolean(),
  member_removed: z.boolean(),

  // Content Generation
  content_generation_started: z.boolean(),
  content_generation_completed: z.boolean(),
  content_generation_failed: z.boolean(),
  content_published: z.boolean(),

  // Billing
  payment_succeeded: z.boolean(),
  payment_failed: z.boolean(),
  subscription_cancelled: z.boolean(),
  subscription_expiring_soon: z.boolean(),
  trial_ending_soon: z.boolean(),
  usage_limit_warning: z.boolean(),
  usage_limit_exceeded: z.boolean(),

  // Knowledge Base
  kb_processing_completed: z.boolean(),
  kb_processing_failed: z.boolean(),

  // Digest
  digest_enabled: z.boolean(),
  digest_frequency: z.enum(["daily", "weekly", "monthly"]),

  // Marketing
  marketing: z.boolean(),
});

export type NotificationPreferences = z.infer<
  typeof notificationPreferencesSchema
>;

// Default preferences for initial state
export const defaultNotificationPreferences: NotificationPreferences = {
  // Workspace Notifications
  workspace_invitation: true,
  invitation_accepted: true,
  role_changed: true,
  member_removed: true,

  // Content Generation
  content_generation_started: true,
  content_generation_completed: true,
  content_generation_failed: true,
  content_published: true,

  // Billing
  payment_succeeded: true,
  payment_failed: true,
  subscription_cancelled: true,
  subscription_expiring_soon: true,
  trial_ending_soon: true,
  usage_limit_warning: true,
  usage_limit_exceeded: true,

  // Knowledge Base
  kb_processing_completed: true,
  kb_processing_failed: true,

  // Digest
  digest_enabled: false,
  digest_frequency: "weekly",

  // Marketing
  marketing: false,
};
