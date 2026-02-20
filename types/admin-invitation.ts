/**
 * Admin Invitation Types
 *
 * Type definitions for platform-level admin invitations.
 * Separate from workspace invitations for clarity.
 */

export interface AdminInvitation {
  id: string;
  email: string;
  admin_role: "super_admin" | "support_admin" | "platform_admin";
  status: "pending" | "accepted" | "declined" | "revoked" | "expired";
  message?: string;
  permissions?: Record<string, unknown>;

  // Email delivery telemetry from backend (optional for backward compatibility)
  email_delivery_status?: "pending" | "sent" | "failed";
  email_delivery_error?: string;
  invitation_url?: string;

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
  admin_role: "super_admin" | "support_admin" | "platform_admin";
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

export const ADMIN_ROLES = [
  {
    value: "super_admin",
    label: "Super Admin",
    description: "Full platform access",
  },
  {
    value: "support_admin",
    label: "Support Admin",
    description: "Customer support and monitoring",
  },
  {
    value: "platform_admin",
    label: "Platform Admin",
    description: "Platform management without user data access",
  },
] as const;

export const ADMIN_INVITATION_STATUSES = [
  { value: "pending", label: "Pending", color: "yellow" },
  { value: "accepted", label: "Accepted", color: "green" },
  { value: "declined", label: "Declined", color: "red" },
  { value: "revoked", label: "Revoked", color: "gray" },
  { value: "expired", label: "Expired", color: "orange" },
] as const;
