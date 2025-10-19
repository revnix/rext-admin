/**
 * License Management Types
 *
 * TypeScript types for license management, including licenses,
 * activations, and license-related API responses.
 */

/**
 * License status enum
 */
export enum LicenseStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  EXPIRED = "expired",
  DISABLED = "disabled",
  REVOKED = "revoked",
}

/**
 * License interface
 */
export interface License {
  id: string;
  license_key: string;
  product_name: string;
  status: LicenseStatus;
  activation_limit: number | null;
  activation_count: number;
  activated_at: string | null;
  expires_at: string | null;
  created_at: string;
}

/**
 * License activation interface
 */
export interface LicenseActivation {
  id: string;
  license_id: string;
  instance_id: string;
  instance_name: string | null;
  is_active: boolean;
  activated_at: string;
  deactivated_at: string | null;
}

/**
 * API Response Types
 */

export interface LicenseListResponse {
  licenses: License[];
  total: number;
}

export interface LicenseActivationListResponse {
  activations: LicenseActivation[];
  total: number;
  active_count: number;
}

export interface LicenseActivateRequest {
  license_key: string;
  instance_id: string;
  instance_name?: string;
}

export interface LicenseActivateResponse {
  activation: {
    id: string;
    license_id: string;
    instance_id: string;
    instance_name: string | null;
    is_active: boolean;
    activated_at: string;
    deactivated_at: string | null;
  };
  license: License;
}

export interface LicenseDeactivateRequest {
  instance_id: string;
}

export interface LicenseValidateRequest {
  license_key: string;
  instance_id?: string;
}

export interface LicenseValidateResponse {
  valid: boolean;
  license_key: string;
  status: string;
  activated: boolean;
  activation_limit: number | null;
  activation_usage: number | null;
  expires_at: string | null;
  customer_email: string | null;
  customer_name: string | null;
  product_name: string | null;
  variant_name: string | null;
}
