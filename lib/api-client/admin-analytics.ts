/**
 * Admin Analytics API Namespace
 *
 * Handles subscription analytics for super admin users
 * Requires super admin role for all endpoints
 */

import type {
  AnalyticsOverviewResponse,
  SubscriptionStatsResponse,
  TrialAnalyticsResponse,
  InvitationAnalyticsResponseSchema,
  ChurnAnalysisResponse,
  TrialConversionResponse,
} from "@/types/generated/types.gen";
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
      // The backend returns AnalyticsOverviewResponse which has a generic 'stats' object.
      // We cast it to our rigid AnalyticsOverview to maintain UI type safety.
      const response = await client.request<AnalyticsOverviewResponse>(
        ENDPOINTS.ADMIN_ANALYTICS.subscriptions.overview,
        {
          method: "GET",
        },
      );
      
      return response.stats as unknown as AnalyticsOverview;
    },

    /**
     * Get revenue metrics and breakdown
     * Includes current month revenue, revenue by plan, growth rate
     *
     * @requires Super admin role
     */
    getRevenueMetrics: async (): Promise<RevenueMetrics> => {
      // API currently returns RevenueMetrics compatible with our local type
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
      const response = await client.request<ChurnAnalysisResponse>(
        `${ENDPOINTS.ADMIN_ANALYTICS.subscriptions.churn}?period_days=${periodDays}`,
        {
          method: "GET",
        },
      );

      // Map generated ChurnAnalysisResponse to local ChurnAnalysis
      // Backend ChurnAnalysisResponse has cumulative stats, we keep local rigid for UI
      return {
        period_days: periodDays,
        churn_rate: response.churn_rate,
        churned_subscriptions: response.cancellations,
        total_subscriptions: response.total_active_end,
        revenue_lost: 0, // Field missing in backend response schema
        churn_by_plan: [], // Field missing in backend response schema
      } as ChurnAnalysis;
    },

    /**
     * Get trial conversion metrics
     * Includes conversion rates, average trial duration, breakdown by plan
     *
     * @requires Super admin role
     */
    getTrialConversion: async (): Promise<TrialConversionMetrics> => {
      const response = await client.request<TrialConversionResponse>(
        ENDPOINTS.ADMIN_ANALYTICS.subscriptions.trialConversion,
        {
          method: "GET",
        },
      );

      // Map generated TrialConversionResponse to local TrialConversionMetrics
      return {
        total_trials: response.total_trials_started,
        converted_trials: response.trials_converted,
        conversion_rate: response.conversion_rate,
        avg_trial_duration_days: response.average_trial_length_days,
        conversion_by_plan: [], // Field missing in backend response schema
      } as TrialConversionMetrics;
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
      // Map generated schema to our local rigid InvitationAnalyticsData
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
