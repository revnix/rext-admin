/**
 * Admin Analytics API Namespace
 *
 * Handles subscription analytics for super admin users
 * Requires super admin role for all endpoints
 */

import type { ApiClient } from "./core";
import { buildUrl } from "@/lib/url-utils";

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
  current_month_revenue: number;
  revenue_by_plan: Array<{
    plan_name: string;
    plan_id: string;
    revenue: number;
    subscription_count: number;
  }>;
  growth_rate: number;
  previous_month_revenue: number;
}

export interface ChurnAnalysis {
  period_days: number;
  churn_rate: number;
  churned_subscriptions: number;
  total_subscriptions: number;
  revenue_lost: number;
  churn_by_plan: Array<{
    plan_name: string;
    churned: number;
    total: number;
    churn_rate: number;
  }>;
}

export interface TrialConversionMetrics {
  total_trials: number;
  converted_trials: number;
  conversion_rate: number;
  avg_trial_duration_days: number;
  conversion_by_plan: Array<{
    plan_name: string;
    trials: number;
    conversions: number;
    conversion_rate: number;
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
      const response = await client.request<
        AnalyticsApiResponse<AnalyticsOverview>
      >("/api/v1/admin/subscriptions/stats/overview", {
        method: "GET",
      });
      return response.data;
    },

    /**
     * Get revenue metrics and breakdown
     * Includes current month revenue, revenue by plan, growth rate
     *
     * @requires Super admin role
     */
    getRevenueMetrics: async (): Promise<RevenueMetrics> => {
      const response = await client.request<
        AnalyticsApiResponse<RevenueMetrics>
      >("/api/v1/admin/subscriptions/stats/revenue", {
        method: "GET",
      });
      return response.data;
    },

    /**
     * Get churn analysis for a specific period
     *
     * @param periodDays - Analysis period in days (default 30)
     * @requires Super admin role
     */
    getChurnAnalysis: async (periodDays = 30): Promise<ChurnAnalysis> => {
      const response = await client.request<
        AnalyticsApiResponse<ChurnAnalysis>
      >(`/api/v1/admin/subscriptions/stats/churn?period_days=${periodDays}`, {
        method: "GET",
      });
      return response.data;
    },

    /**
     * Get trial conversion metrics
     * Includes conversion rates, average trial duration, breakdown by plan
     *
     * @requires Super admin role
     */
    getTrialConversion: async (): Promise<TrialConversionMetrics> => {
      const response = await client.request<
        AnalyticsApiResponse<TrialConversionMetrics>
      >("/api/v1/admin/subscriptions/stats/trial-conversion", {
        method: "GET",
      });
      return response.data;
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
      const params = new URLSearchParams({ days: days.toString() });
      if (workspaceId) {
        params.append("workspace_id", workspaceId);
      }

      const response = await client.request<
        AnalyticsApiResponse<InvitationAnalyticsData>
      >(
        buildUrl("/api/v1/admin/analytics/invitations/analytics", {
          days,
          workspace_id: workspaceId,
        }),
        {
          method: "GET",
        },
      );
      return response.data;
    },
  };
}
