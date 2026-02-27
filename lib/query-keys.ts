/**
 * Centralized Query Key Factory
 *
 * Single source of truth for all TanStack Query keys and query options.
 * Uses the queryOptions pattern recommended by TanStack Query v5 for:
 * - Type safety
 * - Consistent key structure
 * - Co-location of keys with query functions
 * - Automatic TypeScript inference
 *
 * @see https://tanstack.com/query/v5/docs/framework/react/guides/query-options
 */

import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// ============================================================================
// WORKSPACE QUERIES
// ============================================================================

export const workspaceQueries = {
  all: () => ["workspaces"] as const,
  lists: () => [...workspaceQueries.all(), "list"] as const,
  list: () =>
    queryOptions({
      queryKey: [...workspaceQueries.lists()],
      queryFn: () => apiClient.workspaces.list(),
    }),
  details: () => [...workspaceQueries.all(), "detail"] as const,
  detail: (workspaceId: string) =>
    queryOptions({
      queryKey: [...workspaceQueries.details(), workspaceId] as const,
      queryFn: async () => {
        // Determine if workspaceId is a UUID or slug
        const isUuid =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            workspaceId,
          );
        return isUuid
          ? apiClient.workspaces.get(workspaceId)
          : apiClient.workspaces.getBySlug(workspaceId);
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    }),
  permissions: (workspaceId: string) =>
    queryOptions({
      queryKey: [
        ...workspaceQueries.all(),
        "permissions",
        workspaceId,
      ] as const,
      queryFn: () => apiClient.workspaces.getPermissions(workspaceId),
    }),
  stats: (workspaceId: string) =>
    queryOptions({
      queryKey: [...workspaceQueries.all(), "stats", workspaceId] as const,
      queryFn: () => apiClient.workspaces.getStats(workspaceId),
    }),
  availableRoles: () =>
    queryOptions({
      queryKey: [...workspaceQueries.all(), "available-roles"] as const,
      queryFn: () => apiClient.workspaces.getAvailableRoles(),
    }),
  switcher: () =>
    queryOptions({
      queryKey: [...workspaceQueries.all(), "switcher"] as const,
      queryFn: () => apiClient.workspaces.list(),
    }),
  brandVoice: (workspaceId: string) =>
    queryOptions({
      queryKey: [
        ...workspaceQueries.all(),
        "brand-voice",
        workspaceId,
      ] as const,
      queryFn: () => apiClient.workspaces.getBrandVoice(workspaceId),
      enabled: !!workspaceId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }),
};

// ============================================================================
// WORKSPACE MEMBER QUERIES
// ============================================================================

export const memberQueries = {
  all: (workspaceId: string) => ["workspace-members", workspaceId] as const,
  list: (workspaceId: string) =>
    queryOptions({
      queryKey: [...memberQueries.all(workspaceId)],
      queryFn: () => apiClient.members.list(workspaceId),
    }),
};

// ============================================================================
// INVITATION QUERIES
// ============================================================================

export const invitationQueries = {
  all: () => ["invitations"] as const,
  sent: (workspaceId: string) =>
    queryOptions({
      queryKey: [...invitationQueries.all(), "sent", workspaceId] as const,
      queryFn: () => apiClient.invitations.listSent(workspaceId),
    }),
  received: () =>
    queryOptions({
      queryKey: [...invitationQueries.all(), "received"] as const,
      queryFn: () => apiClient.invitations.listReceived(),
    }),
  pending: () =>
    queryOptions({
      queryKey: [...invitationQueries.all(), "pending"] as const,
      queryFn: () => apiClient.invitations.pending(),
    }),
  validation: (token: string) =>
    queryOptions({
      queryKey: [...invitationQueries.all(), "validation", token] as const,
      queryFn: () => apiClient.invitations.validate(token),
      enabled: !!token,
    }),
};

// ============================================================================
// MEDIA QUERIES
// ============================================================================

export const mediaQueries = {
  all: (workspaceId: string) => ["media", workspaceId] as const,
  list: (workspaceId: string, params?: Record<string, unknown>) =>
    queryOptions({
      queryKey: [...mediaQueries.all(workspaceId), "list", params] as const,
      queryFn: () => apiClient.media.list(workspaceId, params),
    }),
  picker: (workspaceId: string, params?: Record<string, unknown>) =>
    queryOptions({
      queryKey: [...mediaQueries.all(workspaceId), "picker", params] as const,
      queryFn: () => apiClient.media.list(workspaceId, params),
    }),
  usage: (workspaceId: string) =>
    queryOptions({
      queryKey: [...mediaQueries.all(workspaceId), "usage"] as const,
      queryFn: () => apiClient.media.getUsage(workspaceId),
    }),
  mediaUsage: (workspaceId: string, mediaId: string) =>
    queryOptions({
      queryKey: [
        ...mediaQueries.all(workspaceId),
        "media-usage",
        mediaId,
      ] as const,
      queryFn: () => apiClient.media.getMediaUsage(workspaceId, mediaId),
    }),
};

// ============================================================================
// PROFILE QUERIES
// ============================================================================

export const profileQueries = {
  all: () => ["profile"] as const,
  detail: () =>
    queryOptions({
      queryKey: profileQueries.all(),
      queryFn: () => apiClient.profile.get(),
    }),
};

// ============================================================================
// SESSION & SECURITY QUERIES
// ============================================================================

export const sessionQueries = {
  all: () => ["user-sessions"] as const,
  list: () =>
    queryOptions({
      queryKey: sessionQueries.all(),
      queryFn: () => apiClient.sessions.list(),
    }),
};

export const securityQueries = {
  all: () => ["security"] as const,
  stats: () =>
    queryOptions({
      queryKey: [...securityQueries.all(), "stats"] as const,
      queryFn: () => apiClient.security.getStats(),
    }),
};

// ============================================================================
// PREFERENCES QUERIES
// ============================================================================

export const preferencesQueries = {
  all: () => ["preferences"] as const,
  detail: () =>
    queryOptions({
      queryKey: preferencesQueries.all(),
      queryFn: () => apiClient.preferences.get(),
    }),
};

// ============================================================================
// IMPERSONATION QUERIES
// ============================================================================

export const impersonationQueries = {
  all: () => ["impersonation"] as const,
  status: () =>
    queryOptions({
      queryKey: [...impersonationQueries.all(), "status"] as const,
      queryFn: () => apiClient.impersonation.getStatus(),
    }),
};

// ============================================================================
// OAUTH QUERIES
// ============================================================================

export const oauthQueries = {
  all: () => ["oauth-accounts"] as const,
  accounts: () =>
    queryOptions({
      queryKey: oauthQueries.all(),
      queryFn: () => apiClient.profile.get(), // Adjust based on actual API
    }),
};

// ============================================================================
// SUBSCRIPTION QUERIES
// ============================================================================

export const subscriptionQueries = {
  all: () => ["subscriptions"] as const,
  current: () =>
    queryOptions({
      queryKey: [...subscriptionQueries.all(), "current"] as const,
      queryFn: () => apiClient.subscriptions.getCurrentPlan(),
    }),
  plans: () =>
    queryOptions({
      queryKey: [...subscriptionQueries.all(), "plans"] as const,
      queryFn: () => apiClient.subscriptions.getPlans(),
    }),
};

// ============================================================================
// ADMIN QUERIES
// ============================================================================

export const adminQueries = {
  roles: {
    all: () => ["roles"] as const,
    list: () =>
      queryOptions({
        queryKey: adminQueries.roles.all(),
        queryFn: () => apiClient.roles.list(true),
      }),
  },
  permissions: {
    all: () => ["permissions"] as const,
    list: () =>
      queryOptions({
        queryKey: adminQueries.permissions.all(),
        queryFn: () => apiClient.roles.listPermissions(),
      }),
  },
  invitations: {
    all: () => ["admin-invitations"] as const,
    list: (status?: string) =>
      queryOptions({
        queryKey: [...adminQueries.invitations.all(), status] as const,
        queryFn: () => apiClient.adminInvitations.list({ status }),
      }),
  },
  customers: {
    all: () => ["admin", "customers"] as const,
    detail: (customerId: string) =>
      queryOptions({
        queryKey: [...adminQueries.customers.all(), customerId] as const,
        queryFn: () => apiClient.users.get(customerId), // Adjust based on actual API
      }),
  },
  auditLogs: {
    all: () => ["audit-logs"] as const,
    list: (action?: string, startDate?: string, endDate?: string) =>
      queryOptions({
        queryKey: [
          ...adminQueries.auditLogs.all(),
          action,
          startDate,
          endDate,
        ] as const,
        queryFn: () =>
          apiClient.auditLogs.getMyLogs({
            action,
            start_date: startDate,
            end_date: endDate,
          }),
      }),
  },
};

// ============================================================================
// PERSONA QUERIES
// ============================================================================

export const personaQueries = {
  all: (workspaceId: string) =>
    [...workspaceQueries.all(), workspaceId, "personas"] as const,
  lists: (workspaceId: string) =>
    [...personaQueries.all(workspaceId), "list"] as const,
  list: (workspaceId: string) =>
    queryOptions({
      queryKey: [...personaQueries.lists(workspaceId)],
      queryFn: () => apiClient.personas.list(workspaceId),
      enabled: !!workspaceId,
      staleTime: 5 * 60 * 1000,
    }),
  details: (workspaceId: string) =>
    [...personaQueries.all(workspaceId), "detail"] as const,
  detail: (workspaceId: string, personaId: string) =>
    queryOptions({
      queryKey: [...personaQueries.details(workspaceId), personaId] as const,
      queryFn: () => apiClient.personas.get(workspaceId, personaId),
      enabled: !!workspaceId && !!personaId,
      staleTime: 5 * 60 * 1000,
    }),
};
