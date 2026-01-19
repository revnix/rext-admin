/**
 * Personas Hook
 *
 * React Query hook for fetching and managing personas
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Persona } from "@/types/workspace";
import { toast } from "sonner";

/**
 * Hook to fetch all personas for a workspace
 */
export function usePersonas(workspaceId: string | null) {
  return useQuery({
    queryKey: ["personas", workspaceId],
    queryFn: async () => {
      if (!workspaceId) throw new Error("Workspace ID is required");
      return apiClient.personas.list(workspaceId);
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single persona
 */
export function usePersona(
  workspaceId: string | null,
  personaId: string | null,
) {
  return useQuery({
    queryKey: ["persona", workspaceId, personaId],
    queryFn: async () => {
      if (!workspaceId || !personaId)
        throw new Error("Workspace ID and Persona ID are required");
      return apiClient.personas.get(workspaceId, personaId);
    },
    enabled: !!workspaceId && !!personaId,
  });
}

/**
 * Hook to create a new persona
 */
export function useCreatePersona(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Persona, "id">) => {
      return apiClient.personas.create(workspaceId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personas", workspaceId] });
      toast.success("Persona created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create persona: ${error.message}`);
    },
  });
}

/**
 * Hook to update an existing persona
 */
export function useUpdatePersona(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      personaId,
      data,
    }: {
      personaId: string;
      data: Partial<Persona>;
    }) => {
      return apiClient.personas.update(workspaceId, personaId, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["personas", workspaceId] });
      queryClient.invalidateQueries({
        queryKey: ["persona", workspaceId, variables.personaId],
      });
      toast.success("Persona updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update persona: ${error.message}`);
    },
  });
}

/**
 * Hook to delete a persona
 */
export function useDeletePersona(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (personaId: string) => {
      return apiClient.personas.delete(workspaceId, personaId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personas", workspaceId] });
      toast.success("Persona deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete persona: ${error.message}`);
    },
  });
}
