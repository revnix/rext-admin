/**
 * Integrations API Service Client
 *
 * API client for managing integrations (sites)
 */

import { resolveApiBaseUrl } from "@/lib/api-base-url";
import { authenticatedFetch } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { extractApiError, safeParseErrorBody } from "@/lib/error-utils";

// ============================================================================
// TYPES
// ============================================================================

export interface Integration {
  id: string;
  name: string;
  integration_type: string;
  site_url: string;
  api_endpoint?: string;
  is_active: boolean;
  config?: Record<string, unknown>; // For flexible additional config if needed
  logo?: string; // Optional if backend returns it, or we map it client-side
  description?: string;
  api_key?: string; // Sometimes returned, sometimes hidden
  // Add other fields as per API response
  site: {
    id: string;
    site_url: string;
    api_key: string;
    api_endpoint: string;
    is_active: boolean;
  };
}

export interface CreateIntegrationRequest {
  integration_type: "wordpress" | "shopify";
  is_active: boolean;
  site_url: string;
  api_endpoint: string;
  api_key: string;
  username?: string;
  app_password?: string;
}

export interface CreateShopifyConnectionRequest {
  store_url: string;
  access_token: string;
  is_active: boolean;
}

export interface ShopifyConnection {
  id: string;
  workspace_id: string;
  integration_type: string;
  store_url: string;
  is_active: boolean;
  has_access_token: boolean;
  config_json?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateIntegrationRequest {
  site_url?: string;
  api_endpoint?: string;
  api_key?: string;
  is_active?: boolean; // Sometimes update payload might support this
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export class IntegrationsApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "IntegrationsApiError";
  }
}

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export class IntegrationsApiService {
  private readonly baseUrl: string;
  private readonly log = logger.forComponent("IntegrationsApiService");

  constructor() {
    this.baseUrl = resolveApiBaseUrl();
  }

  /**
   * List all integrations
   */
  async listIntegrations(workspaceId: string): Promise<Integration[]> {
    // Note: The user mentioned /api/v1/content/sites/list.
    // Assuming workspaceId might be part of the path or query if needed,
    // but based on user prompt strictly: "/api/v1/content/sites/list"
    const url = `${this.baseUrl}/api/v1/content/sites/list?workspace_id=${workspaceId}`;

    this.log.info("Fetching integrations list", { workspaceId });

    try {
      const response = await authenticatedFetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new IntegrationsApiError(
          "FETCH_FAILED",
          "Failed to fetch integrations",
          response.status,
        );
      }

      const result = await response.json();

      this.log.info("List response", {
        keys: Object.keys(result),
        isArray: Array.isArray(result),
      });

      if (Array.isArray(result)) return result;
      if (Array.isArray(result.data)) return result.data;
      if (Array.isArray(result.items)) return result.items;
      if (Array.isArray(result.sites)) return result.sites;
      if (result.data && Array.isArray(result.data.sites))
        return result.data.sites;

      return [];
    } catch (error) {
      if (error instanceof IntegrationsApiError) throw error;
      throw new IntegrationsApiError(
        "FETCH_FAILED",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  /**
   * Get single integration details
   */
  async getIntegration(
    siteId: string,
    workspaceId: string,
  ): Promise<Integration> {
    const url = `${this.baseUrl}/api/v1/content/sites/${siteId}?workspace_id=${workspaceId}`;

    this.log.info("Fetching integration details", { siteId, workspaceId });

    try {
      const response = await authenticatedFetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new IntegrationsApiError(
          "FETCH_FAILED",
          "Failed to fetch integration details",
          response.status,
        );
      }

      const result = await response.json();
      // Handle potential wrappers: site (current backend), data (common), or raw object
      return result.site || result.data || result;
    } catch (error) {
      if (error instanceof IntegrationsApiError) throw error;
      throw new IntegrationsApiError(
        "FETCH_FAILED",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  /**
   * Create new integration
   */
  async createIntegration(
    workspaceId: string,
    data: CreateIntegrationRequest,
  ): Promise<Integration> {
    const url = `${this.baseUrl}/api/v1/content/sites/connect?workspace_id=${workspaceId}`;

    this.log.info("Creating integration", { workspaceId, url: data.site_url });

    try {
      const response = await authenticatedFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          workspace_id: workspaceId, // Assuming workspace_id is needed in body
        }),
      });

      if (!response.ok) {
        const errorData = await safeParseErrorBody(response);
        const errorMessage = extractApiError(
          errorData,
          "Failed to create integration",
        );

        this.log.error("Failed to create integration", {
          status: response.status,
          workspaceId,
          error: errorMessage,
        });

        throw new IntegrationsApiError(
          "CREATE_FAILED",
          errorMessage,
          response.status,
        );
      }

      const result = await response.json();
      return result.site || result.data || result;
    } catch (error) {
      if (error instanceof IntegrationsApiError) throw error;
      throw new IntegrationsApiError(
        "CREATE_FAILED",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  /**
   * Update integration
   */
  async updateIntegration(
    siteId: string,
    workspaceId: string,
    data: UpdateIntegrationRequest,
  ): Promise<Integration> {
    const url = `${this.baseUrl}/api/v1/content/sites/${siteId}?workspace_id=${workspaceId}`;

    try {
      const response = await authenticatedFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await safeParseErrorBody(response);
        const errorMessage = extractApiError(
          errorData,
          "Failed to update integration",
        );

        this.log.error("Failed to update integration", {
          siteId,
          error: errorMessage,
        });
        throw new IntegrationsApiError(
          "UPDATE_FAILED",
          errorMessage,
          response.status,
        );
      }

      const result = await response.json();
      return result.site || result.data || result;
    } catch (error) {
      if (error instanceof IntegrationsApiError) throw error;
      throw new IntegrationsApiError(
        "UPDATE_FAILED",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  /**
   * Delete integration
   */
  async deleteIntegration(siteId: string, workspaceId: string): Promise<void> {
    const url = `${this.baseUrl}/api/v1/content/sites/${siteId}?workspace_id=${workspaceId}`;

    try {
      const response = await authenticatedFetch(url, { method: "DELETE" });

      if (!response.ok) {
        const errorData = await safeParseErrorBody(response);
        const errorMessage = extractApiError(
          errorData,
          "Failed to delete integration",
        );

        this.log.error("Failed to delete integration", {
          siteId,
          error: errorMessage,
        });
        throw new IntegrationsApiError(
          "DELETE_FAILED",
          errorMessage,
          response.status,
        );
      }
    } catch (error) {
      if (error instanceof IntegrationsApiError) throw error;
      throw new IntegrationsApiError(
        "DELETE_FAILED",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  /**
   * Activate integration
   */
  async activateIntegration(
    siteId: string,
    workspaceId: string,
  ): Promise<void> {
    const url = `${this.baseUrl}/api/v1/content/sites/${siteId}/activate?workspace_id=${workspaceId}`;
    try {
      const response = await authenticatedFetch(url, { method: "POST" });
      if (!response.ok) {
        const errorData = await safeParseErrorBody(response);
        const errorMessage = extractApiError(
          errorData,
          "Failed to activate integration",
        );
        this.log.error("Failed to activate integration", {
          siteId,
          error: errorMessage,
        });
        throw new IntegrationsApiError(
          "ACTIVATE_FAILED",
          errorMessage,
          response.status,
        );
      }
    } catch (error) {
      if (error instanceof IntegrationsApiError) throw error;
      throw new IntegrationsApiError(
        "ACTIVATE_FAILED",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  /**
   * Create Shopify connection via dedicated endpoint (validates credentials before saving)
   */
  async createShopifyConnection(
    workspaceId: string,
    data: CreateShopifyConnectionRequest,
  ): Promise<ShopifyConnection> {
    const url = `${this.baseUrl}/api/v1/shopify/connect?workspace_id=${workspaceId}`;

    this.log.info("Creating Shopify connection", {
      workspaceId,
      store_url: data.store_url,
    });

    try {
      const response = await authenticatedFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await safeParseErrorBody(response);
        const errorMessage = extractApiError(
          errorData,
          "Failed to connect Shopify store",
        );
        throw new IntegrationsApiError(
          "CREATE_FAILED",
          errorMessage,
          response.status,
        );
      }

      const result = await response.json();
      return result.connection || result.data || result;
    } catch (error) {
      if (error instanceof IntegrationsApiError) throw error;
      throw new IntegrationsApiError(
        "CREATE_FAILED",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  /**
   * Test an existing Shopify connection
   */
  async testShopifyConnection(
    connectionId: string,
    workspaceId: string,
  ): Promise<{
    success: boolean;
    shop_info?: Record<string, unknown>;
    error?: string;
  }> {
    const url = `${this.baseUrl}/api/v1/shopify/${connectionId}/test?workspace_id=${workspaceId}`;
    const response = await authenticatedFetch(url, { method: "POST" });
    const result = await response.json();
    return result.result || result;
  }

  /**
   * Deactivate integration
   */
  async deactivateIntegration(
    siteId: string,
    workspaceId: string,
  ): Promise<void> {
    const url = `${this.baseUrl}/api/v1/content/sites/${siteId}/deactivate?workspace_id=${workspaceId}`;
    try {
      const response = await authenticatedFetch(url, { method: "POST" });
      if (!response.ok) {
        const errorData = await safeParseErrorBody(response);
        const errorMessage = extractApiError(
          errorData,
          "Failed to deactivate integration",
        );
        this.log.error("Failed to deactivate integration", {
          siteId,
          error: errorMessage,
        });
        throw new IntegrationsApiError(
          "DEACTIVATE_FAILED",
          errorMessage,
          response.status,
        );
      }
    } catch (error) {
      if (error instanceof IntegrationsApiError) throw error;
      throw new IntegrationsApiError(
        "DEACTIVATE_FAILED",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }
}

export const integrationsApiService = new IntegrationsApiService();
