"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { googleIntegrationQueries } from "@/lib/query-keys";
import type { GoogleSiteMappingRequest } from "@/types/google-integration";

/** Connection status: is Google connected for this workspace at all. */
export function useGoogleConnectionStatus(workspaceId: string) {
  return useQuery(googleIntegrationQueries.status(workspaceId));
}

/** Verified GSC properties for the connected account (site-mapping picker). */
export function useGoogleSearchConsoleSites(
  workspaceId: string,
  enabled = true,
) {
  return useQuery(
    googleIntegrationQueries.searchConsoleSites(workspaceId, enabled),
  );
}

/** Current GSC/GA4 mapping for one connected WordPress site. */
export function useGoogleSiteMapping(workspaceId: string, siteId: string) {
  return useQuery(googleIntegrationQueries.siteMapping(workspaceId, siteId));
}

/**
 * Redirects the browser to Google's consent screen. Not a useMutation since
 * there's nothing to await/invalidate — it's a full-page navigation away.
 */
export function useConnectGoogle() {
  return useMutation({
    mutationFn: async ({
      workspaceId,
      returnPath,
    }: {
      workspaceId: string;
      returnPath?: string;
    }) => {
      const { authorization_url } =
        await apiClient.googleIntegration.getAuthorizationUrl(
          workspaceId,
          returnPath,
        );
      return authorization_url;
    },
    onSuccess: (authorizationUrl) => {
      window.location.href = authorizationUrl;
    },
    onError: () => {
      toast.error("Failed to start Google connection. Please try again.");
    },
  });
}

export function useDisconnectGoogle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workspaceId: string) =>
      apiClient.googleIntegration.disconnect(workspaceId),
    onSuccess: (_data, workspaceId) => {
      queryClient.invalidateQueries({
        queryKey: googleIntegrationQueries.all(workspaceId),
      });
      toast.success("Google account disconnected");
    },
    onError: () => {
      toast.error("Failed to disconnect Google account");
    },
  });
}

export function useSaveGoogleSiteMapping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      workspaceId,
      siteId,
      data,
    }: {
      workspaceId: string;
      siteId: string;
      data: GoogleSiteMappingRequest;
    }) =>
      apiClient.googleIntegration.saveSiteMapping(workspaceId, siteId, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: googleIntegrationQueries.all(variables.workspaceId),
      });
      toast.success("Site mapping saved");
    },
    onError: () => {
      toast.error(
        "Failed to save site mapping — check the GA4 property ID is correct",
      );
    },
  });
}

export function useRemoveGoogleSiteMapping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      workspaceId,
      siteId,
    }: {
      workspaceId: string;
      siteId: string;
    }) => apiClient.googleIntegration.removeSiteMapping(workspaceId, siteId),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: googleIntegrationQueries.all(variables.workspaceId),
      });
      toast.success("Site mapping removed");
    },
    onError: () => {
      toast.error("Failed to remove site mapping");
    },
  });
}
