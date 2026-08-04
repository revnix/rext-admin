/**
 * Audiences API Namespace
 *
 * Handles audience (buyer/reader segment) CRUD operations.
 * Mirrors the Personas namespace convention exactly.
 */

import type { Audience } from "@/types/workspace";
import type { ApiClient } from "./core";
import { ENDPOINTS } from "./endpoints";

export function createAudiencesNamespace(client: ApiClient) {
  return {
    /**
     * List all audiences for a workspace
     */
    list: async (workspaceId: string) => {
      return client.request<{
        audiences: Audience[];
        total: number;
      }>(ENDPOINTS.AUDIENCES.list(workspaceId), {
        method: "GET",
      });
    },

    /**
     * Get a single audience by ID
     */
    get: async (workspaceId: string, audienceId: string) => {
      const response = await client.request<Audience>(
        ENDPOINTS.AUDIENCES.get(workspaceId, audienceId),
        {
          method: "GET",
        },
      );
      // Backend returns audience data directly, wrap it for consistency
      return { audience: response };
    },

    /**
     * Create a new audience
     */
    create: async (workspaceId: string, data: Omit<Audience, "id">) => {
      const response = await client.request<Audience>(
        ENDPOINTS.AUDIENCES.create(workspaceId),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      return { audience: response };
    },

    /**
     * Update an existing audience
     */
    update: async (
      workspaceId: string,
      audienceId: string,
      data: Partial<Audience>,
    ) => {
      const response = await client.request<Audience>(
        ENDPOINTS.AUDIENCES.update(workspaceId, audienceId),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      return { audience: response };
    },

    /**
     * Delete an audience
     */
    delete: async (workspaceId: string, audienceId: string) => {
      return client.request<void>(
        ENDPOINTS.AUDIENCES.delete(workspaceId, audienceId),
        {
          method: "DELETE",
        },
      );
    },
  };
}

export type AudiencesNamespace = ReturnType<typeof createAudiencesNamespace>;
