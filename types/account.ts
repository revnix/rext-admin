/**
 * Account Settings Types
 *
 * Type definitions for account management features including
 * deactivation and data export.
 */

/**
 * Request to deactivate user account
 */
export interface DeactivateAccountRequest {
  /** Optional reason for deactivation */
  reason?: string;
  /** User must confirm deactivation (must be true) */
  confirm: boolean;
}

/**
 * Response from account deactivation
 */
export interface DeactivateAccountResponse {
  /** User ID */
  user_id: string;
  /** User email */
  email: string;
  /** Account status (will be 'inactive') */
  status: string;
  /** Timestamp when account was deactivated */
  deactivated_at: string;
  /** Scheduled deletion timestamp (14 days from deactivation) */
  scheduled_deletion_at: string;
  /** Human-readable message */
  message: string;
}

/**
 * Request to export user data
 */
export interface DataExportRequest {
  /** Include profile information */
  include_profile?: boolean;
  /** Include role assignments */
  include_roles?: boolean;
  /** Include workspace memberships */
  include_workspaces?: boolean;
  /** Include activity logs */
  include_activity?: boolean;
}

/**
 * Response from data export request
 */
export interface DataExportResponse {
  /** Export ID for tracking */
  export_id: string;
  /** User ID */
  user_id: string;
  /** Export status */
  status: string;
  /** Timestamp when export was requested */
  requested_at: string;
  /** Message about export delivery */
  message: string;
}

/**
 * Account security information
 */
export interface AccountSecurityInfo {
  /** Last password change date */
  password_changed_at?: string;
  /** Last login timestamp */
  last_login_at?: string;
  /** Total login count */
  login_count?: number;
  /** Whether email is verified */
  email_verified: boolean;
  /** Two-factor authentication enabled */
  two_factor_enabled?: boolean;
}
