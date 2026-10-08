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
import type { UsageReport } from "@/types/subscription";

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
  /** The account's trash: the workspaces deleted and still restorable (Settings, Data and trash). */
  deleted: () =>
    queryOptions({
      queryKey: [...workspaceQueries.all(), "deleted"] as const,
      queryFn: () => apiClient.workspaces.getDeleted(),
      staleTime: 30_000,
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
// INCIDENT BANNER QUERIES
// ============================================================================

export const incidentBannerQueries = {
  all: () => ["incident-banner"] as const,
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
  /**
   * The person's trial: whether it is over with nothing bought since (`trial_expired`) and its end,
   * for the paywall's "Your trial ended on <date>".
   */
  trialStatus: () =>
    queryOptions({
      queryKey: [...subscriptionQueries.all(), "trial-status"] as const,
      queryFn: () => apiClient.subscriptions.getTrialStatus(),
      staleTime: 5 * 60 * 1000,
    }),
  /**
   * The person's billing action (F11): the shell's banner and the plan grid read it. A webhook
   * changes it, so it is read again when the window regains focus and after a minute.
   */
  billingAction: () =>
    queryOptions({
      queryKey: [...subscriptionQueries.all(), "billing-action"] as const,
      queryFn: () => apiClient.subscriptions.getBillingAction(),
      staleTime: 60 * 1000,
      // A failed read is retried by Try again or on focus, not by each component that mounts:
      // the plan grid mounts more readers once it knows, which would reset it to pending again.
      retryOnMount: false,
    }),
  /** The public plan catalogue; it changes with a release, not during a visit. */
  catalog: () =>
    queryOptions({
      queryKey: [...subscriptionQueries.all(), "catalog"] as const,
      queryFn: () => apiClient.subscriptions.getCatalog(),
      staleTime: 10 * 60 * 1000,
    }),
  /** The person's usage against their plan's limits (workspaces, members). */
  usage: () =>
    queryOptions({
      queryKey: [...subscriptionQueries.all(), "usage"] as const,
      queryFn: async () =>
        (await apiClient.subscriptions.getUsageStats()) as unknown as UsageReport,
    }),
  /** The person's purchases, newest first, with each one's refund state. */
  orders: () =>
    queryOptions({
      queryKey: [...subscriptionQueries.all(), "orders"] as const,
      queryFn: () => apiClient.subscriptions.getOrders(),
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
// CREDIT QUERIES
// ============================================================================

/**
 * The keys of the credits an admin changes (FB2.28); their options are in
 * lib/query-options/credits.ts.
 */
export const creditKeys = {
  /**
   * Every read of the signed-in person's credits: `subscriptionQueries.myCredits` and
   * `workspaceCredits`, and the history. A change to the credits refreshes them all.
   */
  mine: () => [...subscriptionQueries.all(), "credits"] as const,
  /** What Rext support changed in the signed-in person's credits. */
  history: () => [...creditKeys.mine(), "history"] as const,
  /** Every user's credits as a super admin reads them. */
  adminAll: () => ["admin-user-credits"] as const,
  adminUser: (userId: string) => [...creditKeys.adminAll(), userId] as const,
};

// ============================================================================
// ADMIN USER QUERIES
// ============================================================================

/**
 * The keys of a user's plan as a super admin reads and changes it (FB2.29); their options are in
 * lib/query-options/admin-plan.ts.
 */
export const adminPlanKeys = {
  /** Every user's plan as a super admin reads it. */
  all: () => ["admin-user-plan"] as const,
  user: (userId: string) => [...adminPlanKeys.all(), userId] as const,
  /** Every page of Admin > Users: its rows show each user's plan. */
  usersList: () => ["admin-users"] as const,
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
  /** One researched keyword, by its store key; null when it isn't in the caller's Library. */
  item: (workspaceId: string, userId: string, key: string) =>
    queryOptions({
      queryKey: ["library", workspaceId, userId, "item", key] as const,
      queryFn: async () => {
        const { readLibraryItem } = await import(
          "@/lib/generate-content/library-item"
        );
        return readLibraryItem(key, userId, workspaceId);
      },
      enabled: !!workspaceId && !!userId && !!key,
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
