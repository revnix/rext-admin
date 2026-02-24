/**
 * Role API Service Client
 *
 * This module provides API client for role and permission management.
 */

import { resolveApiBaseUrl } from "@/lib/api-base-url";
import { authenticatedFetch } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

const log = logger.forComponent("RoleApiService");

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  is_system_role: boolean;
  hierarchy_level: number;
  created_at: string;
  updated_at: string;
}

export interface RoleListResponse {
  roles: Role[];
  total_count: number;
}

export interface Permission {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  resource: string;
  action: string;
  created_at: string;
}

export interface PermissionListResponse {
  permissions: Permission[];
  total_count: number;
}

export class RoleApiService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = resolveApiBaseUrl();
  }

  /**
   * List all roles
   */
  async listRoles(): Promise<RoleListResponse> {
    const url = `${this.baseUrl}/api/v1/user/roles`;

    try {
      const response = await authenticatedFetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch roles: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle backend response format
      if (data.success && data.data) {
        return data.data;
      }

      return data as RoleListResponse;
    } catch (error) {
      log.error("Failed to fetch roles", { error });
      throw error;
    }
  }

  /**
   * Get role by ID
   */
  async getRole(roleId: string): Promise<{ role: Role }> {
    const url = `${this.baseUrl}/api/v1/user/roles/${roleId}`;

    try {
      const response = await authenticatedFetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch role: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle backend response format
      if (data.success && data.data) {
        return data.data;
      }

      return data;
    } catch (error) {
      log.error("Failed to fetch role", { error, roleId });
      throw error;
    }
  }

  /**
   * List all permissions
   */
  async listPermissions(): Promise<PermissionListResponse> {
    const url = `${this.baseUrl}/api/v1/user/permissions`;

    try {
      const response = await authenticatedFetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch permissions: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle backend response format
      if (data.success && data.data) {
        return data.data;
      }

      return data as PermissionListResponse;
    } catch (error) {
      log.error("Failed to fetch permissions", { error });
      throw error;
    }
  }
}

// Create default instance
export const roleApiService = new RoleApiService();
