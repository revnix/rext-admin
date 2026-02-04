/**
 * Dashboard API Namespace
 *
 * Handles dashboard statistics and metrics
 */

import type { ApiClient } from "./core";

/**
 * Dashboard statistics response
 */
export interface DashboardStats {
  workspace_id: string;
  members: number;
  content: {
    total: number;
    published: number;
    draft: number;
  };
  personas: number;
}

export function createDashboardNamespace(client: ApiClient) {
  return {
    /**
     * Get dashboard statistics for a workspace
     *
     * Returns real-time counts for:
     * - Total members
     * - Total content (articles)
     * - Published content
     * - Draft content
     * - Total personas
     */
    getStats: async (workspaceId: string) => {
      return client.request<DashboardStats>(
        `/api/v1/dashboard/${workspaceId}`,
        {
          method: "GET",
        },
      );
    },
  };
}
