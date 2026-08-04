/**
 * Audiences Hook
 *
 * React Query hook for fetching and managing audiences (buyer/reader segments)
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Audience } from "@/types/workspace";
import { toast } from "sonner";
import { audienceQueries } from "@/lib/query-keys";

/**
 * Hook to fetch all audiences for a workspace
 */
export function useAudiences(workspaceId: string | null) {
  return useQuery({
    ...audienceQueries.list(workspaceId || ""),
    enabled: !!workspaceId,
  });
}

/**
 * Hook to fetch a single audience
 */
export function useAudience(
  workspaceId: string | null,
  audienceId: string | null,
) {
  return useQuery({
    ...audienceQueries.detail(workspaceId || "", audienceId || ""),
    enabled: !!workspaceId && !!audienceId,
  });
}

/**
 * Hook to create a new audience
 */
export function useCreateAudience(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Audience, "id">) => {
      return apiClient.audiences.create(workspaceId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: audienceQueries.all(workspaceId),
      });
      toast.success("Audience created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create audience: ${error.message}`);
    },
  });
}

/**
 * Hook to update an existing audience
 */
export function useUpdateAudience(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      audienceId,
      data,
    }: {
      audienceId: string;
      data: Partial<Audience>;
    }) => {
      return apiClient.audiences.update(workspaceId, audienceId, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: audienceQueries.detail(workspaceId, variables.audienceId)
          .queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: audienceQueries.lists(workspaceId),
      });
      toast.success("Audience updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update audience: ${error.message}`);
    },
  });
}

/**
 * Hook to delete an audience
 */
export function useDeleteAudience(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (audienceId: string) => {
      return apiClient.audiences.delete(workspaceId, audienceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: audienceQueries.all(workspaceId),
      });
      toast.success("Audience deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete audience: ${error.message}`);
    },
  });
}
