/**
 * Personas API Namespace
 *
 * Handles persona CRUD operations
 */

import type {
  PersonaResponse,
  PersonaListResponse,
  PersonaCreate,
  PersonaUpdate,
} from "@/types/generated/types.gen";
import type { ApiClient } from "./core";
import { ENDPOINTS } from "./endpoints";

export function createPersonasNamespace(client: ApiClient) {
  return {
    /**
     * List all personas for a workspace
     */
    list: async (workspaceId: string) => {
      return client.request<PersonaListResponse>(
        ENDPOINTS.PERSONAS.list(workspaceId),
        {
          method: "GET",
        },
      );
    },

    /**
     * Get a single persona by ID
     */
    get: async (workspaceId: string, personaId: string) => {
      return client.request<PersonaResponse>(
        ENDPOINTS.PERSONAS.get(workspaceId, personaId),
        {
          method: "GET",
        },
      );
    },

    /**
     * Create a new persona
     */
    create: async (workspaceId: string, data: PersonaCreate) => {
      return client.request<PersonaResponse>(
        ENDPOINTS.PERSONAS.create(workspaceId),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
    },

    /**
     * Update an existing persona
     */
    update: async (
      workspaceId: string,
      personaId: string,
      data: PersonaUpdate,
    ) => {
      return client.request<PersonaResponse>(
        ENDPOINTS.PERSONAS.update(workspaceId, personaId),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
    },

    /**
     * Delete a persona
     */
    delete: async (workspaceId: string, personaId: string) => {
      return client.request<void>(
        ENDPOINTS.PERSONAS.delete(workspaceId, personaId),
        {
          method: "DELETE",
        },
      );
    },
  };
}

export type PersonasNamespace = ReturnType<typeof createPersonasNamespace>;
