"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { subscriptionQueries } from "@/lib/query-keys";
import {
  type BackgroundGenerationJob,
  useBackgroundGenerationStore,
} from "@/stores/background-generation-store";

/** Where a run is, as far as what it changed: a pause and a failure spend or refund, an article is new. */
function stateOf(job: BackgroundGenerationJob): string {
  if (job.status !== "completed") return job.status;
  return job.awaitingInput ? "paused" : "finished";
}

/**
 * Keeps what a run changes current in this tab (D1a): when a run pauses at a gate it has spent
 * credits, and when it fails it may have been refunded, so its workspace's balance is fetched again.
 * At its first gate, the keyword's, a run has saved its research to the Library, which the home's
 * checklist and suggestions read. When it finishes its article, the workspace's article list is
 * fetched again too (the home's Continue, counts, checklist and suggestions read it). The dock
 * mounts it, so every workspace page sees the jobs change. The runs already paused or finished when
 * the jobs first load are in what those queries fetch anyway. The article list is refreshed once per
 * finished run, never on a timer: each fetch of it syncs every connected site; and the Library, which
 * is read page by page, once per run.
 */
export function useRefreshAfterRuns() {
  const queryClient = useQueryClient();
  const jobs = useBackgroundGenerationStore((state) => state.jobs);
  const loaded = useBackgroundGenerationStore((state) => state.hasHydrated);
  const seen = useRef<Map<string, string> | null>(null);
  const libraryRefreshed = useRef(new Set<string>());

  useEffect(() => {
    if (!loaded) return;
    if (!seen.current) {
      seen.current = new Map(jobs.map((job) => [job.threadId, stateOf(job)]));
      return;
    }
    for (const job of jobs) {
      const state = stateOf(job);
      const before = seen.current.get(job.threadId);
      seen.current.set(job.threadId, state);
      if (state === before || !job.workspaceId) continue;
      if (state === "paused" || state === "finished" || state === "failed") {
        queryClient.invalidateQueries({
          queryKey: subscriptionQueries.workspaceCredits(job.workspaceId)
            .queryKey,
        });
      }
      if (state === "paused" && !libraryRefreshed.current.has(job.threadId)) {
        libraryRefreshed.current.add(job.threadId);
        queryClient.invalidateQueries({
          queryKey: ["library", job.workspaceId],
        });
      }
      if (state === "finished") {
        queryClient.invalidateQueries({
          queryKey: ["content", job.workspaceId],
        });
      }
    }
  }, [jobs, loaded, queryClient]);
}
