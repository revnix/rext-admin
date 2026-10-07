export interface ApiNotification {
  id: string;
  title: string;
  message: string;
  type: ApiNotificationType;
  category: ApiNotificationCategory;
  status: ApiNotificationStatus;
  is_read: boolean;
  created_at: string;
  workspace_id?: string | null;
  /** What the notification is about: a finished article's `content_id`, a run's `thread_id`. */
  payload?: Record<string, unknown> | null;
  /** Where it leads, when the backend set one. */
  action_url?: string | null;
}

export const NOTIFICATION_TYPE_VALUES = [
  "workspace",
  "billing",
  "content",
  "generation",
  "system",
  "user",
] as const;

export type ApiNotificationType = (typeof NOTIFICATION_TYPE_VALUES)[number];

export const NOTIFICATION_STATUS_VALUES = [
  "new",
  "info",
  "success",
  "warning",
  "error",
  "failed",
] as const;

export type ApiNotificationStatus = (typeof NOTIFICATION_STATUS_VALUES)[number];

export const NOTIFICATION_CATEGORY_VALUES = [
  "ws_invite_received",
  "ws_invite_accepted",
  "ws_role_changed",
  "ws_member_removed",
  "gen_started",
  "gen_completed",
  "gen_failed",
  "gen_published",
  "billing_payment_success",
  "billing_payment_failed",
  "billing_subscription_cancelled",
  "billing_subscription_expiring",
  "billing_trial_ending",
  "billing_usage_limit_warning",
  "billing_usage_limit_exceeded",
  "in_app_notifications",
  "profile_update_failed",
  "avatar_uploaded",
  "avatar_upload_failed",
] as const;

export type ApiNotificationCategory =
  | (typeof NOTIFICATION_CATEGORY_VALUES)[number]
  | (string & {});
