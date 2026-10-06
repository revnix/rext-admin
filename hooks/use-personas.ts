/**
 * Personas Hook
 *
 * React Query hook for fetching and managing personas
 */

import {
  type QueryClient,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Persona } from "@/types/workspace";
import { toast } from "sonner";
import { personaQueries } from "@/lib/query-keys";

/**
 * The persona list carries each persona's article count (rext-backend#818) and stays fresh for five
 * minutes, so whatever adds or removes an article refreshes it: the count and its sort follow.
 */
export function refreshPersonaCounts(
  queryClient: QueryClient,
  workspaceId: string,
) {
  return queryClient.invalidateQueries({
    queryKey: personaQueries.lists(workspaceId),
  });
}

/**
 * Hook to fetch all personas for a workspace
 */
export function usePersonas(workspaceId: string | null) {
  return useQuery({
    ...personaQueries.list(workspaceId || ""),
    enabled: !!workspaceId,
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
    ...personaQueries.detail(workspaceId || "", personaId || ""),
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
      queryClient.invalidateQueries({
        queryKey: personaQueries.all(workspaceId),
      });
      toast.success("Persona created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create persona: ${error.message}`);
    },
  });
}

/**
 * Hook to upload a persona's picture from the user's machine.
 */
export function useUploadPersonaAvatar(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      personaId,
      file,
    }: {
      personaId: string;
      file: File;
    }) => {
      return apiClient.personas.uploadAvatar(workspaceId, personaId, file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: personaQueries.all(workspaceId),
      });
      toast.success("Photo uploaded");
    },
    onError: (error: Error) => {
      toast.error(`Could not upload photo: ${error.message}`);
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
      // Invalidate the specific persona's details cache to force a fresh fetch from GET
      queryClient.invalidateQueries({
        queryKey: personaQueries.detail(workspaceId, variables.personaId)
          .queryKey,
      });

      // Invalidate the list as well to ensure it's up to date
      queryClient.invalidateQueries({
        queryKey: personaQueries.lists(workspaceId),
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
      queryClient.invalidateQueries({
        queryKey: personaQueries.all(workspaceId),
      });
      toast.success("Persona deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete persona: ${error.message}`);
    },
  });
}
