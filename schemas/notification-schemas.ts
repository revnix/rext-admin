import { z } from "zod";

export const notificationPreferencesSchema = z.object({
  // Email Notifications
  emailNotifications: z.boolean(),
  emailDigestFrequency: z.enum(["instant", "daily", "weekly", "never"]),
  emailWorkspaceInvites: z.boolean(),
  emailComments: z.boolean(),
  emailMentions: z.boolean(),
  emailUpdates: z.boolean(),

  // In-App Notifications
  inAppNotifications: z.boolean(),
  inAppWorkspaceInvites: z.boolean(),
  inAppComments: z.boolean(),
  inAppMentions: z.boolean(),
  inAppUpdates: z.boolean(),
});

export type NotificationPreferences = z.infer<
  typeof notificationPreferencesSchema
>;

// Default preferences for initial state
export const defaultNotificationPreferences: NotificationPreferences = {
  emailNotifications: true,
  emailDigestFrequency: "daily",
  emailWorkspaceInvites: true,
  emailComments: true,
  emailMentions: true,
  emailUpdates: false,
  inAppNotifications: true,
  inAppWorkspaceInvites: true,
  inAppComments: true,
  inAppMentions: true,
  inAppUpdates: false,
};
