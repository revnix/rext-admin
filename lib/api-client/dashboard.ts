/**
 * Dashboard API Namespace
 *
 * Handles dashboard statistics and metrics retrieval for workspaces.
 *
 * ⚠️ KNOWN INCONSISTENCIES (backend-driven):
 *
 * ### Non-Standard Workspace Scoping:
 * - Uses: `/api/v1/dashboard/{workspaceId}` (workspace ID in path but not a nested resource)
 * - Expected pattern: `/api/v1/workspaces/{id}/dashboard` (consistent with other workspace-scoped resources)
 * - Current design treats dashboard as a top-level resource with workspace ID as parameter
 *
 * ### Root Cause:
 * The endpoint structure doesn't follow the workspace-scoped pattern (`/api/v1/workspaces/{id}/*`)
 * used by other workspace resources (members, invitations, media, personas, etc.).
 *
 * These will be addressed in a backend API v2 migration.
 * See: lib/api-client/endpoints.ts for full path documentation and convention guide.
 */

import type {
  WorkspaceDashboardResponse,
  ContentStats,
} from "@/types/generated/types.gen";
import type { ApiClient } from "./core";
import { ENDPOINTS } from "./endpoints";

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
  total_knowledge_items: number;
  recent_activities: RecentActivity[];
}

export interface RecentActivity {
  id?: string | number;

  // New API fields
  content_title?: string;
  content_status?: string;

  // Multi-type author
  author?:
    | string
    | {
        name?: string;
        image?: string;
        initials?: string;
      };

  // Fallback fields handled in the UI mapping
  name?: string;
  title?: string;
  category?: string;
  status?: string;
  views?: string | number;
  user?: {
    name?: string;
    image?: string;
    initials?: string;
  };
  image?: string;
  author_name?: string;
  creator?: string;
  user_name?: string;
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
    getStats: async (workspaceId: string): Promise<DashboardStats> => {
      // Backend returns WorkspaceDashboardResponse; we cast to local rigid DashboardStats
      return client.request<DashboardStats>(
        ENDPOINTS.DASHBOARD.stats(workspaceId),
        {
          method: "GET",
        },
      );
    },

    /**
     * Get recent activities for a workspace
     */
    getRecentActivities: async (workspaceId: string) => {
      return client.request<RecentActivity[]>(
        ENDPOINTS.DASHBOARD.recentActivities(workspaceId),
        {
          method: "GET",
        },
      );
    },
  };
}
