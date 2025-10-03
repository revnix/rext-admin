"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { contentApiService } from "@/services/content-api";
import type {
  CreateContentRequest,
  UpdateContentRequest,
} from "@/types/content";

/**
 * Hook to fetch content for a workspace
 */
export function useContent(workspaceId: string, status?: string) {
  return useQuery({
    queryKey: ["content", workspaceId, status],
    queryFn: () => contentApiService.listContent(workspaceId, { status }),
    enabled: !!workspaceId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get single content item
 */
export function useContentDetail(workspaceId: string, contentId: string) {
  return useQuery({
    queryKey: ["content", workspaceId, contentId],
    queryFn: () => contentApiService.getContent(workspaceId, contentId),
    enabled: !!workspaceId && !!contentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to create content
 */
export function useCreateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      data,
    }: {
      workspaceId: string;
      data: CreateContentRequest;
    }) => contentApiService.createContent(workspaceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["content", variables.workspaceId],
      });
      toast.success("Content created successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create content");
    },
  });
}

/**
 * Hook to update content
 */
export function useUpdateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      contentId,
      data,
    }: {
      workspaceId: string;
      contentId: string;
      data: UpdateContentRequest;
    }) => contentApiService.updateContent(workspaceId, contentId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["content", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["content", variables.workspaceId, variables.contentId],
      });
      toast.success("Content updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update content");
    },
  });
}

/**
 * Hook to delete content
 */
export function useDeleteContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      contentId,
    }: {
      workspaceId: string;
      contentId: string;
    }) => contentApiService.deleteContent(workspaceId, contentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["content", variables.workspaceId],
      });
      toast.success("Content deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete content");
    },
  });
}
