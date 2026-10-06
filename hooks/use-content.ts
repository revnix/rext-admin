"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import type {
  ContentItem,
  CreateContentRequest,
  UpdateContentRequest,
} from "@/types/content";
import { useSubscriptionStore } from "@/stores/subscription-store";

// The backend's largest page of content (content_retrieval.py: limit at most 500).
const CONTENT_PAGE_LIMIT = 500;

/**
 * Every content item in the workspace, read page by page. The backend's list has no search or sort,
 * so the library loads all of it and searches, filters and sorts in the browser; the default page
 * of 100 used to hide anything past the hundredth item.
 */
export function useAllContent(workspaceId: string) {
  return useQuery({
    queryKey: ["content", workspaceId, "all"],
    queryFn: async () => {
      const items: ContentItem[] = [];
      for (let offset = 0; ; offset += CONTENT_PAGE_LIMIT) {
        const page = await apiClient.content.list(workspaceId, {
          limit: CONTENT_PAGE_LIMIT,
          offset,
        });
        items.push(...page.content);
        if (
          page.content.length < CONTENT_PAGE_LIMIT ||
          items.length >= page.total_count
        ) {
          return items;
        }
      }
    },
    enabled: !!workspaceId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get single content item
 */
export function useContentDetail(workspaceId: string, contentId: string) {
  const { fetchCredits } = useSubscriptionStore();

  return useQuery({
    queryKey: ["content", workspaceId, contentId],
    queryFn: async () => {
      const result = await apiClient.content.get(workspaceId, contentId);
      // If it's still generating, refetch credits to show live burn-down
      if (result?.content?.status === "generating") {
        fetchCredits(workspaceId).catch(() => {});
      }
      return result;
    },
    enabled: !!workspaceId && !!contentId,
    refetchInterval: (query) => {
      const state = query.state.data;
      return state?.content?.status === "generating" ? 5000 : false;
    },
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
