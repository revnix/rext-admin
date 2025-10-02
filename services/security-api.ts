/**
 * Security Monitoring API service
 * Handles security monitoring and management API calls
 */

import { authenticatedFetch } from "@/lib/auth-utils";
import type {
  FailedLoginsResponse,
  LockedAccountsResponse,
  LoginHistory,
  ResetFailedAttemptsRequest,
  SecurityStats,
  UnlockAccountRequest,
} from "@/types/security";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:2024";

// ============================================================================
// SECURITY MONITORING APIs
// ============================================================================

/**
 * Get security statistics dashboard (admin only)
 */
export async function getSecurityStats(): Promise<SecurityStats> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/v1/security/stats`,
    {
      method: "GET",
    },
  );

  const data = await response.json();
  return data.data as SecurityStats;
}

/**
 * Get login history for a specific user (admin or current user)
 */
export async function getLoginHistory(userId: string): Promise<LoginHistory> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/v1/security/login-history/${userId}`,
    {
      method: "GET",
    },
  );

  const data = await response.json();
  return data.data as LoginHistory;
}

/**
 * Get users with failed login attempts (admin only)
 */
export async function getFailedLogins(
  limit = 50,
  offset = 0,
): Promise<FailedLoginsResponse> {
  const queryParams = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/v1/security/failed-logins?${queryParams}`,
    {
      method: "GET",
    },
  );

  const data = await response.json();
  return data.data as FailedLoginsResponse;
}

/**
 * Get currently locked accounts (admin only)
 */
export async function getLockedAccounts(): Promise<LockedAccountsResponse> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/v1/security/locked-accounts`,
    {
      method: "GET",
    },
  );

  const data = await response.json();
  return data.data as LockedAccountsResponse;
}

/**
 * Manually unlock a user account (admin only)
 */
export async function unlockAccount(
  userId: string,
  request: UnlockAccountRequest,
): Promise<{ message: string }> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/v1/security/${userId}/unlock`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    },
  );

  const data = await response.json();
  return data;
}

/**
 * Reset failed login attempts counter (admin only)
 */
export async function resetFailedAttempts(
  userId: string,
  request: ResetFailedAttemptsRequest,
): Promise<{ message: string }> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/v1/security/${userId}/reset-failed-attempts`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    },
  );

  const data = await response.json();
  return data;
}

// ============================================================================
// BACKWARD COMPATIBILITY (Class-based exports)
// ============================================================================

export const SecurityApiService = {
  getSecurityStats,
  getLoginHistory,
  getFailedLogins,
  getLockedAccounts,
  unlockAccount,
  resetFailedAttempts,
};
