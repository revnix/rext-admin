"use client";

import {
  ArrowUpRight,
  BarChart,
  Plus,
  Settings,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePageTitle } from "@/hooks/use-page-title";
import { useWorkspaceStore } from "@/stores/workspace";

export default function DashboardPage() {
  const breadcrumbs = [{ label: "Dashboard" }];
  const workspaceList = useWorkspaceStore((state) => state.workspaceList);
  const hasWorkspaces = workspaceList.length > 0;

  // Update page title and description
  usePageTitle(
    "Dashboard",
    "Overview of your content performance, automation flows, and key metrics. Monitor your AI-powered content strategy at a glance.",
  );

  return (
    <AuthGuard>
      <PageLayout
        title="Dashboard"
        description={
          hasWorkspaces
            ? "Welcome to your workspace. Monitor your progress, track key metrics, and manage your projects."
            : "Welcome to Wrext! Let's get you started."
        }
        breadcrumbs={breadcrumbs}
        actions={
          hasWorkspaces ? (
            <>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Customize
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Quick Action
              </Button>
            </>
          ) : undefined
        }
      >
        {hasWorkspaces ? (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "Total Topics",
                  value: "--",
                  change: "+12%",
                  icon: BarChart,
                  trend: "up",
                },
                {
                  title: "Active Flows",
                  value: "--",
                  change: "+8%",
                  icon: Zap,
                  trend: "up",
                },
                {
                  title: "Content Items",
                  value: "--",
                  change: "-2%",
                  icon: TrendingUp,
                  trend: "down",
                },
                {
                  title: "Team Members",
                  value: "--",
                  change: "+3",
                  icon: Users,
                  trend: "up",
                },
              ].map((metric) => (
                <Card key={metric.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {metric.title}
                    </CardTitle>
                    <metric.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metric.value}</div>
                    <p
                      className={`text-xs flex items-center gap-1 ${
                        metric.trend === "up"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      <ArrowUpRight
                        className={`h-3 w-3 ${
                          metric.trend === "down" ? "rotate-90" : ""
                        }`}
                      />
                      {metric.change} from last month
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Main Content Areas */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Your latest actions and updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-4 p-3 rounded-lg border border-dashed"
                      >
                        <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-muted rounded animate-pulse" />
                          <div className="h-2 bg-muted rounded animate-pulse w-3/4" />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          --h ago
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks and shortcuts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      "Create New Topic",
                      "Build a Flow",
                      "Add Content",
                      "Invite Team Member",
                      "Configure Settings",
                    ].map((action) => (
                      <Button
                        key={action}
                        variant="ghost"
                        className="w-full justify-start"
                        disabled
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {action}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Projects/Items */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>
                  Your most recently accessed items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="p-4 rounded-lg border border-dashed"
                    >
                      <div className="space-y-3">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                        <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-muted-foreground">
                            Updated --d ago
                          </div>
                          <div className="w-6 h-6 rounded bg-muted animate-pulse" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <DashboardEmptyState />
        )}
      </PageLayout>
    </AuthGuard>
  );
}
