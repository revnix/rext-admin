import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { apiClient } from "@/lib/api-client";
import type {
  BrandVoiceRefreshState,
  BrandVoiceRefreshStoreState,
} from "@/types/workspace";
import { useWorkspaceCrudStore } from "./use-workspace-crud-store";

/**
 * The refresh as one workspace sees it. The state is kept once for the whole app, so a run or a
 * failure in another workspace shows as nothing here.
 */
export function brandVoiceRefreshFor(
  refresh: BrandVoiceRefreshState,
  workspaceId: string | undefined,
): BrandVoiceRefreshState {
  return workspaceId && refresh.workspaceId === workspaceId
    ? refresh
    : { isRefreshing: false };
}

export const useBrandVoiceRefreshStore = create<BrandVoiceRefreshStoreState>()(
  devtools(
    (set) => ({
      brandVoiceRefresh: {
        isRefreshing: false,
        operationId: undefined,
        refreshError: undefined,
      },

      refreshBrandVoice: async (workspaceId) => {
        try {
          set((state) => ({
            brandVoiceRefresh: {
              ...state.brandVoiceRefresh,
              workspaceId,
              isRefreshing: true,
              operationId: undefined,
              refreshError: undefined,
            },
          }));

          const response =
            await apiClient.workspaces.refreshBrandVoice(workspaceId);

          const operationId = response.operation_id;

          useWorkspaceCrudStore
            .getState()
            .setCurrentOperation({ operationId, workspaceId });

          set((state) => ({
            brandVoiceRefresh: {
              ...state.brandVoiceRefresh,
              isRefreshing: true,
              operationId,
            },
          }));

          // Return operationId so the caller can set it on the CRUD store
          return operationId;
        } catch (error) {
          set((state) => ({
            brandVoiceRefresh: {
              ...state.brandVoiceRefresh,
              isRefreshing: false,
              operationId: undefined,
              refreshError:
                error instanceof Error
                  ? error.message
                  : "Failed to refresh brand voice",
            },
          }));
          throw error;
        }
      },

      setBrandVoiceRefreshState: (newState) => {
        set((state) => ({
          brandVoiceRefresh: {
            ...state.brandVoiceRefresh,
            ...newState,
          },
        }));
      },
    }),
    {
      name: "brand-voice-refresh-store",
    },
  ),
);
