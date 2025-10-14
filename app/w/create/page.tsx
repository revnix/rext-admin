"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { PageLayout } from "@/components/page-layout";
import { WorkspaceCreateWizard } from "@/components/workspace/workspace-create-wizard";
import { usePageTitle } from "@/hooks/use-page-title";

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
 */
export default function CreateWorkspacePage() {
  // Update page title
  usePageTitle(
    "Create Workspace",
    "Create a new workspace with guided setup for optimal content generation",
  );

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Create Workspace" },
  ];

  return (
    <PageLayout
      title="Create Workspace"
      description="Set up a new workspace with guided configuration"
      breadcrumbs={breadcrumbs}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Navigation */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ChevronLeft className="h-4 w-4" />
          <Link
            href="/dashboard"
            className="hover:text-foreground transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Multi-Step Wizard */}
        <WorkspaceCreateWizard />
      </div>
    </PageLayout>
  );
}
