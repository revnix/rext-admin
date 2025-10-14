"use client";

import {
  BookOpen,
  Eye,
  FileText,
  LayoutDashboard,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { PageLayout } from "@/components/page-layout";
import { CanAccess } from "@/components/permissions/can-access";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WORKSPACE_PERMISSIONS } from "@/lib/permissions";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";

/**
 * Workspace Overview Page
 *
 * Displays workspace dashboard with:
 * - Key statistics (members, knowledge bases, topics, content)
 * - Recent activity
 * - Quick actions
 * - Analytics summary
 *
 * This serves as the landing page for workspace management.
 */
export default function WorkspaceOverviewPage() {
  const { workspace, workspaceSlug, isLoading } = useWorkspace();

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    {
      label: workspace?.title || "...",
      href: workspaceRoutes.root(workspaceSlug),
    },
    { label: "Overview" },
  ];

  if (isLoading) {
    return (
      <PageLayout
        title="Workspace Overview"
        description="Loading workspace details..."
        breadcrumbs={breadcrumbs}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </PageLayout>
    );
  }

  const actions = workspace && (
    <Link href={workspaceRoutes.root(workspaceSlug)}>
      <Button variant="outline">
        <Eye className="h-4 w-4 mr-2" />
        View Details
      </Button>
    </Link>
  );

  return (
    <PageLayout
      title={workspace?.title || "Workspace Overview"}
      description="Dashboard and summary for your workspace"
      breadcrumbs={breadcrumbs}
      actions={actions}
    >
      <CanAccess
        permission={WORKSPACE_PERMISSIONS.READ}
        fallback={
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to view this workspace overview.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Required permission:{" "}
                <code className="text-xs bg-muted px-1 rounded">
                  workspace.read
                </code>
              </p>
            </CardContent>
          </Card>
        }
      >
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Members
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {workspace?.team_metrics?.total_members ??
                    workspace?.members_count ??
                    0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Team members in workspace
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Knowledge Items
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {workspace?.knowledge_counts?.total_knowledge_items ??
                    workspace?.knowledge_stats?.total ??
                    0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Websites, files, and notes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Words
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {workspace?.content_metrics?.total_words
                    ? `${(workspace.content_metrics.total_words / 1000).toFixed(
                        1,
                      )}k`
                    : "0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Knowledge base content
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Generated Content
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {workspace?.content_count ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Articles and posts
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Workspace Details */}
          <Card>
            <CardHeader>
              <CardTitle>Workspace Details</CardTitle>
              <CardDescription>
                Basic information about this workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Name
                  </p>
                  <p className="text-sm">{workspace?.title || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Slug
                  </p>
                  <p className="text-sm font-mono text-xs">
                    {workspace?.slug || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    URL
                  </p>
                  <p className="text-sm truncate">{workspace?.url || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Created
                  </p>
                  <p className="text-sm">
                    {workspace?.created_at
                      ? new Date(workspace.created_at).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Coming Soon */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Enhanced Dashboard Coming Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This overview page will soon include:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Real-time statistics and metrics
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Recent activity feed
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Quick actions and shortcuts
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Analytics charts and graphs
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Team activity and contributions
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </CanAccess>
    </PageLayout>
  );
}
