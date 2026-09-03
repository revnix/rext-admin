/**
 * Personas API Namespace
 *
 * Handles persona CRUD operations
 */

import type { Persona } from "@/types/workspace";
import type { ApiClient } from "./core";
import { ENDPOINTS } from "./endpoints";

export function createPersonasNamespace(client: ApiClient) {
  return {
    /**
     * Upload a picture for a persona from the user's machine.
     *
     * The body is FormData, so no content-type is set here - the browser has to
     * write it itself along with the multipart boundary, and setting it by hand
     * produces a boundary the server cannot parse.
     */
    uploadAvatar: async (
      workspaceId: string,
      personaId: string,
      file: File,
    ): Promise<Persona> => {
      const formData = new FormData();
      formData.append("file", file);
      return client.request<Persona>(
        ENDPOINTS.PERSONAS.uploadAvatar(workspaceId, personaId),
        { method: "POST", body: formData },
      );
    },

    /**
     * List all personas for a workspace
     */
    list: async (workspaceId: string) => {
      return client.request<{
        personas: Persona[];
        total: number;
      }>(ENDPOINTS.PERSONAS.list(workspaceId), {
        method: "GET",
      });
    },

    /**
     * Get a single persona by ID
     */
    get: async (workspaceId: string, personaId: string) => {
      const response = await client.request<Persona>(
        ENDPOINTS.PERSONAS.get(workspaceId, personaId),
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
      const response = await client.request<Persona>(
        ENDPOINTS.PERSONAS.create(workspaceId),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      return { persona: response };
    },

    /**
     * Update an existing persona
     */
    update: async (
      workspaceId: string,
      personaId: string,
      data: Partial<Persona>,
    ) => {
      const response = await client.request<Persona>(
        ENDPOINTS.PERSONAS.update(workspaceId, personaId),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      return { persona: response };
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
