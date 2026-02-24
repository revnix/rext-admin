
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { apiClient } from "@/lib/api-client";
import type { BrandVoiceRefreshStoreState } from "@/types/workspace";
import { useWorkspaceCrudStore } from "./use-workspace-crud-store";

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
              isRefreshing: true,
              refreshError: undefined,
            },
          }));

          const response =
            await apiClient.workspaces.refreshBrandVoice(workspaceId);

          const operationId = response.operation_id;

          useWorkspaceCrudStore.getState().setCurrentOperation({ operationId, workspaceId });

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