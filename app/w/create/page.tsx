"use client";

import { ChevronLeft, ShieldX } from "lucide-react";
import Link from "next/link";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageLoader } from "@/components/ui/loading-states";
import { useResourceLimit } from "@/components/subscription/usage-limit-warning";
import { WorkspaceCreateWizard } from "@/components/workspace";
import { usePageTitle } from "@/hooks/use-page-title";
import { usePermissionDecision } from "@/hooks/use-permission";

/**
 * Create Workspace Page
 *
 * Multi-step wizard for comprehensive workspace creation including:
 * - Basic information collection
 * - URL analysis and content preview
 * - Brand voice extraction and processing
 * - Review and final workspace creation
 *
 * Features:
 * - Step-by-step guided workflow
 * - Progress indicator with milestone celebrations
 * - Real-time URL analysis and brand voice extraction
 * - Professional typeform-style UI
 * - Proper error handling and validation
 *
 * **Phase 4, Task HIGH-10: Permission Guards**
 * Requires workspace.create permission to access this page.
 */
export default function CreateWorkspacePage() {
  // Update page title
  usePageTitle(
    "Create Workspace",
    "Create a new workspace with guided setup for optimal content generation",
  );

  const { hasAccess: canCreateWorkspace, isLoading: isCheckingPermission } =
    usePermissionDecision({
      mode: "single",
      permissions: ["workspace.create"],
    });
  const { isLimitReached, isLoading: isLimitLoading } = useResourceLimit(
    "workspaces",
  );

  if (isCheckingPermission || isLimitLoading) {
    return <PageLoader message="Checking workspace permissions..." />;
  }

  // Show permission denied message if no access
  if (!canCreateWorkspace) {
    return (
      <PageLayout
        title="Permission Required"
        description="You need permission to create workspaces"
      >
        <div className="max-w-2xl mx-auto py-12">
          <Card className="p-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-muted p-4">
                <ShieldX className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Permission Required</h2>
                <p className="text-muted-foreground max-w-md">
                  You don't have permission to create new workspaces. Please
                  contact your administrator to request access or upgrade your
                  plan.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button asChild>
                  <Link href="/">Back to Dashboard</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/subscription">View Plans</Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </PageLayout>
    );
  }

  if (isLimitReached) {
    return (
      <PageLayout
        title="Workspace limit reached"
        description="You have already reached the maximum number of workspaces allowed on your current plan."
      >
        <div className="max-w-2xl mx-auto py-12">
          <Card className="p-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-destructive/10 p-4">
                <ShieldX className="h-12 w-12 text-destructive" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Workspace limit reached</h2>
                <p className="text-muted-foreground max-w-md">
                  Your current plan has reached its workspace cap. Upgrade to
                  create additional workspaces or manage your existing plan.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button asChild>
                  <Link href="/subscription">View plans</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">Back to Dashboard</Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Create Workspace"
      description="Set up a new workspace with guided configuration"
    >
      <div className="w-full mx-auto space-y-6">
        {/* Back Navigation */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ChevronLeft className="h-4 w-4" />
          <Link href="/" className="hover:text-foreground transition-colors">
            Back to Dashboard
          </Link>
        </div>

        {/* Multi-Step Wizard */}
        <WorkspaceCreateWizard />
      </div>
    </PageLayout>
  );
}
