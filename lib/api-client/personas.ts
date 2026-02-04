/**
 * Personas API Namespace
 *
 * Handles persona CRUD operations
 */

import type { Persona } from "@/types/workspace";
import type { ApiClient } from "./core";

export function createPersonasNamespace(client: ApiClient) {
  return {
    /**
     * List all personas for a workspace
     */
    list: async (workspaceId: string) => {
      return client.request<{
        personas: Persona[];
        total: number;
      }>(`/api/v1/workspaces/${workspaceId}/personas`, {
        method: "GET",
      });
    },

    /**
     * Get a single persona by ID
     */
    get: async (workspaceId: string, personaId: string) => {
      const response = await client.request<Persona>(
        `/api/v1/workspaces/${workspaceId}/personas/${personaId}`,
        {
          method: "GET",
        },
      );
      // Backend returns persona data directly, wrap it for consistency
      return { persona: response };
    },

    /**
     * Create a new persona
     */
    create: async (workspaceId: string, data: Omit<Persona, "id">) => {
      return client.request<{
        persona: Persona;
      }>(`/api/v1/workspaces/${workspaceId}/personas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    /**
     * Update an existing persona
     */
    update: async (
      workspaceId: string,
      personaId: string,
      data: Partial<Persona>,
    ) => {
      return client.request<{
        persona: Persona;
      }>(`/api/v1/workspaces/${workspaceId}/personas/${personaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    /**
     * Delete a persona
     */
    delete: async (workspaceId: string, personaId: string) => {
      return client.request<void>(
        `/api/v1/workspaces/${workspaceId}/personas/${personaId}`,
        {
          method: "DELETE",
        },
      );
    },
  };
}

export type PersonasNamespace = ReturnType<typeof createPersonasNamespace>;
