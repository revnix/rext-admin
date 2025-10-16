import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { apiClient } from "@/lib/api-client";
import type { BrandVoiceRefreshStoreState } from "@/types/workspace";
import { useWorkspaceCrudStore } from "./use-workspace-crud-store";

/**
 * Brand Voice Refresh Store
 *
 * Manages brand voice refresh operations and tracking.
 * Handles async refresh requests and SSE operation tracking.
 */
export const useBrandVoiceRefreshStore = create<BrandVoiceRefreshStoreState>()(
  devtools(
    (set) => ({
      // Initial state
      brandVoiceRefresh: {
        isRefreshing: false,
        operationId: undefined,
        refreshError: undefined,
      },

      // ============================================================================
      // BRAND VOICE REFRESH ACTIONS
      // ============================================================================

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

          set((state) => ({
            brandVoiceRefresh: {
              ...state.brandVoiceRefresh,
              isRefreshing: true,
              operationId,
            },
          }));

          // Set operation in CRUD store for SSE tracking
          useWorkspaceCrudStore.getState().setCurrentOperation({
            operationId,
            workspaceId,
          });

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
