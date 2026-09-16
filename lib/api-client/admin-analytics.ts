/**
 * Admin Analytics API Namespace
 *
 * Handles subscription analytics for super admin users
 * Requires super admin role for all endpoints
 */

import type { ApiClient } from "./core";
import { buildUrl } from "@/lib/url-utils";
import { ENDPOINTS } from "./endpoints";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AnalyticsOverview {
  total_subscriptions: number;
  active_subscriptions: number;
  trialing_subscriptions: number;
  suspended_subscriptions: number;
  cancelled_subscriptions: number;
  mrr: number;
  arr: number;
  churn_rate: number;
  trial_conversion_rate: number;
  avg_customer_ltv: number;
}

export interface RevenueMetrics {
  current_month: {
    mrr: number;
    new_revenue: number;
    expansion_revenue: number;
    contraction_revenue: number;
    churned_revenue: number;
  };
  by_plan: Array<{
    plan_name: string;
    plan_id: string;
    plan_display_name: string;
    revenue_monthly: number;
    revenue_yearly: number;
    subscription_count: number;
  }>;
  growth_rate: number;
}

export interface ChurnAnalysis {
  period: string;
  total_active_start: number;
  new_subscriptions: number;
  cancellations: number;
  total_active_end: number;
  churn_rate: number;
  retention_rate: number;
  cancellation_reasons: Record<string, number>;
  churn_by_plan?: Array<{
    plan_name: string;
    churned: number;
    total: number;
    churn_rate: number;
  }>;
}

export interface TrialConversionMetrics {
  total_trials_started: number;
  trials_converted: number;
  trials_expired: number;
  trials_active: number;
  trials_cancelled?: number;
  conversion_rate: number;
  average_trial_length_days: number;
  conversion_by_plan?: Array<{
    plan_name: string;
    trials: number;
    conversions: number;
    conversion_rate: number;
  }>;
  funnel?: Array<{
    stage: string;
    count: number;
  }>;
}

export interface AnalyticsApiResponse<T> {
  data: T;
  message?: string;
}

// Invitation Analytics Types
export interface InvitationAnalyticsSummary {
  total_invitations: number;
  accepted: number;
  declined: number;
  expired: number;
  pending: number;
  acceptance_rate: number;
  decline_rate: number;
  expiry_rate: number;
  avg_time_to_acceptance_hours: number;
}

export interface TopInviter {
  user_id: string;
  name: string;
  email: string;
  invitation_count: number;
}

export interface PopularRole {
  role_id: string;
  name: string;
  invitation_count: number;
}

export interface DailyTrend {
  date: string;
  total: number;
  accepted: number;
  pending: number;
}

export interface WorkspaceStat {
  workspace_id: string;
  name: string;
  total_invitations: number;
  accepted_invitations: number;
  acceptance_rate: number;
}

export interface InvitationAnalyticsData {
  summary: InvitationAnalyticsSummary;
  top_inviters: TopInviter[];
  popular_roles: PopularRole[];
  daily_trend: DailyTrend[];
  workspace_stats: WorkspaceStat[];
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
}

// ============================================================================
// ADMIN ANALYTICS NAMESPACE
// ============================================================================

export function createAdminAnalyticsNamespace(client: ApiClient) {
  return {
    /**
     * Get subscription analytics overview
     * Includes MRR, ARR, churn rate, trial conversion, LTV
     *
     * @requires Super admin role
     */
    getOverview: async (): Promise<AnalyticsOverview> => {
      return client.request<AnalyticsOverview>(
        ENDPOINTS.ADMIN_ANALYTICS.subscriptions.overview,
        {
          method: "GET",
        },
      );
    },

    /**
     * Get revenue metrics and breakdown
     * Includes current month revenue, revenue by plan, growth rate
     *
     * @requires Super admin role
     */
    getRevenueMetrics: async (): Promise<RevenueMetrics> => {
      return client.request<RevenueMetrics>(
        ENDPOINTS.ADMIN_ANALYTICS.subscriptions.revenue,
        {
          method: "GET",
        },
      );
    },

    /**
     * Get churn analysis for a specific period
     *
     * @param periodDays - Analysis period in days (default 30)
     * @requires Super admin role
     */
    getChurnAnalysis: async (periodDays = 30): Promise<ChurnAnalysis> => {
      return client.request<ChurnAnalysis>(
        `${ENDPOINTS.ADMIN_ANALYTICS.subscriptions.churn}?period_days=${periodDays}`,
        {
          method: "GET",
        },
      );
    },

    /**
     * Get trial conversion metrics
     * Includes conversion rates, average trial duration, breakdown by plan
     *
     * @requires Super admin role
     */
    getTrialConversion: async (): Promise<TrialConversionMetrics> => {
      return client.request<TrialConversionMetrics>(
        ENDPOINTS.ADMIN_ANALYTICS.subscriptions.trialConversion,
        {
          method: "GET",
        },
      );
    },

    /**
     * Get invitation analytics
     * Includes acceptance rates, top inviters, popular roles, daily trends
     *
     * @param days - Number of days to analyze (default 30)
     * @param workspaceId - Optional workspace filter
     * @requires audit.read permission
     */
    getInvitationAnalytics: async (
      days = 30,
      workspaceId?: string,
    ): Promise<InvitationAnalyticsData> => {
      return client.request<InvitationAnalyticsData>(
        buildUrl(ENDPOINTS.ADMIN_ANALYTICS.invitations.analytics, {
          days,
          workspace_id: workspaceId,
        }),
        {
          method: "GET",
        },
      );
    },
  };
}
