/**
 * Invitation Types
 *
 * Type definitions for workspace invitation system.
 */

/**
 * Pending invitation for current user
 */
export interface PendingInvitation {
  id: string;
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  role: {
    id: string;
    name: string;
    display_name: string;
  };
  invited_by: {
    id: string;
    name: string;
    email: string;
  };
  token: string;
  expires_at: string;
  created_at: string;
}

/**
 * Response from GET /api/v1/user/invitations/pending
 */
export interface PendingInvitationsResponse {
  invitations: PendingInvitation[];
  count: number;
}

/**
 * Request body for declining invitation
 */
export interface DeclineInvitationRequest {
  reason?: string;
}

/**
 * Response from POST /api/v1/user/invitations/{id}/decline
 */
export interface DeclineInvitationResponse {
  invitation_id: string;
  status: string;
  declined_at: string;
}
