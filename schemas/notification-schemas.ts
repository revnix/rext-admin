import { z } from "zod";

export const notificationPreferencesSchema = z.object({
  // Workspace Notifications
  ws_invite_received: z.boolean(),
  ws_invite_accepted: z.boolean(),
  ws_role_changed: z.boolean(),
  ws_member_removed: z.boolean(),

  // Content Generation
  gen_completed: z.boolean(),
  gen_started: z.boolean(),
  gen_failed: z.boolean(),
  gen_published: z.boolean(),

  // Billing
  billing_payment_success: z.boolean(),
  billing_payment_failed: z.boolean(),
  billing_subscription_cancelled: z.boolean(),
  billing_subscription_expiring: z.boolean(),
  billing_trial_ending: z.boolean(),
  billing_usage_limit_warning: z.boolean(),
  billing_usage_limit_exceeded: z.boolean(),

  // Knowledge Base
  kb_processing_completed: z.boolean(),
  kb_processing_failed: z.boolean(),

  // Digest
  digest_enabled: z.boolean(),
  digest_frequency: z.enum(["daily", "weekly", "monthly"]),

  // Marketing
  marketing_updates: z.boolean(),
});

export type NotificationPreferences = z.infer<
  typeof notificationPreferencesSchema
>;

// Default preferences for initial state
export const defaultNotificationPreferences: NotificationPreferences = {
  // Workspace Notifications
  ws_invite_received: true,
  ws_invite_accepted: true,
  ws_role_changed: true,
  ws_member_removed: true,

  // Content Generation
  gen_completed: true,
  gen_started: true,
  gen_failed: true,
  gen_published: true,

  // Billing
  billing_payment_success: true,
  billing_payment_failed: true,
  billing_subscription_cancelled: true,
  billing_subscription_expiring: true,
  billing_trial_ending: true,
  billing_usage_limit_warning: true,
  billing_usage_limit_exceeded: true,

  // Knowledge Base
  kb_processing_completed: true,
  kb_processing_failed: true,

  // Digest
  digest_enabled: false,
  digest_frequency: "weekly",

  // Marketing
  marketing_updates: false,
};

export const notificationPreferencesApiSchema = z.object({
  workspace_notifications: z
    .object({
      invite_received: z.boolean().optional(),
      invite_accepted: z.boolean().optional(),
      role_changed: z.boolean().optional(),
      member_removed: z.boolean().optional(),
    })
    .optional(),

  content_generation: z
    .object({
      generation_started: z.boolean().optional(),
      generation_completed: z.boolean().optional(),
      generation_failed: z.boolean().optional(),
      content_published: z.boolean().optional(),
    })
    .optional(),

  billing: z
    .object({
      payment_success: z.boolean().optional(),
      payment_failed: z.boolean().optional(),
      subscription_cancelled: z.boolean().optional(),
      subscription_expiring: z.boolean().optional(),
      trial_ending: z.boolean().optional(),
      usage_limit_warning: z.boolean().optional(),
      usage_limit_exceeded: z.boolean().optional(),
    })
    .optional(),

  knowledge_base: z
    .object({
      processing_completed: z.boolean().optional(),
      processing_failed: z.boolean().optional(),
    })
    .optional(),

  email_digest: z
    .object({
      enabled: z.boolean().optional(),
      frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
    })
    .optional(),

  marketing: z
    .object({
      marketing_updates: z.boolean().optional(),
    })
    .optional(),
});

export type NotificationPreferencesApiResponse = z.infer<
  typeof notificationPreferencesApiSchema
>;
// Transform flat preferences to API response structure
export function transformToApiResponse(
  preferences: Partial<NotificationPreferences> = {},
): NotificationPreferencesApiResponse {
  const merged: NotificationPreferences = {
    ...defaultNotificationPreferences,
    ...preferences,
  };

  return {
    workspace_notifications: {
      invite_received: merged.ws_invite_received,
      invite_accepted: merged.ws_invite_accepted,
      role_changed: merged.ws_role_changed,
      member_removed: merged.ws_member_removed,
    },
    content_generation: {
      generation_started: merged.gen_started,
      generation_completed: merged.gen_completed,
      generation_failed: merged.gen_failed,
      content_published: merged.gen_published,
    },
    billing: {
      payment_success: merged.billing_payment_success,
      payment_failed: merged.billing_payment_failed,
      subscription_cancelled: merged.billing_subscription_cancelled,
      subscription_expiring: merged.billing_subscription_expiring,
      trial_ending: merged.billing_trial_ending,
      usage_limit_warning: merged.billing_usage_limit_warning,
      usage_limit_exceeded: merged.billing_usage_limit_exceeded,
    },
    knowledge_base: {
      processing_completed: merged.kb_processing_completed,
      processing_failed: merged.kb_processing_failed,
    },
    email_digest: {
      enabled: merged.digest_enabled,
      frequency: merged.digest_frequency,
    },
    marketing: {
      marketing_updates: merged.marketing_updates,
    },
  };
}
