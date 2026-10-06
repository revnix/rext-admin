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
  /**
   * The single workspace-list query. Keyed exactly ["workspaces"] so every
   * consumer (dashboard, /w, switcher, admin filters, auto-select) shares one
   * cache entry — previous per-caller keys ("workspaces", "workspaces/switcher",
   * "workspaces-for-logs") caused parallel duplicate GET /workspaces/all.
   */
  list: () =>
    queryOptions({
      queryKey: [...workspaceQueries.all()],
      queryFn: () => apiClient.workspaces.list(),
      staleTime: 5 * 60 * 1000, // 5 minutes
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
  availableRoles: () =>
    queryOptions({
      queryKey: [...workspaceQueries.all(), "available-roles"] as const,
      queryFn: () => apiClient.workspaces.getAvailableRoles(),
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
// DASHBOARD QUERIES
// ============================================================================

export const dashboardQueries = {
  /** The workspace's counts; the home page and the sidebar's drafts badge share this entry. */
  stats: (workspaceId: string) =>
    queryOptions({
      queryKey: ["dashboard-stats", workspaceId] as const,
      queryFn: () => apiClient.dashboard.getStats(workspaceId),
      enabled: !!workspaceId,
      staleTime: 30 * 1000,
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
// PROFILE QUERIES
// ============================================================================

export const profileQueries = {
  all: () => ["profile"] as const,
  detail: () =>
    queryOptions({
      queryKey: profileQueries.all(),
      queryFn: () => apiClient.profile.get(),
      staleTime: 5 * 60 * 1000, // 5 minutes (user profile rarely changes during a session)
      refetchOnWindowFocus: false,
    }),
};

export const onboardingQueries = {
  all: () => ["onboarding"] as const,
  /**
   * Whether the first-login questions are for this user; asked once a session. It keeps the
   * client's retries (server errors and network failures), since nothing asks again this session.
   */
  shouldShow: () =>
    queryOptions({
      queryKey: [...onboardingQueries.all(), "should-show"] as const,
      queryFn: () => apiClient.onboarding.shouldShow(),
      staleTime: Number.POSITIVE_INFINITY,
      refetchOnWindowFocus: false,
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
  /** The public plan catalogue; it changes with a release, not during a visit. */
  catalog: () =>
    queryOptions({
      queryKey: [...subscriptionQueries.all(), "catalog"] as const,
      queryFn: () => apiClient.subscriptions.getCatalog(),
      staleTime: 10 * 60 * 1000,
    }),
  /** The signed-in person's own credits and plan. */
  myCredits: () =>
    queryOptions({
      queryKey: [...subscriptionQueries.all(), "credits", "self"] as const,
      queryFn: () => apiClient.subscriptions.getCredits(),
    }),
  /** One workspace's credits, which carry its owner's plan (the workspace switcher's plan line). */
  workspaceCredits: (workspaceId: string) =>
    queryOptions({
      queryKey: [...subscriptionQueries.all(), "credits", workspaceId] as const,
      queryFn: () => apiClient.subscriptions.getCredits(workspaceId),
      staleTime: 60 * 1000,
    }),
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

// ============================================================================
// KEYWORD LIBRARY QUERIES
// ============================================================================

export const libraryQueries = {
  /**
   * The caller's researched keywords in a workspace (the LangGraph store's Library, which is per
   * user), newest first, one per keyword.
   */
  list: (workspaceId: string, userId: string) =>
    queryOptions({
      queryKey: ["library", workspaceId, userId] as const,
      // Imported when first asked for, so the store's SDK stays out of every page's bundle.
      queryFn: async () => {
        const { searchLibrary } = await import(
          "@/lib/generate-content/library-item"
        );
        return searchLibrary(userId, workspaceId);
      },
      enabled: !!workspaceId && !!userId,
      // Research is saved by the run, which knows nothing of this key: ask again on every visit.
      staleTime: 0,
    }),
};

// ============================================================================
// INTEGRATION QUERIES
// ============================================================================

export const integrationQueries = {
  all: (workspaceId: string) =>
    [...workspaceQueries.all(), workspaceId, "integrations"] as const,
  list: (workspaceId: string) =>
    queryOptions({
      queryKey: [...integrationQueries.all(workspaceId), "list"] as const,
      queryFn: () => apiClient.integrations.list(workspaceId),
      enabled: !!workspaceId,
    }),
};
