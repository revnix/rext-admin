"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
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
    queryFn: () => apiClient.content.list(workspaceId, { status }),
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
    queryFn: () => apiClient.content.get(workspaceId, contentId),
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
    }) => apiClient.content.create(workspaceId, data),
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
    }) => apiClient.content.update(workspaceId, contentId, data),
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
 * Hook to schedule content for future publication
 */
export function useScheduleContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      contentId,
      scheduledAt,
      siteId,
    }: {
      workspaceId: string;
      contentId: string;
      scheduledAt: string;
      siteId?: string;
    }) =>
      apiClient.content.schedule(workspaceId, contentId, scheduledAt, siteId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["content", variables.workspaceId],
      });
      queryClient.invalidateQueries({ queryKey: ["content-calendar"] });
      toast.success("Content scheduled successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to schedule content");
    },
  });
}

/**
 * Hook to cancel a scheduled publish
 */
export function useCancelSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      contentId,
    }: {
      workspaceId: string;
      contentId: string;
    }) => apiClient.content.cancelSchedule(workspaceId, contentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["content-calendar"] });
      queryClient.invalidateQueries({
        queryKey: ["content", variables.workspaceId],
      });
      toast.success("Scheduled publish cancelled.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to cancel schedule");
    },
  });
}

/**
 * Hook to fetch content calendar for a workspace month
 */
export function useContentCalendar(
  workspaceId: string,
  year: number,
  month: number,
) {
  return useQuery({
    queryKey: ["content-calendar", workspaceId, year, month],
    queryFn: () => apiClient.content.calendar(workspaceId, year, month),
    enabled: !!workspaceId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
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
    }) => apiClient.content.delete(workspaceId, contentId),
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
