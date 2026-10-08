/**
 * Admin Invitation Types
 *
 * Type definitions for platform-level admin invitations.
 * Separate from workspace invitations for clarity.
 */

/** A platform role as the API names it. */
export type AdminRole = "super_admin" | "admin" | "support";

/** The screen's word for a role; a name it doesn't know is shown as it came. */
export const adminRoleLabel = (role: string) =>
  ADMIN_ROLES.find((known) => known.value === role)?.label ??
  role.replaceAll("_", " ");

export interface AdminInvitation {
  id: string;
  email: string;
  admin_role: AdminRole;
  status: "pending" | "accepted" | "declined" | "revoked" | "expired";
  message?: string;
  permissions?: Record<string, unknown>;

  // Inviter info
  invited_by_admin_id?: string;
  invited_by_name?: string;
  invited_by_email?: string;

  // Timestamps
  created_at: string;
  expires_at: string;
  accepted_at?: string;
  declined_at?: string;
  revoked_at?: string;

  // Acceptance info
  accepted_by_user_id?: string;
  accepted_by_name?: string;

  // Decline info
  declined_reason?: string;

  // Revoke info
  revoked_by_admin_id?: string;
  revoked_by_name?: string;
  revoked_reason?: string;

  // Computed fields
  is_expired: boolean;
  can_be_accepted: boolean;
  days_until_expiry?: number;
}

export interface CreateAdminInvitationRequest {
  email: string;
  admin_role: AdminRole;
  message?: string;
  permissions?: Record<string, unknown>;
  expiry_days?: number;
}

export interface AdminInvitationListResponse {
  invitations: AdminInvitation[];
  total_count: number;
  status_filter?: string;
  limit: number;
  offset: number;
}

export interface ValidateAdminInvitationResponse {
  valid: boolean;
  invitation_id?: string;
  email: string;
  admin_role: string;
  message?: string;
  invited_by_name?: string;
  expires_at: string;
  is_expired: boolean;
  status: string;
  error_message?: string;
}

export interface AdminInvitationStats {
  total_invitations: number;
  pending_invitations: number;
  accepted_invitations: number;
  declined_invitations: number;
  revoked_invitations: number;
  expired_invitations: number;
  acceptance_rate: number;
  average_acceptance_time_hours?: number;
}

// The roles the backend has and takes (task 915): any other name is refused with a 422, which is
// why no invitation from this screen was ever stored while it offered "support_admin" and
// "platform_admin". The labels are the screen's; the values are the API's.
export const ADMIN_ROLES = [
  {
    value: "super_admin",
    label: "Super admin",
    description:
      "Everything on the platform, and the only role that can invite admins",
  },
  {
    value: "admin",
    label: "Platform admin",
    description: "Administers the platform",
  },
  {
    value: "support",
    label: "Support admin",
    description: "Customer support",
  },
] as const;

export const ADMIN_INVITATION_STATUSES = [
  { value: "pending", label: "Pending", color: "yellow" },
  { value: "accepted", label: "Accepted", color: "green" },
  { value: "declined", label: "Declined", color: "red" },
  { value: "revoked", label: "Revoked", color: "gray" },
  { value: "expired", label: "Expired", color: "orange" },
] as const;
