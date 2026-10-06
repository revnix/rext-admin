"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import type {
  ContentItem,
  ContentListResponse,
  CreateContentRequest,
  UpdateContentRequest,
} from "@/types/content";
import { useSubscriptionStore } from "@/stores/subscription-store";

// The backend's largest page of content (content_retrieval.py: limit at most 500).
const CONTENT_PAGE_LIMIT = 500;
// A stop for a backend that ignores the offset: 40 pages is 20,000 items.
const CONTENT_MAX_PAGES = 40;

type ContentPage = Pick<ContentListResponse, "content" | "total_count">;

/**
 * Reads every page of a list: 500 items a request, until a short page or the total. The backend's
 * list has no search or sort, so the library loads all of it and does both in the browser.
 */
export async function fetchAllContent(
  listPage: (page: { limit: number; offset: number }) => Promise<ContentPage>,
): Promise<ContentItem[]> {
  const items: ContentItem[] = [];
  for (let page = 0; page < CONTENT_MAX_PAGES; page++) {
    const { content, total_count } = await listPage({
      limit: CONTENT_PAGE_LIMIT,
      offset: page * CONTENT_PAGE_LIMIT,
    });
    items.push(...content);
    if (content.length < CONTENT_PAGE_LIMIT || items.length >= total_count) {
      break;
    }
  }
  return items;
}

/** Every content item in the workspace; the default page of 100 used to hide the rest. */
export function useAllContent(workspaceId: string) {
  return useQuery({
    queryKey: ["content", workspaceId, "all"],
    queryFn: () =>
      fetchAllContent((page) => apiClient.content.list(workspaceId, page)),
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
/**
 * Moves articles to the trash (the backend's delete is soft: it sets `deleted_at`), one request each,
 * with one toast for all of them.
 */
export function useTrashContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      contentIds,
    }: {
      workspaceId: string;
      contentIds: string[];
    }) => {
      const results = await Promise.allSettled(
        contentIds.map((id) => apiClient.content.delete(workspaceId, id)),
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      return { moved: results.length - failed, failed };
    },
    onSuccess: ({ moved, failed }, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ["content", workspaceId] });
      if (failed === 0) {
        toast.success(
          moved === 1
            ? "Moved 1 article to the trash"
            : `Moved ${moved} articles to the trash`,
        );
      } else {
        toast.error(
          `${failed} of ${moved + failed} articles weren't moved to the trash. Try them again.`,
        );
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "The articles weren't moved to the trash");
    },
  });
}
