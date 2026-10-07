"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { workspaceQueries } from "@/lib/query-keys";
import {
  PIPELINE_POLL_MS,
  type WorkspacePipeline,
} from "@/lib/workspace/workspace-pipeline";

/**
 * The workspace pipeline's latest run, read from the workspace itself (the detail query every
 * workspace screen shares). `poll` reads it again every few seconds, while a screen follows a run.
 */
export function useWorkspacePipeline(
  workspaceId: string | null | undefined,
  { poll = false }: { poll?: boolean } = {},
) {
  return useQuery({
    ...workspaceQueries.detail(workspaceId ?? ""),
    enabled: Boolean(workspaceId),
    select: (data): WorkspacePipeline | null => data.workspace.pipeline ?? null,
    refetchInterval: poll ? PIPELINE_POLL_MS : false,
  });
}

/** Reading the website again after a run that failed or was interrupted: the new run's operation id. */
export function useRetryWorkspacePipeline() {
  return useMutation({
    mutationFn: async (workspaceId: string) =>
      (await apiClient.workspaces.retryPipeline(workspaceId)).operation_id,
  });
}
