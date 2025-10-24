"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  CheckCircle,
  Clock,
  Mail,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { PageLayout } from "@/components/page-layout";
import { AdminGuard } from "@/components/permission/admin-guard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiClient } from "@/lib/api-client";

export default function InvitationAnalyticsPage() {
  const [days, setDays] = useState(30);

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["invitation-analytics", days],
    queryFn: () => apiClient.adminAnalytics.getInvitationAnalytics(days),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    { label: "Admin", href: "/admin" },
    { label: "Analytics", href: "/admin/analytics" },
    { label: "Invitations" },
  ];

  if (isLoading) {
    return (
      <PageLayout
        title="Invitation Analytics"
        description="Track and analyze invitation metrics"
        breadcrumbs={breadcrumbs}
      >
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </PageLayout>
    );
  }

  if (!analytics) {
    return (
      <PageLayout
        title="Invitation Analytics"
        description="Track and analyze invitation metrics"
        breadcrumbs={breadcrumbs}
      >
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              No analytics data available.
            </p>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  const { summary, top_inviters, popular_roles, workspace_stats } = analytics;

  return (
    <AdminGuard>
      <PageLayout
        title="Invitation Analytics"
        description="Track and analyze invitation metrics across the platform"
        breadcrumbs={breadcrumbs}
      >
        <div className="space-y-6">
          {/* Period Selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Analysis Period:</span>
            </div>
            <Select
              value={days.toString()}
              onValueChange={(value) => setDays(Number.parseInt(value, 10))}
            >
              <SelectTrigger className="w-[180px]">
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

          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Invitations
                </CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.total_invitations}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.pending} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Acceptance Rate
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.acceptance_rate}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.accepted} accepted
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Time to Accept
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.avg_time_to_acceptance_hours.toFixed(1)}h
                </div>
                <p className="text-xs text-muted-foreground">
                  Average duration
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Decline + Expiry Rate
                </CardTitle>
                <XCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(summary.decline_rate + summary.expiry_rate).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.declined + summary.expired} total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Accepted</p>
                    <p className="text-2xl font-bold">{summary.accepted}</p>
                  </div>
                  <Badge variant="default">
                    {summary.acceptance_rate.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Pending</p>
                    <p className="text-2xl font-bold">{summary.pending}</p>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Declined</p>
                    <p className="text-2xl font-bold">{summary.declined}</p>
                  </div>
                  <Badge variant="outline">
                    {summary.decline_rate.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Expired</p>
                    <p className="text-2xl font-bold">{summary.expired}</p>
                  </div>
                  <Badge variant="destructive">
                    {summary.expiry_rate.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Top Inviters */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Top Inviters
                </CardTitle>
              </CardHeader>
              <CardContent>
                {top_inviters.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {top_inviters.map((inviter, index) => (
                        <TableRow key={inviter.user_id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={index < 3 ? "default" : "outline"}
                                className="w-6 h-6 p-0 flex items-center justify-center"
                              >
                                {index + 1}
                              </Badge>
                              <div>
                                <p className="font-medium">{inviter.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {inviter.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {inviter.invitation_count}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No inviter data available
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Popular Roles */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Popular Roles
                </CardTitle>
              </CardHeader>
              <CardContent>
                {popular_roles.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {popular_roles.map((role, index) => (
                        <TableRow key={role.role_id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={index < 3 ? "default" : "outline"}
                                className="w-6 h-6 p-0 flex items-center justify-center"
                              >
                                {index + 1}
                              </Badge>
                              <span className="font-medium">{role.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {role.invitation_count}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No role data available
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Workspace Stats */}
          {workspace_stats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Workspaces by Invitations</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Workspace</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Accepted</TableHead>
                      <TableHead className="text-right">
                        Acceptance Rate
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workspace_stats.map((workspace) => (
                      <TableRow key={workspace.workspace_id}>
                        <TableCell className="font-medium">
                          {workspace.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {workspace.total_invitations}
                        </TableCell>
                        <TableCell className="text-right">
                          {workspace.accepted_invitations}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={
                              workspace.acceptance_rate >= 70
                                ? "default"
                                : workspace.acceptance_rate >= 50
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {workspace.acceptance_rate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </PageLayout>
    </AdminGuard>
  );
}
