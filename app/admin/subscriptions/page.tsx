"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { CohortRetentionMatrix } from "@/components/admin/analytics/cohort-retention-matrix";
import { PlanDistributionChart } from "@/components/admin/analytics/plan-distribution-chart";
import { RecentSubscriptionsTable } from "@/components/admin/analytics/recent-subscriptions-table";
import { RevenueChart } from "@/components/admin/analytics/revenue-chart";
import { SubscriptionKPIs } from "@/components/admin/analytics/subscription-kpis";
import { PageLayout } from "@/components/page-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api-client";

interface AnalyticsOverview {
  data: {
    stats: {
      total_subscriptions: number;
      active_subscriptions: number;
      trial_subscriptions: number;
      mrr: number;
      arr: number;
      churn_rate_monthly: number;
      trial_conversion_rate: number;
    };
    revenue_by_plan: unknown[];
    growth_metrics: {
      new_revenue_30d: number;
      growth_rate: number;
    };
    recent_subscriptions: Array<{
      subscription_id: string;
      user_email: string;
      user_name: string;
      plan_name: string;
      status: string;
      start_date: string | null;
    }>;
  };
}

interface RevenueHistory {
  data: Array<{
    month: string;
    mrr: number;
    new_revenue: number;
    churned_revenue: number;
    net_revenue: number;
  }>;
}

interface PlanDistribution {
  data: Array<{
    plan_name: string;
    plan_display_name: string;
    subscription_count: number;
    revenue_monthly: number;
    revenue_yearly: number;
    percentage: number;
  }>;
}

interface CohortRetention {
  data: {
    cohorts: Array<{
      cohort: string;
      size: number;
      month_0: number;
      [key: string]: number | string;
    }>;
  };
}

export default function SubscriptionAnalyticsPage() {
  const [revenuePeriod, setRevenuePeriod] = useState<
    "3_months" | "6_months" | "12_months"
  >("12_months");

  const breadcrumbs = [
    { label: "Admin", href: "/admin" },
    { label: "Subscription Analytics" },
  ];

  // Fetch analytics overview
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["admin", "subscriptions", "analytics", "overview"],
    queryFn: async () => {
      return apiClient
        .request<{ data: AnalyticsOverview }>(
          "/api/v1/subscriptions/admin/analytics/overview",
        )
        .then((res) => res.data);
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch revenue history
  const { data: revenueHistory, isLoading: historyLoading } = useQuery({
    queryKey: [
      "admin",
      "subscriptions",
      "analytics",
      "revenue-history",
      revenuePeriod,
    ],
    queryFn: async () => {
      return apiClient
        .request<{ data: RevenueHistory }>(
          `/api/v1/subscriptions/admin/analytics/revenue-history?period=${revenuePeriod}`,
        )
        .then((res) => res.data);
    },
  });

  // Fetch plan distribution
  const { data: planDistribution, isLoading: distributionLoading } = useQuery({
    queryKey: ["admin", "subscriptions", "analytics", "plan-distribution"],
    queryFn: async () => {
      return apiClient
        .request<{ data: PlanDistribution }>(
          "/api/v1/subscriptions/admin/analytics/plan-distribution",
        )
        .then((res) => res.data);
    },
  });

  // Fetch cohort retention
  const { data: cohortRetention, isLoading: cohortLoading } = useQuery({
    queryKey: ["admin", "subscriptions", "analytics", "cohort-retention"],
    queryFn: async () => {
      return apiClient
        .request<{ data: CohortRetention }>(
          "/api/v1/subscriptions/admin/analytics/cohort-retention",
        )
        .then((res) => res.data);
    },
  });

  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const stats = overview?.data?.stats;
  const _revenueByPlan = overview?.data?.revenue_by_plan;
  const growthMetrics = overview?.data?.growth_metrics;
  const recentSubscriptions = overview?.data?.recent_subscriptions;

  return (
    <PageLayout
      title="Subscription Analytics"
      description="Comprehensive insights into subscription performance and revenue metrics"
      breadcrumbs={breadcrumbs}
    >
      <div className="space-y-8">
        {/* KPI Cards */}
        {stats && (
          <SubscriptionKPIs stats={stats} growthMetrics={growthMetrics} />
        )}

        {/* Charts and Analytics */}
        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="distribution">Plan Distribution</TabsTrigger>
            <TabsTrigger value="retention">Cohort Retention</TabsTrigger>
            <TabsTrigger value="subscriptions">
              Recent Subscriptions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Over Time</CardTitle>
                <CardDescription>
                  Monthly recurring revenue, new revenue, and churn
                </CardDescription>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <RevenueChart
                    data={revenueHistory?.data || []}
                    period={revenuePeriod}
                    onPeriodChange={(p) =>
                      setRevenuePeriod(p as typeof revenuePeriod)
                    }
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="distribution" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Distribution by Plan</CardTitle>
                <CardDescription>
                  Active subscriptions and revenue breakdown by plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                {distributionLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <PlanDistributionChart data={planDistribution?.data || []} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="retention" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cohort Retention Analysis</CardTitle>
                <CardDescription>
                  Month-over-month retention rates by cohort
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cohortLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <CohortRetentionMatrix
                    cohorts={cohortRetention?.data?.cohorts || []}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Subscriptions</CardTitle>
                <CardDescription>
                  Latest 10 subscription activations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentSubscriptionsTable
                  subscriptions={recentSubscriptions || []}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
