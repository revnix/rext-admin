import { z } from "zod";

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
