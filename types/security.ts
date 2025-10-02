/**
 * Security monitoring types for frontend
 * Maps to backend security_schema.py
 */

// ============================================================================
// FAILED LOGIN TYPES
// ============================================================================

export interface FailedLoginAttempt {
  id: string;
  email: string;
  username: string;
  failed_attempts: number;
  locked_until: string | null;
  last_failed_at: string | null;
  is_locked: boolean;
}

export interface FailedLoginsResponse {
  users: FailedLoginAttempt[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// ============================================================================
// LOCKED ACCOUNT TYPES
// ============================================================================

export interface LockedAccount {
  id: string;
  email: string;
  username: string;
  locked_until: string;
  failed_attempts: number;
  remaining_lock_time_minutes: number;
}

export interface LockedAccountsResponse {
  accounts: LockedAccount[];
  total: number;
}

// ============================================================================
// SECURITY STATISTICS TYPES
// ============================================================================

export interface TopFailedLoginIP {
  ip: string;
  count: number;
}

export interface TopFailedLoginUser {
  email: string;
  count: number;
}

export interface SecurityStats {
  // Failed login stats
  failed_logins_last_24h: number;
  failed_logins_last_7d: number;
  failed_logins_last_30d: number;

  // Locked accounts
  currently_locked_accounts: number;
  locked_accounts_last_24h: number;

  // Password security
  password_resets_last_24h: number;
  password_changes_last_24h: number;

  // Account activity
  new_registrations_last_24h: number;
  email_verifications_last_24h: number;

  // Top offenders
  top_failed_login_ips: TopFailedLoginIP[];
  top_failed_login_users: TopFailedLoginUser[];
}

// ============================================================================
// LOGIN HISTORY TYPES
// ============================================================================

export interface LoginEvent {
  timestamp: string;
  ip_address: string | null;
  user_agent: string | null;
  status: "success" | "failed";
}

export interface LoginHistory {
  user_id: string;
  username: string;
  email: string;
  total_logins: number;
  last_login_at: string | null;
  failed_login_attempts: number;
  login_history: LoginEvent[];
}

// ============================================================================
// SECURITY ACTION REQUEST TYPES
// ============================================================================

export interface UnlockAccountRequest {
  reason?: string;
}

export interface ResetFailedAttemptsRequest {
  reason?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if an account is currently locked
 */
export function isAccountLocked(lockedUntil: string | null): boolean {
  if (!lockedUntil) return false;
  return new Date(lockedUntil) > new Date();
}

/**
 * Calculate remaining lock time in minutes
 */
export function getRemainingLockTime(lockedUntil: string): number {
  const now = new Date();
  const lockEnd = new Date(lockedUntil);
  const diffMs = lockEnd.getTime() - now.getTime();
  const diffMins = Math.ceil(diffMs / 60000);
  return Math.max(0, diffMins);
}

/**
 * Format lock time as human-readable string
 */
export function formatLockTime(minutes: number): string {
  if (minutes < 1) return "Less than a minute";
  if (minutes === 1) return "1 minute";
  if (minutes < 60) return `${minutes} minutes`;

  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;

  if (hours === 1 && remainingMins === 0) return "1 hour";
  if (remainingMins === 0) return `${hours} hours`;

  return `${hours}h ${remainingMins}m`;
}

/**
 * Get severity color based on failed attempts
 */
export function getFailedAttemptsSeverity(
  attempts: number,
): "default" | "warning" | "destructive" {
  if (attempts >= 3) return "destructive";
  if (attempts >= 2) return "warning";
  return "default";
}

/**
 * Get trend indicator for security stats
 */
export function getTrendIndicator(
  current: number,
  baseline: number,
): "increasing" | "decreasing" | "stable" {
  const percentChange = ((current - baseline) / baseline) * 100;
  if (percentChange > 20) return "increasing";
  if (percentChange < -20) return "decreasing";
  return "stable";
}
