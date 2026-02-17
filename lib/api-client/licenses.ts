/**
 * License API Client
 *
 * API client methods for license management operations.
 */

import type {
  License,
  LicenseActivateRequest,
  LicenseActivateResponse,
  LicenseActivation,
  LicenseActivationListResponse,
  LicenseDeactivateRequest,
  LicenseListResponse,
  LicenseValidateRequest,
  LicenseValidateResponse,
} from "@/types/license";
import type { ApiClient } from "./core";
import { ENDPOINTS } from "./endpoints";

export function createLicensesClient(client: ApiClient) {
  return {
    /**
     * Get all licenses for the current user
     */
    getLicenses: async (): Promise<LicenseListResponse> => {
      return client.request<LicenseListResponse>(ENDPOINTS.LICENSES.list, {
        method: "GET",
      });
    },

    /**
     * Get a specific license by ID
     */
    getLicense: async (licenseId: string): Promise<License> => {
      return client.request<License>(ENDPOINTS.LICENSES.detail(licenseId), {
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
        ENDPOINTS.LICENSES.activations(licenseId),
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
        ENDPOINTS.LICENSES.activate,
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
        ENDPOINTS.LICENSES.deactivate(licenseId),
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
        ENDPOINTS.LICENSES.validate,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
    },
  };
}
