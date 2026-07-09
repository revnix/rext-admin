"use client";

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleConnectionGate } from "@/components/integrations/google/google-connection-gate";
import { GoogleSectionTabs } from "@/components/integrations/google/google-section-tabs";
import { PageLayout } from "@/components/page-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { WORKSPACE_PERMISSIONS } from "@/lib/permissions";
import { useWorkspace } from "@/providers/workspace-provider";

const REPORT_SECTIONS = [
  {
    key: "traffic-growth",
    title: "Traffic Growth",
    icon: TrendingUp,
    description: "Week-over-week organic traffic change across all articles.",
  },
  {
    key: "ranking-improvements",
    title: "Ranking Improvements",
    icon: ArrowUpRight,
    description: "Articles whose average position improved this week.",
  },
  {
    key: "top-performing",
    title: "Top Performing Articles",
    icon: Sparkles,
    description: "This week's biggest traffic winners.",
  },
  {
    key: "declining",
    title: "Declining Articles",
    icon: ArrowDownRight,
    description: "Articles losing clicks or ranking position this week.",
  },
  {
    key: "needs-update",
    title: "Articles Needing Updates",
    icon: AlertTriangle,
    description: "Articles flagged as stale or underperforming this week.",
  },
];

/**
 * Module 15 Executive Reports. The backend has no weekly report-generation
 * endpoint yet (only Modules 1-4 have shipped), so this renders the planned
 * report sections as a clear "coming soon" state rather than fabricated data.
 * Swap this content for real report data once the backend endpoint ships.
 */
function ReportsComingSoon() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Report</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {REPORT_SECTIONS.map((section) => (
          <div
            key={section.key}
            className="flex items-start gap-3 rounded-lg border border-dashed p-4"
          >
            <section.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{section.title}</p>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  Coming soon
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {section.description}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function GoogleReportsPage() {
  const { workspace, workspaceSlug } = useWorkspace();
  const { hasPermission: canManage, isLoading: isPermLoading } =
    useWorkspacePermission(WORKSPACE_PERMISSIONS.UPDATE, workspace?.id);

  if (!workspace?.id || isPermLoading) {
    return (
      <PageLayout title="Loading...">
        <Skeleton className="h-64 w-full" />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Weekly Reports"
      description="Automated weekly summaries of traffic growth, ranking changes, and articles needing attention."
    >
      <GoogleConnectionGate
        workspaceId={workspace.id}
        workspaceSlug={workspaceSlug}
        canManage={canManage}
      >
        <div className="space-y-6">
          <GoogleSectionTabs workspaceSlug={workspaceSlug} />
          <ReportsComingSoon />
        </div>
      </GoogleConnectionGate>
    </PageLayout>
  );
}
