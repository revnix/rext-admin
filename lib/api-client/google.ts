/**
 * Google Search Console / GA4 Integration API Namespace
 *
 * Connection setup + per-site mapping, plus Modules 1-4 (Dashboard, Content
 * Inventory, Content Health Score, Opportunity Score).
 *
 * @note Uses query parameter for workspace scoping (`?workspace_id=`),
 * matching CONTENT/DASHBOARD/TOPICS' existing convention for this backend.
 * See lib/api-client/endpoints.ts for the full path registry.
 */

import type {
  ContentHealthScoreResponse,
  ContentInventoryFilter,
  ContentInventoryResponse,
  ContentInventorySortField,
  ContentPerformanceResponse,
  GoogleAuthorizationUrlResponse,
  GoogleConnectionStatus,
  GoogleDashboardResponse,
  GoogleSearchConsoleSite,
  GoogleSiteMapping,
  GoogleSiteMappingRequest,
  OpportunityRankedListResponse,
  OpportunityScoreResponse,
} from "@/types/google-integration";
import type { ApiClient } from "./core";
import { buildUrl } from "../url-utils";
import { ENDPOINTS } from "./endpoints";

export function createGoogleIntegrationNamespace(client: ApiClient) {
  return {
    // ------------------------------------------------------------------
    // Connection setup
    // ------------------------------------------------------------------

    getStatus: async (workspaceId: string) => {
      return client.request<GoogleConnectionStatus>(
        buildUrl(ENDPOINTS.GOOGLE_INTEGRATION.status, {
          workspace_id: workspaceId,
        }),
        { method: "GET" },
      );
    },

    getAuthorizationUrl: async (workspaceId: string, returnPath?: string) => {
      return client.request<GoogleAuthorizationUrlResponse>(
        buildUrl(ENDPOINTS.GOOGLE_INTEGRATION.connect, {
          workspace_id: workspaceId,
          return_path: returnPath,
        }),
        { method: "GET" },
      );
    },

    disconnect: async (workspaceId: string) => {
      return client.request<void>(
        buildUrl(ENDPOINTS.GOOGLE_INTEGRATION.disconnect, {
          workspace_id: workspaceId,
        }),
        { method: "DELETE" },
      );
    },

    listSearchConsoleSites: async (workspaceId: string) => {
      const result = await client.request<{ sites: GoogleSearchConsoleSite[] }>(
        buildUrl(ENDPOINTS.GOOGLE_INTEGRATION.searchConsoleSites, {
          workspace_id: workspaceId,
        }),
        { method: "GET" },
      );
      return result.sites;
    },

    getSiteMapping: async (workspaceId: string, siteId: string) => {
      return client.request<GoogleSiteMapping>(
        buildUrl(ENDPOINTS.GOOGLE_INTEGRATION.siteMapping(siteId), {
          workspace_id: workspaceId,
        }),
        { method: "GET" },
      );
    },

    saveSiteMapping: async (
      workspaceId: string,
      siteId: string,
      data: GoogleSiteMappingRequest,
    ) => {
      return client.request<GoogleSiteMapping>(
        buildUrl(ENDPOINTS.GOOGLE_INTEGRATION.siteMapping(siteId), {
          workspace_id: workspaceId,
        }),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
    },

    removeSiteMapping: async (workspaceId: string, siteId: string) => {
      return client.request<void>(
        buildUrl(ENDPOINTS.GOOGLE_INTEGRATION.siteMapping(siteId), {
          workspace_id: workspaceId,
        }),
        { method: "DELETE" },
      );
    },

    // ------------------------------------------------------------------
    // Module 1 — Dashboard
    // ------------------------------------------------------------------

    getDashboard: async (workspaceId: string, days = 28) => {
      return client.request<GoogleDashboardResponse>(
        buildUrl(ENDPOINTS.GOOGLE_INTEGRATION.dashboard, {
          workspace_id: workspaceId,
          days,
        }),
        { method: "GET" },
      );
    },

    // ------------------------------------------------------------------
    // Module 2 — Content Inventory
    // ------------------------------------------------------------------

    getContentInventory: async (
      workspaceId: string,
      options?: {
        days?: number;
        page?: number;
        pageSize?: number;
        filters?: ContentInventoryFilter[];
        sortBy?: ContentInventorySortField;
        sortOrder?: "asc" | "desc";
      },
    ) => {
      return client.request<ContentInventoryResponse>(
        buildUrl(ENDPOINTS.GOOGLE_INTEGRATION.contentInventory, {
          workspace_id: workspaceId,
          days: options?.days,
          page: options?.page,
          page_size: options?.pageSize,
          filter: options?.filters,
          sort_by: options?.sortBy,
          sort_order: options?.sortOrder,
        }),
        { method: "GET" },
      );
    },

    // ------------------------------------------------------------------
    // Module 3 — Content Health Score
    // ------------------------------------------------------------------

    getHealthScore: async (workspaceId: string, contentId: string) => {
      return client.request<ContentHealthScoreResponse>(
        buildUrl(ENDPOINTS.GOOGLE_INTEGRATION.healthScore(contentId), {
          workspace_id: workspaceId,
        }),
        { method: "GET" },
      );
    },

    // ------------------------------------------------------------------
    // Module 4 — Opportunity Score
    // ------------------------------------------------------------------

    getOpportunityScore: async (
      workspaceId: string,
      contentId: string,
      days = 28,
    ) => {
      return client.request<OpportunityScoreResponse>(
        buildUrl(ENDPOINTS.GOOGLE_INTEGRATION.opportunityScore(contentId), {
          workspace_id: workspaceId,
          days,
        }),
        { method: "GET" },
      );
    },

    getRankedOpportunities: async (
      workspaceId: string,
      options?: { days?: number; page?: number; pageSize?: number },
    ) => {
      return client.request<OpportunityRankedListResponse>(
        buildUrl(ENDPOINTS.GOOGLE_INTEGRATION.opportunities, {
          workspace_id: workspaceId,
          days: options?.days,
          page: options?.page,
          page_size: options?.pageSize,
        }),
        { method: "GET" },
      );
    },

    // ------------------------------------------------------------------
    // Content performance — daily GSC/GA4 metrics for one article, backing
    // the Overview (organic traffic/CTR/impressions/position trend) and
    // Keyword Analytics (ranking history) sections of the article detail page.
    // ------------------------------------------------------------------

    getContentPerformance: async (
      workspaceId: string,
      contentId: string,
      options?: { days?: number; refresh?: boolean },
    ) => {
      return client.request<ContentPerformanceResponse>(
        buildUrl(ENDPOINTS.GOOGLE_INTEGRATION.contentPerformance(contentId), {
          workspace_id: workspaceId,
          days: options?.days,
          refresh: options?.refresh,
        }),
        { method: "GET" },
      );
    },
  };
}
