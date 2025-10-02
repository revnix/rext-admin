/**
 * Account Settings API Service
 *
 * Handles account management operations including:
 * - Account deactivation
 * - Data export
 * - Account security settings
 */

import { authenticatedFetch } from "@/lib/auth-utils";
import type {
  DataExportRequest,
  DataExportResponse,
  DeactivateAccountRequest,
  DeactivateAccountResponse,
} from "@/types/account";
import type { ConsistentSuccessResponse } from "@/types/consistent-response";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class AccountApiError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode?: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AccountApiError";
  }
}

/**
 * Deactivate user account
 *
 * Account will be marked as inactive and scheduled for permanent deletion after 14 days.
 * User will be logged out immediately after successful deactivation.
 */
export async function deactivateAccount(
  request: DeactivateAccountRequest,
): Promise<DeactivateAccountResponse> {
  try {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/api/v1/user/deactivate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new AccountApiError(
        error.message || "Failed to deactivate account",
        response.status,
        error,
      );
    }

    const data: ConsistentSuccessResponse<DeactivateAccountResponse> =
      await response.json();
    return data.data;
  } catch (error) {
    if (error instanceof AccountApiError) throw error;
    throw new AccountApiError(
      error instanceof Error
        ? error.message
        : "Unknown error deactivating account",
    );
  }
}

/**
 * Request data export
 *
 * Generates a comprehensive data export and sends it to user's email.
 * Includes profile, roles, workspaces, and activity logs based on request options.
 */
export async function requestDataExport(
  request: DataExportRequest,
): Promise<DataExportResponse> {
  try {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/api/v1/user/export-data`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new AccountApiError(
        error.message || "Failed to export data",
        response.status,
        error,
      );
    }

    const data: ConsistentSuccessResponse<DataExportResponse> =
      await response.json();
    return data.data;
  } catch (error) {
    if (error instanceof AccountApiError) throw error;
    throw new AccountApiError(
      error instanceof Error ? error.message : "Unknown error exporting data",
    );
  }
}
