import { z } from "zod";

import {
  BANNER_AREAS,
  BANNER_MAX_MINUTES,
  BANNER_MESSAGE_MAX,
  BANNER_MIN_MINUTES,
} from "@/lib/api-client/incident-banner";

/**
 * Invite a platform administrator (super admins only): the address, the admin role, an optional
 * note for the email, and how long the link lasts.
 */
export const adminInvitationSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  admin_role: z.enum(["super_admin", "support_admin", "platform_admin"]),
  message: z
    .string()
    .max(1000, "Keep the message under 1,000 characters")
    .optional(),
  expiry_days: z.number().min(1).max(30),
});

export type AdminInvitationValues = z.infer<typeof adminInvitationSchema>;

/**
 * The incident banner (super admins, rext-control#728): its plain-text message, what is affected,
 * and how long it shows unless it is switched off first. The limits are the backend's.
 */
export const incidentBannerSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Say what is happening")
    .max(
      BANNER_MESSAGE_MAX,
      `Keep the message to ${BANNER_MESSAGE_MAX} characters`,
    ),
  areas: z.array(z.enum(BANNER_AREAS)),
  duration_minutes: z
    .number()
    .int()
    .min(BANNER_MIN_MINUTES)
    .max(BANNER_MAX_MINUTES),
});

export type IncidentBannerValues = z.infer<typeof incidentBannerSchema>;
