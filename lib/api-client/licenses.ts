/**
 * License API Client
 *
 * API client methods for license management operations.
 */

import type { ApiClient } from "./core";
import type {
  License,
  LicenseActivation,
  LicenseActivateRequest,
  LicenseActivateResponse,
  LicenseDeactivateRequest,
  LicenseListResponse,
  LicenseActivationListResponse,
  LicenseValidateRequest,
  LicenseValidateResponse,
} from "@/types/license";

export function createLicensesClient(client: ApiClient) {
  return {
    /**
     * Get all licenses for the current user
     */
    getLicenses: async (): Promise<LicenseListResponse> => {
      return client.request<LicenseListResponse>("/api/v1/licenses", {
        method: "GET",
      });
    },

    /**
     * Get a specific license by ID
     */
    getLicense: async (licenseId: string): Promise<License> => {
      return client.request<License>(`/api/v1/licenses/${licenseId}`, {
        method: "GET",
      });
    },

    /**
     * Get all activations for a specific license
     */
    getLicenseActivations: async (
      licenseId: string,
    ): Promise<LicenseActivationListResponse> => {
      return client.request<LicenseActivationListResponse>(
        `/api/v1/licenses/${licenseId}/activations`,
        {
          method: "GET",
        },
      );
    },

    /**
     * Activate a license for a specific instance
     */
    activateLicense: async (
      data: LicenseActivateRequest,
    ): Promise<LicenseActivateResponse> => {
      return client.request<LicenseActivateResponse>(
        "/api/v1/licenses/activate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
    },

    /**
     * Deactivate a license activation for a specific instance
     */
    deactivateLicense: async (
      licenseId: string,
      data: LicenseDeactivateRequest,
    ): Promise<LicenseActivation> => {
      return client.request<LicenseActivation>(
        `/api/v1/licenses/${licenseId}/deactivate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
    },

    /**
     * Validate a license key
     */
    validateLicense: async (
      data: LicenseValidateRequest,
    ): Promise<LicenseValidateResponse> => {
      return client.request<LicenseValidateResponse>(
        "/api/v1/licenses/validate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
    },
  };
}
