import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { apiClient } from "@/lib/api-client";
import type {
  BrandVoiceRefreshState,
  BrandVoiceRefreshStoreState,
} from "@/types/workspace";
import { useWorkspaceCrudStore } from "./use-workspace-crud-store";

const IDLE: BrandVoiceRefreshState = { isRefreshing: false };

/**
 * One workspace's refresh. Each workspace keeps its own, so a run or a failure in another
 * workspace, even one that finishes late, shows as nothing here.
 */
export function brandVoiceRefreshFor(
  refreshes: Record<string, BrandVoiceRefreshState>,
  workspaceId: string | undefined,
): BrandVoiceRefreshState {
  return (workspaceId && refreshes[workspaceId]) || IDLE;
}

function withRefresh(
  refreshes: Record<string, BrandVoiceRefreshState>,
  workspaceId: string,
  change: Partial<BrandVoiceRefreshState>,
) {
  return {
    brandVoiceRefresh: {
      ...refreshes,
      [workspaceId]: {
        ...brandVoiceRefreshFor(refreshes, workspaceId),
        ...change,
      },
    },
  };
}

export const useBrandVoiceRefreshStore = create<BrandVoiceRefreshStoreState>()(
  devtools(
    (set) => ({
      brandVoiceRefresh: {},

      refreshBrandVoice: async (workspaceId) => {
        try {
          set((state) =>
            withRefresh(state.brandVoiceRefresh, workspaceId, {
              isRefreshing: true,
              operationId: undefined,
              refreshError: undefined,
            }),
          );

          const response =
            await apiClient.workspaces.refreshBrandVoice(workspaceId);

          const operationId = response.operation_id;

          useWorkspaceCrudStore
            .getState()
            .setCurrentOperation({ operationId, workspaceId });

          set((state) =>
            withRefresh(state.brandVoiceRefresh, workspaceId, {
              isRefreshing: true,
              operationId,
            }),
          );

          // Return operationId so the caller can set it on the CRUD store
          return operationId;
        } catch (error) {
          set((state) =>
            withRefresh(state.brandVoiceRefresh, workspaceId, {
              isRefreshing: false,
              operationId: undefined,
              refreshError:
                error instanceof Error
                  ? error.message
                  : "Failed to refresh brand voice",
            }),
          );
          throw error;
        }
      },

      setBrandVoiceRefreshState: (workspaceId, newState) => {
        set((state) =>
          withRefresh(state.brandVoiceRefresh, workspaceId, newState),
        );
      },
    }),
    {
      name: "brand-voice-refresh-store",
    },
  ),
);
