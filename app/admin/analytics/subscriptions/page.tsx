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
import { useEffect, useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
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

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercentage = (value: number): string => {
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
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {showTrend && (
          <p
            className={`text-xs flex items-center gap-1 mt-1 ${
              trend === "up" ? "text-green-600" : "text-red-600"
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
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
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
  const { toast } = useToast();

  // State
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [revenue, setRevenue] = useState<RevenueMetrics | null>(null);
  const [churn, setChurn] = useState<ChurnAnalysis | null>(null);
  const [trialConversion, setTrialConversion] =
    useState<TrialConversionMetrics | null>(null);
  const [churnPeriod, setChurnPeriod] = useState<number>(30);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const [overviewData, revenueData, churnData, trialData] =
        await Promise.all([
          apiClient.adminAnalytics.getOverview(),
          apiClient.adminAnalytics.getRevenueMetrics(),
          apiClient.adminAnalytics.getChurnAnalysis(churnPeriod),
          apiClient.adminAnalytics.getTrialConversion(),
        ]);

      setOverview(overviewData);
      setRevenue(revenueData);
      setChurn(churnData);
      setTrialConversion(trialData);
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to load analytics data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch churn data when period changes
  const fetchChurnData = async (periodDays: number) => {
    try {
      const churnData =
        await apiClient.adminAnalytics.getChurnAnalysis(periodDays);
      setChurn(churnData);
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to load churn analysis. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    if (!loading) {
      fetchChurnData(churnPeriod);
    }
  }, [churnPeriod, fetchChurnData, loading]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Subscription Analytics</h1>
          <p className="text-muted-foreground">
            Monitor key metrics and insights
          </p>
        </div>
        <AnalyticsLoadingSkeleton />
      </div>
    );
  }

  if (!overview || !revenue || !churn || !trialConversion) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Failed to Load Analytics
            </h2>
            <p className="text-muted-foreground mb-4">
              Unable to retrieve analytics data
            </p>
            <Button onClick={fetchAnalytics}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare chart data
  const revenueByPlanData = revenue.revenue_by_plan.map((plan) => ({
    name: plan.plan_name,
    revenue: plan.revenue,
    subscriptions: plan.subscription_count,
  }));

  const tierDistributionData = revenue.revenue_by_plan.map((plan) => ({
    name: plan.plan_name,
    value: plan.subscription_count,
  }));

  const trialFunnelData = trialConversion.conversion_by_plan.map((plan) => ({
    name: plan.plan_name,
    trials: plan.trials,
    conversions: plan.conversions,
    conversionRate: plan.conversion_rate,
  }));

  const churnByPlanData = churn.churn_by_plan.map((plan) => ({
    name: plan.plan_name,
    churnRate: plan.churn_rate,
    churned: plan.churned,
    total: plan.total,
  }));

  // Calculate growth trend
  const growthRate = revenue.growth_rate;
  const growthTrend = growthRate >= 0 ? "up" : "down";

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Subscription Analytics</h1>
          <p className="text-muted-foreground">
            Monitor key metrics and insights
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>

      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <MetricCard
          title="Monthly Recurring Revenue"
          value={formatCurrency(overview.mrr)}
          icon={<DollarSign className="h-4 w-4" />}
          change={growthRate}
          trend={growthTrend}
        />
        <MetricCard
          title="Annual Recurring Revenue"
          value={formatCurrency(overview.arr)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <MetricCard
          title="Active Subscriptions"
          value={overview.active_subscriptions}
          icon={<Users className="h-4 w-4" />}
        />
        <MetricCard
          title="Churn Rate"
          value={formatPercentage(overview.churn_rate)}
          icon={<UserMinus className="h-4 w-4" />}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <MetricCard
          title="Trial Conversion Rate"
          value={formatPercentage(overview.trial_conversion_rate)}
          icon={<UserCheck className="h-4 w-4" />}
        />
        <MetricCard
          title="Customer Lifetime Value"
          value={formatCurrency(overview.avg_customer_ltv)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <MetricCard
          title="Trial Subscriptions"
          value={overview.trialing_subscriptions}
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      {/* Revenue Charts */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Revenue by Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Plan</CardTitle>
            <p className="text-sm text-muted-foreground">
              Current month: {formatCurrency(revenue.current_month_revenue)}
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByPlanData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: "#000" }}
                />
                <Legend />
                <Bar dataKey="revenue" fill={COLORS.primary} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tier Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Distribution</CardTitle>
            <p className="text-sm text-muted-foreground">
              Total: {overview.total_subscriptions} subscriptions
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
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tierDistributionData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
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
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              Total Trials:{" "}
              <Badge variant="secondary">{trialConversion.total_trials}</Badge>
            </span>
            <span>
              Conversions:{" "}
              <Badge variant="secondary">
                {trialConversion.converted_trials}
              </Badge>
            </span>
            <span>
              Conversion Rate:{" "}
              <Badge variant="secondary">
                {formatPercentage(trialConversion.conversion_rate)}
              </Badge>
            </span>
            <span>
              Avg Duration:{" "}
              <Badge variant="secondary">
                {trialConversion.avg_trial_duration_days.toFixed(1)} days
              </Badge>
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trialFunnelData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip labelStyle={{ color: "#000" }} />
              <Legend />
              <Bar dataKey="trials" fill={COLORS.warning} name="Trial Starts" />
              <Bar
                dataKey="conversions"
                fill={COLORS.success}
                name="Conversions"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Churn Analysis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Churn Analysis</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                <span>
                  Churned:{" "}
                  <Badge variant="destructive">
                    {churn.churned_subscriptions}
                  </Badge>
                </span>
                <span>
                  Revenue Lost:{" "}
                  <Badge variant="destructive">
                    {formatCurrency(churn.revenue_lost)}
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
              <SelectTrigger className="w-[180px]">
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
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={churnByPlanData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === "Churn Rate") {
                    return formatPercentage(value);
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
        </CardContent>
      </Card>
    </div>
  );
}
