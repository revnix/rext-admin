"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Settings } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CohortRetentionMatrix } from "@/components/admin/analytics/cohort-retention-matrix";
import { RecentSubscriptionsTable } from "@/components/admin/analytics/recent-subscriptions-table";
import { SubscriptionKPIs } from "@/components/admin/analytics/subscription-kpis";
import { Badge } from "@/components/ui/badge";
import { PageLayout } from "@/components/page-layout";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Lazy load chart components (use recharts - heavy library ~400KB)
const RevenueChart = dynamic(
  () =>
    import("@/components/admin/analytics/revenue-chart").then(
      (mod) => mod.RevenueChart,
    ),
  {
    loading: () => (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-100 w-full" />
        </CardContent>
      </Card>
    ),
    ssr: false,
  },
);

const PlanDistributionChart = dynamic(
  () =>
    import("@/components/admin/analytics/plan-distribution-chart").then(
      (mod) => mod.PlanDistributionChart,
    ),
  {
    loading: () => (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-75 w-full" />
        </CardContent>
      </Card>
    ),
    ssr: false,
  },
);

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api-client";
import { SUBSCRIPTION_PERMISSIONS } from "@/lib/permissions";

interface AnalyticsOverview {
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
    user_email_masked: string;
    user_name: string;
    plan_name: string;
    status: string;
    start_date: string | null;
  }>;
}

interface SubscriptionStats {
  total_subscriptions: number;
  active_subscriptions: number;
  trial_subscriptions: number;
  cancelled_subscriptions: number;
  expired_subscriptions: number;
  suspended_subscriptions: number;
  mrr: number;
  arr: number;
  churn_rate_monthly: number;
  trial_conversion_rate: number;
  average_ltv: number | null;
}

type RevenueHistory = Array<{
  month: string;
  mrr: number;
  new_revenue: number;
  churned_revenue: number;
  net_revenue: number;
}>;

type PlanDistribution = Array<{
  plan_id: string;
  plan_name: string;
  plan_display_name: string;
  subscription_count: number;
  revenue_monthly: number;
  revenue_yearly: number;
  percentage: number;
}>;

type PlanDistributionItem = PlanDistribution[number];

const formatCurrency = (value: number | undefined | null): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const formatPercentage = (value: number | undefined | null): string =>
  `${(value ?? 0).toFixed(1)}%`;
const toNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toPlanDistributionArray = (value: unknown): PlanDistribution => {
  if (!Array.isArray(value)) return [];

  const normalized = value
    .map((item): PlanDistributionItem | null => {
      if (!isRecord(item)) return null;

      const planName = String(item.plan_name ?? item.name ?? "").trim();
      if (!planName) return null;

      return {
        plan_id: String(item.plan_id ?? item.id ?? planName),
        plan_name: planName,
        plan_display_name: String(
          item.plan_display_name ?? item.display_name ?? planName,
        ),
        subscription_count: toNumber(
          item.subscription_count ?? item.count ?? item.subscriptions,
        ),
        revenue_monthly: toNumber(
          item.revenue_monthly ?? item.monthly_revenue ?? item.mrr,
        ),
        revenue_yearly: toNumber(
          item.revenue_yearly ?? item.yearly_revenue ?? item.arr,
        ),
        percentage: toNumber(item.percentage),
      };
    })
    .filter((item): item is PlanDistributionItem => item !== null);

  if (normalized.length === 0) return normalized;

  const hasPercentage = normalized.some((item) => item.percentage > 0);
  if (hasPercentage) return normalized;

  const total = normalized.reduce(
    (acc, item) => acc + item.subscription_count,
    0,
  );
  if (total <= 0) return normalized;

  return normalized.map((item) => ({
    ...item,
    percentage: (item.subscription_count / total) * 100,
  }));
};

const normalizePlanDistribution = (payload: unknown): PlanDistribution => {
  const directArray = toPlanDistributionArray(payload);
  if (directArray.length > 0) return directArray;

  if (!isRecord(payload)) return [];

  const candidateKeys = [
    "plan_distribution",
    "distribution",
    "plans",
    "items",
    "by_plan",
    "revenue_by_plan",
    "data",
  ] as const;

  const nestedCandidates: unknown[] = [payload];
  for (const key of candidateKeys) {
    nestedCandidates.push(payload[key]);
  }

  for (const candidate of nestedCandidates) {
    const candidateArray = toPlanDistributionArray(candidate);
    if (candidateArray.length > 0) return candidateArray;

    if (isRecord(candidate)) {
      for (const key of candidateKeys) {
        const deepCandidate = toPlanDistributionArray(candidate[key]);
        if (deepCandidate.length > 0) return deepCandidate;
      }
    }
  }

  return toPlanDistributionArray(payload);
};

interface CohortRetention {
  cohorts: Array<{
    cohort: string;
    size: number;
    month_0: number;
    [key: string]: number | string;
  }>;
}

export default function SubscriptionAnalyticsPage() {
  const [revenuePeriod, setRevenuePeriod] = useState<
    "3_months" | "6_months" | "12_months"
  >("12_months");
  const [churnPeriod, setChurnPeriod] = useState(30);
  const [revenueDisplayPeriod, setRevenueDisplayPeriod] = useState<
    "monthly" | "yearly"
  >("monthly");

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["admin", "subscriptions", "analytics", "overview"],
    queryFn: async () => {
      return apiClient.request<AnalyticsOverview>(
        "/api/v1/admin/subscriptions/analytics/overview",
      );
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch analytics overview
  const { data: stats } = useQuery({
    queryKey: ["admin", "subscriptions", "stats", "overview"],
    queryFn: async () => {
      return apiClient.request<SubscriptionStats>(
        "/api/v1/admin/subscriptions/stats/overview",
      );
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
      return apiClient.request<RevenueHistory>(
        `/api/v1/admin/subscriptions/analytics/revenue-history?period=${revenuePeriod}`,
      );
    },
  });

  // Fetch plan distribution
  const { data: planDistribution, isLoading: distributionLoading } = useQuery({
    queryKey: ["admin", "subscriptions", "analytics", "plan-distribution"],
    queryFn: async () => {
      const response = await apiClient.request<unknown>(
        `/api/v1/admin/subscriptions/analytics/plan-distribution`,
      );

      return normalizePlanDistribution(response);
    },
  });

  // Fetch cohort retention
  const { data: cohortRetention, isLoading: cohortLoading } = useQuery({
    queryKey: ["admin", "subscriptions", "analytics", "cohort-retention"],
    queryFn: async () => {
      return apiClient.request<CohortRetention>(
        `/api/v1/admin/subscriptions/analytics/cohort-retention`,
      );
    },
  });

  const { data: revenueMetrics, isLoading: revenueMetricsLoading } = useQuery({
    queryKey: ["admin", "subscriptions", "analytics", "revenue-metrics"],
    queryFn: () => apiClient.adminAnalytics.getRevenueMetrics(),
  });

  const { data: trialConversion } = useQuery({
    queryKey: ["admin", "subscriptions", "analytics", "trial-conversion"],
    queryFn: () => apiClient.adminAnalytics.getTrialConversion(),
  });

  const { data: churnAnalysis, isLoading: churnLoading } = useQuery({
    queryKey: ["admin", "subscriptions", "analytics", "churn", churnPeriod],
    queryFn: () => apiClient.adminAnalytics.getChurnAnalysis(churnPeriod),
  });

  // if (overviewError) {
  //   return (
  //     <ErrorPage
  //       title="Failed to load subscription management"
  //       message="Overview data could not be loaded. Please try again."
  //       retry={() => void refetchOverview()}
  //     />
  //   );
  // }

  if (overviewLoading) {
    return (
      <PageLayout title="">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageLayout>
    );
  }

  const revenueByPlan = overview?.revenue_by_plan;
  const growthMetrics = overview?.growth_metrics;
  const recentSubscriptions = overview?.recent_subscriptions;
  const normalizedPlanDistribution: PlanDistribution =
    Array.isArray(planDistribution) && planDistribution.length > 0
      ? planDistribution
      : normalizePlanDistribution(revenueByPlan);
  const trialFunnelData = (trialConversion?.conversion_by_plan ?? []).map(
    (plan) => ({
      name: plan.plan_name,
      trials: plan.trials,
      conversions: plan.conversions,
    }),
  );
  const revenueByPlanMetrics = (revenueMetrics?.by_plan ?? []).map((plan) => ({
    name: plan.plan_display_name || plan.plan_name,
    revenue:
      revenueDisplayPeriod === "monthly"
        ? plan.revenue_monthly
        : plan.revenue_yearly,
  }));

  return (
    <PageLayout
      title="Subscription Analytics"
      description="Comprehensive insights into subscription performance and revenue metrics"
      actions={
        <Link href="/admin/subscriptions/plans" className="w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto">
            <Settings className="mr-2 h-4 w-4" />
            Manage Plans
          </Button>
        </Link>
      }
    >
      <PermissionGuard
        permission={SUBSCRIPTION_PERMISSIONS.READ}
        fallback={
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to view subscription analytics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                <code className="text-xs bg-muted px-1 rounded">
                  subscription.read
                </code>
              </p>
            </CardContent>
          </Card>
        }
      >
        <div className="space-y-8">
          {/* KPI Cards */}
          {stats && (
            <SubscriptionKPIs stats={stats} growthMetrics={growthMetrics} />
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>Current month activity</CardDescription>
              </CardHeader>
              <CardContent>
                {revenueMetricsLoading ? (
                  <div className="flex h-24 items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      [
                        "New",
                        revenueMetrics?.current_month.new_revenue,
                        "bg-emerald-50 text-emerald-600",
                      ],
                      [
                        "Expansion",
                        revenueMetrics?.current_month.expansion_revenue,
                        "bg-blue-50 text-blue-600",
                      ],
                      [
                        "Contraction",
                        revenueMetrics?.current_month.contraction_revenue,
                        "bg-orange-50 text-orange-600",
                      ],
                      [
                        "Churned",
                        revenueMetrics?.current_month.churned_revenue,
                        "bg-red-50 text-red-600",
                      ],
                    ].map(([label, value, color]) => (
                      <div
                        key={label}
                        className={`rounded-lg border-0 p-4 ${color}`}
                      >
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-2xl font-semibold">
                          {formatCurrency(value as number)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-8">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold">Revenue by Plan</p>
                    <Select
                      value={revenueDisplayPeriod}
                      onValueChange={(value) =>
                        setRevenueDisplayPeriod(
                          value as typeof revenueDisplayPeriod,
                        )
                      }
                    >
                      <SelectTrigger className="h-10 w-43">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {revenueMetricsLoading ? (
                    <div className="flex h-52 items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : revenueByPlanMetrics.length > 0 ? (
                    <ResponsiveContainer width="100%" height={245}>
                      <BarChart data={revenueByPlanMetrics}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => formatCurrency(Number(value))}
                        />
                        <Bar
                          dataKey="revenue"
                          fill="#3b82f6"
                          name={`${revenueDisplayPeriod === "monthly" ? "Monthly" : "Yearly"} revenue`}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="py-12 text-center text-sm text-muted-foreground">
                      No revenue by plan data available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Trial Conversion Funnel</CardTitle>
                  <div className="mt-3 grid grid-cols-2 items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    <span>
                      Total Trials:{" "}
                      <Badge variant="secondary">
                        {trialConversion?.total_trials_started ?? 0}
                      </Badge>
                    </span>
                    <span>
                      Conversions:{" "}
                      <Badge variant="secondary">
                        {trialConversion?.trials_converted ?? 0}
                      </Badge>
                    </span>
                    <span>
                      Conversion Rate:{" "}
                      <Badge variant="secondary">
                        {formatPercentage(trialConversion?.conversion_rate)}
                      </Badge>
                    </span>
                    <span>
                      Avg Duration:{" "}
                      <Badge variant="secondary">
                        {(
                          trialConversion?.average_trial_length_days ?? 0
                        ).toFixed(1)}{" "}
                        days
                      </Badge>
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="min-h-20">
                  {trialFunnelData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={trialFunnelData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="trials"
                          fill="#f59e0b"
                          name="Trial starts"
                        />
                        <Bar
                          dataKey="conversions"
                          fill="#10b981"
                          name="Conversions"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex min-h-55 items-center justify-center">
                      <p className="text-center text-sm text-muted-foreground">
                        No per-plan trial data available
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="">
                <CardHeader className="flex flex-col gap-2">
                  <div className="flex justify-between gap-2 w-full">
                    <div>
                      <CardTitle>Churn Analysis</CardTitle>
                    </div>
                    <Select
                      value={String(churnPeriod)}
                      onValueChange={(value) => setChurnPeriod(Number(value))}
                    >
                      <SelectTrigger className="h-11 w-56">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">Last 7 days</SelectItem>
                        <SelectItem value="30">Last 30 days</SelectItem>
                        <SelectItem value="60">Last 60 days</SelectItem>
                        <SelectItem value="90">Last 90 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    <span>
                      Cancellations:{" "}
                      <Badge variant="destructive">
                        {churnAnalysis?.cancellations ?? 0}
                      </Badge>
                    </span>
                    <span>
                      Retention Rate:{" "}
                      <Badge variant="secondary">
                        {formatPercentage(churnAnalysis?.retention_rate)}
                      </Badge>
                    </span>
                    <span>
                      Churn Rate:{" "}
                      <Badge variant="destructive">
                        {formatPercentage(churnAnalysis?.churn_rate)}
                      </Badge>
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {churnLoading ? (
                    <div className="flex min-h-12 items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : (
                    churnAnalysis?.cancellation_reasons && (
                      <div className="min-h-20">
                        <p className="mb-5 font-medium">Cancellation Reasons</p>
                        {Object.keys(churnAnalysis?.cancellation_reasons ?? {})
                          .length > 0 && (
                          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                            {Object.entries(
                              churnAnalysis?.cancellation_reasons ?? {},
                            ).map(([reason, count]) => (
                              <span key={reason}>
                                {reason}: {count}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

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
                      data={revenueHistory || []}
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
                    <PlanDistributionChart data={normalizedPlanDistribution} />
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
                      cohorts={cohortRetention?.cohorts || []}
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
      </PermissionGuard>
    </PageLayout>
  );
}
