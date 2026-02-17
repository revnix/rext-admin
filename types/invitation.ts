/**
 * Invitation Types
 *
 * Type definitions for workspace invitation system.
 */

/**
 * Pending invitation for current user
 * Matches the structure returned by apiClient.invitations.pending()
 */
export interface PendingInvitation {
  id: string;
  email: string;
  workspace_id: string;
  workspace_name: string;
  role_id: string;
  role_name: string;
  invited_by:
    | string
    | {
        name: string;
        email: string;
      };
  token: string;
  expires_at: string;
  status: string;
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
