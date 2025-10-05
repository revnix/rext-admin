/**
 * Subscription API service
 * Handles all subscription-related API calls
 */

import { authenticatedFetch } from "@/lib/auth-utils";
import type {
  SubscriptionCancelRequest,
  SubscriptionCreateRequest,
  SubscriptionHistoryResponse,
  SubscriptionListResponse,
  SubscriptionPlan,
  SubscriptionPlanCreate,
  SubscriptionPlanUpdate,
  SubscriptionUpgradeRequest,
  TrialStatus,
  UsageStats,
  UserSubscription,
} from "@/types/subscription";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:2024";

// ============================================================================
// SUBSCRIPTION PLAN APIs (Public + Admin)
// ============================================================================

/**
 * Get all available subscription plans
 */
export async function getSubscriptionPlans(): Promise<SubscriptionListResponse> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/v1/subscriptions/plans`,
    {
      method: "GET",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch subscription plans");
  }

  const data = await response.json();
  return data.data as SubscriptionListResponse;
}

/**
 * Get a specific subscription plan by ID
 */
export async function getSubscriptionPlan(
  planId: string,
): Promise<SubscriptionPlan> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/v1/subscriptions/plans/${planId}`,
    {
      method: "GET",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch subscription plan");
  }

  const data = await response.json();
  return data.data as SubscriptionPlan;
}

/**
 * Create a new subscription plan (admin only)
 */
export async function createSubscriptionPlan(
  plan: SubscriptionPlanCreate,
): Promise<SubscriptionPlan> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/v1/subscriptions/plans`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(plan),
    },
  );

  const data = await response.json();
  return data.data as SubscriptionPlan;
}

/**
 * Update a subscription plan (admin only)
 */
export async function updateSubscriptionPlan(
  planId: string,
  updates: SubscriptionPlanUpdate,
): Promise<SubscriptionPlan> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/v1/subscriptions/plans/${planId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    },
  );

  const data = await response.json();
  return data.data as SubscriptionPlan;
}

/**
 * Delete a subscription plan (admin only)
 */
export async function deleteSubscriptionPlan(planId: string): Promise<void> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/v1/subscriptions/plans/${planId}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete subscription plan");
  }
}

// ============================================================================
// USER SUBSCRIPTION APIs
// ============================================================================

/**
 * Subscribe to a plan
 */
export async function subscribe(
  request: SubscriptionCreateRequest,
): Promise<UserSubscription> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/v1/subscriptions/subscribe`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    },
  );

  const data = await response.json();
  return data.data as UserSubscription;
}

/**
 * Get current user's subscription
 */
export async function getMySubscription(): Promise<UserSubscription> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/v1/subscriptions/my-subscription`,
    {
      method: "GET",
    },
  );

  const data = await response.json();
  return data.data as UserSubscription;
}

/**
 * Get subscription history
 */
export async function getSubscriptionHistory(
  limit = 50,
  offset = 0,
): Promise<SubscriptionHistoryResponse> {
  const queryParams = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/v1/subscriptions/history?${queryParams}`,
    {
      method: "GET",
    },
  );

  const data = await response.json();
  return data.data as SubscriptionHistoryResponse;
}

/**
 * Upgrade or downgrade subscription plan
 */
export async function upgradeSubscription(
  request: SubscriptionUpgradeRequest,
): Promise<UserSubscription> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/v1/subscriptions/upgrade`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    },
  );

  const data = await response.json();
  return data.data as UserSubscription;
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  request: SubscriptionCancelRequest,
): Promise<UserSubscription> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/v1/subscriptions/cancel`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    },
  );

  const data = await response.json();
  return data.data as UserSubscription;
}

// ============================================================================
// USAGE TRACKING APIs
// ============================================================================

/**
 * Get usage statistics vs limits
 */
export async function getUsageStats(): Promise<UsageStats> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/v1/subscriptions/usage`,
    {
      method: "GET",
    },
  );

  const data = await response.json();
  return data.data as UsageStats;
}

/**
 * Get trial status and countdown
 */
export async function getTrialStatus(): Promise<TrialStatus> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/v1/subscriptions/trial-status`,
    {
      method: "GET",
    },
  );

  const data = await response.json();
  return data.data as TrialStatus;
}

// ============================================================================
// BACKWARD COMPATIBILITY (Class-based exports)
// ============================================================================

export const SubscriptionApiService = {
  getSubscriptionPlans,
  getSubscriptionPlan,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  subscribe,
  getMySubscription,
  getSubscriptionHistory,
  upgradeSubscription,
  cancelSubscription,
  getUsageStats,
  getTrialStatus,
};
