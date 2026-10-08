"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { refreshPersonaCounts } from "@/hooks/use-personas";
import { apiClient } from "@/lib/api-client";
import type {
  CalendarResponse,
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

/** Home's content health counts (FB2.27a): missing meta descriptions, no link to the own site.
 * Under the content key, so whatever refreshes the workspace's content refreshes these too. */
export function useContentHealthCounts(workspaceId: string) {
  return useQuery({
    queryKey: ["content", workspaceId, "health"],
    queryFn: () => apiClient.content.health(workspaceId),
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
      refreshPersonaCounts(queryClient, variables.workspaceId);
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
 * Saves an article without a word: the full-screen editor's autosave (task 706), which shows its own
 * save state and retries by itself (hooks/use-autosave.ts), so there is no toast and no retry here.
 * The caches that hold the article are refreshed as after any update.
 */
export function useAutosaveContent() {
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
    retry: false,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["content", variables.workspaceId],
      });
    },
  });
}

/**
 * Saves an article the Generate flow has just written, before the full-screen editor opens on it
 * (task 706). The backend keeps one row for a run, so the save lands on the run's own article. No
 * toast and no retry: the page says in its own words when the editor couldn't be opened.
 */
export function useSaveGeneratedContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      data,
    }: {
      workspaceId: string;
      data: Record<string, unknown>;
    }) => apiClient.content.save(workspaceId, data),
    retry: false,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["content", variables.workspaceId],
      });
    },
  });
}

/**
 * An article's kept versions (task 706), newest first. Under the article's own key, so every save
 * of it refreshes the list. No retry: the editor shows its History only when this answers, and a
 * backend without the route answers 404 at once.
 */
export function useContentVersions(workspaceId: string, contentId: string) {
  return useQuery({
    queryKey: ["content", workspaceId, contentId, "versions"],
    queryFn: () => apiClient.content.versions(workspaceId, contentId),
    enabled: !!workspaceId && !!contentId,
    retry: false,
  });
}

/** One version with its text, read when it is opened in the History. */
export function useContentVersion(
  workspaceId: string,
  contentId: string,
  versionId: string | null,
) {
  return useQuery({
    queryKey: ["content", workspaceId, contentId, "versions", versionId],
    queryFn: () =>
      apiClient.content.version(workspaceId, contentId, versionId as string),
    enabled: !!workspaceId && !!contentId && !!versionId,
    retry: false,
  });
}

/**
 * Puts a version's text back on the article. No toast: the History says what happened in its own
 * words. The article and its versions are read again after it.
 */
export function useRestoreContentVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      contentId,
      versionId,
    }: {
      workspaceId: string;
      contentId: string;
      versionId: string;
    }) => apiClient.content.restoreVersion(workspaceId, contentId, versionId),
    retry: false,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["content", variables.workspaceId],
      });
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
 * Moves a scheduled publish to another day. The month on screen moves the item at once and puts it
 * back if the backend refuses; the caller says what happened (its toast carries the undo).
 */
export function useRescheduleContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      contentId,
      toDay,
    }: {
      workspaceId: string;
      contentId: string;
      /** The day it sits on now, `YYYY-MM-DD`. */
      fromDay: string;
      /** The day it moves to, `YYYY-MM-DD`. */
      toDay: string;
    }) => apiClient.content.reschedule(workspaceId, contentId, toDay),
    onMutate: async ({ workspaceId, contentId, fromDay, toDay }) => {
      const key = ["content-calendar", workspaceId];
      await queryClient.cancelQueries({ queryKey: key });
      const before = queryClient.getQueriesData<CalendarResponse>({
        queryKey: key,
      });
      queryClient.setQueriesData<CalendarResponse>({ queryKey: key }, (data) =>
        data ? moveCalendarEntry(data, contentId, fromDay, toDay) : data,
      );
      return { before };
    },
    onError: (error: Error, _variables, context) => {
      for (const [key, data] of context?.before ?? []) {
        queryClient.setQueryData(key, data);
      }
      toast.error(error.message || "The article couldn't move to that day");
    },
    onSettled: (_data, _error, { workspaceId }) => {
      queryClient.invalidateQueries({
        queryKey: ["content-calendar", workspaceId],
      });
      queryClient.invalidateQueries({ queryKey: ["content", workspaceId] });
    },
  });
}

/**
 * A calendar month with one content item's scheduled entries moved from one day to another. The
 * new day may be outside the month: the entries then leave it.
 */
export function moveCalendarEntry(
  data: CalendarResponse,
  contentId: string,
  fromDay: string,
  toDay: string,
): CalendarResponse {
  const moving = (data.calendar[fromDay] ?? []).filter(
    (entry) => entry.id === contentId && entry.status === "scheduled",
  );
  if (moving.length === 0 || fromDay === toDay) return data;
  const calendar = { ...data.calendar };
  const staying = (calendar[fromDay] ?? []).filter(
    (entry) => !moving.includes(entry),
  );
  if (staying.length > 0) calendar[fromDay] = staying;
  else delete calendar[fromDay];
  const inMonth = toDay.slice(0, 7) === fromDay.slice(0, 7);
  if (inMonth) calendar[toDay] = [...(calendar[toDay] ?? []), ...moving];
  return {
    ...data,
    calendar,
    total_items: inMonth ? data.total_items : data.total_items - moving.length,
  };
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
      refreshPersonaCounts(queryClient, workspaceId);
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
