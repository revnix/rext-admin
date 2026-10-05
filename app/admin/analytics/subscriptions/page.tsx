"use client";

import {
  AlertCircle,
  DollarSign,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState, useRef } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { PageLayout } from "@/components/page-layout";
import { AdminGuard } from "@/components/permission/admin-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";
import type {
  AnalyticsOverview,
  ChurnAnalysis,
  RevenueMetrics,
  TrialConversionMetrics,
} from "@/lib/api-client/admin-analytics";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || Number.isNaN(amount))
    return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercentage = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return "0.0%";
  return `${value.toFixed(1)}%`;
};

const COLORS = {
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  pink: "#ec4899",
  teal: "#14b8a6",
  indigo: "#6366f1",
};

const PIE_COLORS = [
  COLORS.primary,
  COLORS.success,
  COLORS.purple,
  COLORS.pink,
  COLORS.teal,
  COLORS.indigo,
];

// ============================================================================
// METRIC CARD COMPONENT
// ============================================================================

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  trend?: "up" | "down";
  className?: string;
}

function MetricCard({
  title,
  value,
  change,
  icon,
  trend,
  className = "",
}: MetricCardProps) {
  const showTrend = change !== undefined && trend;

  return (
    <Card
      className={`relative overflow-hidden border-none transition-all ${className}`}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        {icon}
      </div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        {showTrend && (
          <p
            className={`text-xs flex items-center gap-1 mt-2 font-medium ${
              trend === "up" ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {trend === "up" ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {formatPercentage(Math.abs(change))} from last period
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function AnalyticsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {(
          [
            "loading-metric-1",
            "loading-metric-2",
            "loading-metric-3",
            "loading-metric-4",
          ] as const
        ).map((id) => (
          <Card key={id}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SubscriptionAnalyticsPage() {
  // State
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [revenue, setRevenue] = useState<RevenueMetrics | null>(null);
  const [churn, setChurn] = useState<ChurnAnalysis | null>(null);
  const [trialConversion, setTrialConversion] =
    useState<TrialConversionMetrics | null>(null);
  const [churnPeriod, setChurnPeriod] = useState<number>(30);
  const [revenueFilter, setRevenueFilter] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [refreshing, setRefreshing] = useState(false);

  const churnRequestRef = useRef<number>(0);

  // Fetch churn data when period changes
  const fetchChurnData = useCallback(async (periodDays: number) => {
    const requestId = ++churnRequestRef.current;
    try {
      const churnData =
        await apiClient.adminAnalytics.getChurnAnalysis(periodDays);
      if (requestId === churnRequestRef.current) {
        setChurn(churnData);
      }
    } catch (_error) {
      if (requestId === churnRequestRef.current) {
        toast.error("Failed to load churn analysis. Please try again.");
      }
    }
  }, []);

  // Fetch data
  // Churn is intentionally NOT part of this bundle — the effect below owns
  // churn so it isn't fetched twice per load/period change (finding #19).
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);

      const [overviewData, revenueData, trialData] = await Promise.all([
        apiClient.adminAnalytics.getOverview(),
        apiClient.adminAnalytics.getRevenueMetrics(),
        apiClient.adminAnalytics.getTrialConversion(),
      ]);

      setOverview(overviewData);
      setRevenue(revenueData);
      setTrialConversion(trialData);
    } catch (_error) {
      toast.error("Failed to load analytics data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAnalytics]);

  useEffect(() => {
    if (!loading) {
      fetchChurnData(churnPeriod);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [churnPeriod, fetchChurnData, loading]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
    fetchChurnData(churnPeriod);
  };

  if (loading) {
    return (
      <PageLayout
        title="Subscription Analytics"
        description="Monitor key metrics and insights"
      >
        <AnalyticsLoadingSkeleton />
      </PageLayout>
    );
  }

  if (!overview || !revenue || !churn || !trialConversion) {
    return (
      <PageLayout
        title="Subscription Analytics"
        description="Monitor key metrics and insights"
      >
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Failed to Load Analytics
            </h2>
            <p className="text-muted-foreground mb-4">
              Unable to retrieve analytics data
            </p>
            <Button
              onClick={() => {
                fetchAnalytics();
                fetchChurnData(churnPeriod);
              }}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  // Prepare chart data
  const revenueByPlanData = revenue.by_plan.map((plan) => ({
    name: plan.plan_display_name || plan.plan_name,
    revenue:
      revenueFilter === "monthly" ? plan.revenue_monthly : plan.revenue_yearly,
    subscriptions: plan.subscription_count,
    monthlyRevenue: plan.revenue_monthly,
    yearlyRevenue: plan.revenue_yearly,
  }));

  const tierDistributionData = revenue.by_plan.map((plan) => ({
    name: plan.plan_display_name || plan.plan_name,
    value: plan.subscription_count,
  }));

  const trialFunnelData = (trialConversion.conversion_by_plan || []).map(
    (plan) => ({
      name: plan.plan_name,
      trials: plan.trials,
      conversions: plan.conversions,
      conversionRate: plan.conversion_rate,
    }),
  );

  const churnByPlanData = (churn.churn_by_plan || []).map((plan) => ({
    name: plan.plan_name,
    churnRate: plan.churn_rate,
    churned: plan.churned,
    total: plan.total,
  }));

  const cancellationReasonsData = Object.entries(
    churn.cancellation_reasons,
  ).map(([reason, count]) => ({
    name: reason,
    value: count,
  }));

  // Calculate growth trend
  const growthRate = revenue.growth_rate;
  const growthTrend = growthRate >= 0 ? "up" : "down";

  // Derived metrics for better accuracy fallback
  const derivedMrr = revenue.current_month.mrr || overview.mrr;
  const derivedActive =
    revenue.by_plan.reduce(
      (acc, p) =>
        acc +
        (p.plan_name.toLowerCase() !== "trial" ? p.subscription_count : 0),
      0,
    ) || overview.active_subscriptions;
  const derivedTrialing =
    trialConversion.trials_active || overview.trialing_subscriptions;
  const totalSubscriptionsCount =
    revenue.by_plan.reduce((acc, p) => acc + p.subscription_count, 0) ||
    overview.total_subscriptions;

  return (
    <AdminGuard superAdminOnly={true}>
      <PageLayout
        title="Subscription Analytics"
        description="Monitor key metrics and insights"
        actions={
          <Button
            className="w-full sm:w-auto"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "Refresh Data"}
          </Button>
        }
      >
        {/* Overview Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <MetricCard
            title="Monthly Recurring Revenue"
            value={formatCurrency(derivedMrr)}
            icon={<DollarSign className="h-4 w-4" />}
            change={growthRate}
            trend={growthTrend}
          />
          <MetricCard
            title="Annual Recurring Revenue"
            value={formatCurrency(derivedMrr * 12)}
            icon={<DollarSign className="h-4 w-4" />}
          />
          <MetricCard
            title="Active Subscriptions"
            value={derivedActive}
            icon={<Users className="h-4 w-4" />}
          />
          <MetricCard
            title="Churn Rate"
            value={formatPercentage(churn.churn_rate || overview.churn_rate)}
            icon={<UserMinus className="h-4 w-4" />}
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <MetricCard
            title="Trial Conversion Rate"
            value={formatPercentage(
              trialConversion.conversion_rate || overview.trial_conversion_rate,
            )}
            icon={<UserCheck className="h-4 w-4" />}
          />
          <MetricCard
            title="Avg Customer LTV"
            value={
              overview.avg_customer_ltv &&
              !Number.isNaN(overview.avg_customer_ltv)
                ? formatCurrency(overview.avg_customer_ltv)
                : "N/A"
            }
            icon={<DollarSign className="h-4 w-4" />}
          />
          <MetricCard
            title="Trial Subscriptions"
            value={derivedTrialing}
            icon={<Users className="h-4 w-4" />}
          />
        </div>

        {/* Revenue Charts */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          {/* Revenue by Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <p className="text-sm text-muted-foreground">
                Current month activity
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-green-50 rounded-md">
                  <p className="text-xs text-green-600 font-medium">NEW</p>
                  <p className="text-lg font-bold dark:text-green-600">
                    {formatCurrency(revenue.current_month.new_revenue)}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-md">
                  <p className="text-xs text-blue-600 font-medium">EXPANSION</p>
                  <p className="text-lg font-bold dark:text-blue-600">
                    {formatCurrency(revenue.current_month.expansion_revenue)}
                  </p>
                </div>
                <div className="p-3 bg-orange-50 rounded-md">
                  <p className="text-xs text-orange-600 font-medium">
                    CONTRACTION
                  </p>
                  <p className="text-lg font-bold dark:text-orange-600">
                    {formatCurrency(revenue.current_month.contraction_revenue)}
                  </p>
                </div>
                <div className="p-3 bg-red-50 rounded-md">
                  <p className="text-xs text-red-600 font-medium">CHURNED</p>
                  <p className="text-lg font-bold dark:text-red-600">
                    {formatCurrency(revenue.current_month.churned_revenue)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-sm font-medium">Revenue by Plan</p>
                <Select
                  value={revenueFilter}
                  onValueChange={(value) =>
                    setRevenueFilter(value as "monthly" | "yearly")
                  }
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Revenue type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={revenueByPlanData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    labelStyle={{ color: "#000" }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill={COLORS.primary}
                    name={
                      revenueFilter === "monthly"
                        ? "Monthly Revenue"
                        : "Yearly Revenue"
                    }
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tier Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription Distribution</CardTitle>
              <p className="text-sm text-muted-foreground">
                Total: {totalSubscriptionsCount} subscriptions
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={tierDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: { percent?: number; name?: string }) => {
                      const percent = props.percent || 0;
                      const name = props.name || "";
                      return `${name}: ${(percent * 100).toFixed(0)}%`;
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {tierDistributionData.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Trial Conversion */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Trial Conversion Funnel</CardTitle>
            <div className="flex flex-wrap items-start mt-4 sm:items-center gap-4 text-sm text-muted-foreground">
              <span>
                Total Trials:{" "}
                <Badge variant="secondary">
                  {trialConversion.total_trials_started}
                </Badge>
              </span>
              <span>
                Active:{" "}
                <Badge variant="outline">{trialConversion.trials_active}</Badge>
              </span>
              <span>
                Conversions:{" "}
                <Badge
                  variant="secondary"
                  className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                >
                  {trialConversion.trials_converted}
                </Badge>
              </span>
              <span>
                Expired:{" "}
                <Badge variant="outline">
                  {trialConversion.trials_expired}
                </Badge>
              </span>
              {trialConversion.trials_cancelled !== undefined && (
                <span>
                  Cancelled:{" "}
                  <Badge variant="outline">
                    {trialConversion.trials_cancelled}
                  </Badge>
                </span>
              )}
              <span>
                Conversion Rate:{" "}
                <Badge variant="secondary">
                  {formatPercentage(trialConversion.conversion_rate)}
                </Badge>
              </span>
              <span>
                Avg Duration:{" "}
                <Badge variant="secondary">
                  {(trialConversion.average_trial_length_days ?? 0).toFixed(1)}{" "}
                  days
                </Badge>
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {trialFunnelData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trialFunnelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip labelStyle={{ color: "#000" }} />
                  <Legend />
                  <Bar
                    dataKey="trials"
                    fill={COLORS.warning}
                    name="Trial Starts"
                  />
                  <Bar
                    dataKey="conversions"
                    fill={COLORS.success}
                    name="Conversions"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <p>No per-plan trial data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Churn Analysis */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
              <div>
                <CardTitle>Churn Analysis</CardTitle>
                <div className="flex flex-wrap items-start sm:items-center gap-4 text-sm text-muted-foreground my-4">
                  <span>
                    Cancellations:{" "}
                    <Badge variant="destructive">{churn.cancellations}</Badge>
                  </span>
                  <span>
                    Retention Rate:{" "}
                    <Badge variant="secondary">
                      {formatPercentage(churn.retention_rate)}
                    </Badge>
                  </span>
                  <span>
                    Churn Rate:{" "}
                    <Badge variant="destructive">
                      {formatPercentage(churn.churn_rate)}
                    </Badge>
                  </span>
                </div>
              </div>
              <Select
                value={churnPeriod.toString()}
                onValueChange={(value) => setChurnPeriod(Number(value))}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="60">Last 60 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Churn by Plan (if available) */}
              {churnByPlanData.length > 0 && (
                <div className="h-[300px]">
                  <h4 className="text-sm font-medium mb-4">Churn by Plan</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={churnByPlanData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === "Churn Rate") {
                            return formatPercentage(Number(value));
                          }
                          return value;
                        }}
                        labelStyle={{ color: "#000" }}
                      />
                      <Legend />
                      <Bar
                        dataKey="churnRate"
                        fill={COLORS.danger}
                        name="Churn Rate (%)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Cancellation Reasons */}
              <div className="h-[300px]">
                <h4 className="text-sm font-medium mb-4">
                  Cancellation Reasons
                </h4>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={cancellationReasonsData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {cancellationReasonsData.map((entry) => (
                        <Cell
                          key={`cell-${entry.name}`}
                          fill={
                            PIE_COLORS[
                              cancellationReasonsData.indexOf(entry) %
                                PIE_COLORS.length
                            ]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </PageLayout>
    </AdminGuard>
  );
}
