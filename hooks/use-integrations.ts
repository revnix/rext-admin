/**
 * Integrations Hooks
 *
 * React Query hooks for a workspace's WordPress sites. The components keep
 * their own toasts and analytics; these keep the list fresh.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  ConnectWordPressRequest,
  Integration,
  UpdateWordPressRequest,
} from "@/lib/api-client/integrations";
import { integrationQueries } from "@/lib/query-keys";

/**
 * The workspace's connected sites
 */
export function useIntegrations(workspaceId: string | null, enabled = true) {
  return useQuery({
    ...integrationQueries.list(workspaceId || ""),
    enabled: !!workspaceId && enabled,
  });
}

function useRefreshIntegrations(workspaceId: string) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: integrationQueries.all(workspaceId),
    });
}

/**
 * Connect a WordPress site
 */
export function useConnectWordPress(workspaceId: string) {
  const refresh = useRefreshIntegrations(workspaceId);
  return useMutation({
    mutationFn: (data: ConnectWordPressRequest) =>
      apiClient.integrations.connect(workspaceId, data),
    onSuccess: refresh,
  });
}

/**
 * Change a site's address, endpoint, key or state
 */
export function useUpdateWordPress(workspaceId: string) {
  const refresh = useRefreshIntegrations(workspaceId);
  return useMutation({
    mutationFn: ({
      siteId,
      data,
    }: {
      siteId: string;
      data: UpdateWordPressRequest;
    }) => apiClient.integrations.update(workspaceId, siteId, data),
    onSuccess: refresh,
  });
}

/**
 * Turn publishing to a site on or off; the list shows the change at once and
 * goes back if the backend refuses it
 */
export function useSetIntegrationActive(workspaceId: string) {
  const queryClient = useQueryClient();
  const { queryKey } = integrationQueries.list(workspaceId);

  return useMutation({
    mutationFn: ({ siteId, active }: { siteId: string; active: boolean }) =>
      apiClient.integrations.setActive(workspaceId, siteId, active),
    onMutate: async ({ siteId, active }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Integration[]>(queryKey);
      queryClient.setQueryData<Integration[]>(queryKey, (sites) =>
        sites?.map((site) =>
          site.id === siteId ? { ...site, is_active: active } : site,
        ),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}

/**
 * Test a site's stored credentials again
 */
export function useTestWordPress(workspaceId: string) {
  return useMutation({
    mutationFn: (siteId: string) =>
      apiClient.integrations.test(workspaceId, siteId),
  });
}

/**
 * Disconnect a site
 */
export function useDisconnectWordPress(workspaceId: string) {
  const refresh = useRefreshIntegrations(workspaceId);
  return useMutation({
    mutationFn: (siteId: string) =>
      apiClient.integrations.disconnect(workspaceId, siteId),
    onSuccess: refresh,
  });
}
