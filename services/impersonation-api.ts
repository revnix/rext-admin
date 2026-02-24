/**
 * Impersonation API Service Client
 *
 * This module provides API client for user impersonation functionality.
 * Admin users can impersonate other users to troubleshoot issues or provide support.
 */

import { resolveApiBaseUrl } from "@/lib/api-base-url";
import { authenticatedFetch } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

const log = logger.forComponent("ImpersonationApiService");

export interface ImpersonationStartRequest {
  user_id: string;
}

export interface ImpersonationStartResponse {
  original_user_id: string;
  impersonated_user_id: string;
  impersonated_user_email: string;
  impersonated_user_name: string;
  access_token: string;
  refresh_token: string;
  started_at: string;
}

export interface ImpersonationStopResponse {
  original_user_id: string;
  access_token: string;
  refresh_token: string;
  stopped_at: string;
}

export interface ImpersonationStatus {
  is_impersonating: boolean;
  original_user_id?: string;
  original_user_email?: string;
  original_user_name?: string;
  impersonated_user_id?: string;
  impersonated_user_email?: string;
  impersonated_user_name?: string;
  started_at?: string;
}

export class ImpersonationApiService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = resolveApiBaseUrl();
  }

  /**
   * Start impersonating a user
   */
  async startImpersonation(
    userId: string,
  ): Promise<ImpersonationStartResponse> {
    const url = `${this.baseUrl}/api/v1/user/impersonate/start`;

    try {
      const response = await authenticatedFetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `Failed to start impersonation: ${response.statusText}`,
        );
      }

      const data = await response.json();

      // Handle backend response format
      if (data.success && data.data) {
        return data.data as ImpersonationStartResponse;
      }

      return data as ImpersonationStartResponse;
    } catch (error) {
      log.error("Failed to start impersonation", { error, userId });
      throw error;
    }
  }

  /**
   * Stop impersonating and return to original user
   */
  async stopImpersonation(): Promise<ImpersonationStopResponse> {
    const url = `${this.baseUrl}/api/v1/user/impersonate/stop`;

    try {
      const response = await authenticatedFetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `Failed to stop impersonation: ${response.statusText}`,
        );
      }

      const data = await response.json();

      // Handle backend response format
      if (data.success && data.data) {
        return data.data as ImpersonationStopResponse;
      }

      return data as ImpersonationStopResponse;
    } catch (error) {
      log.error("Failed to stop impersonation", { error });
      throw error;
    }
  }

  /**
   * Get current impersonation status
   */
  async getImpersonationStatus(): Promise<ImpersonationStatus> {
    const url = `${this.baseUrl}/api/v1/user/impersonate/status`;

    try {
      const response = await authenticatedFetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `Failed to get impersonation status: ${response.statusText}`,
        );
      }

      const data = await response.json();

      // Handle backend response format
      if (data.success && data.data) {
        return data.data as ImpersonationStatus;
      }

      return data as ImpersonationStatus;
    } catch (error) {
      log.error("Failed to get impersonation status", { error });
      throw error;
    }
  }
}

// Create default instance
export const impersonationApiService = new ImpersonationApiService();
