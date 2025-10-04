"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ContentCreationWizard } from "@/components/content-creation/content-creation-wizard";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  ContentCreationFormData,
  CreateContentResponse,
  PartialContentCreationFormData,
} from "@/types/content-creation";

/**
 * Component that uses search params (needs Suspense boundary)
 */
function CreateContentPageContent() {
  const searchParams = useSearchParams();
  const topicId = searchParams.get("topicId");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Breadcrumbs for navigation
  const breadcrumbs = [
    { label: "Content", href: "/content" },
    { label: "Create Content" },
  ];

  // Page actions
  const pageActions = (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href="/content">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Content
        </Link>
      </Button>
    </div>
  );

  /**
   * Handle form submission when wizard is completed
   */
  const handleSubmit = async (
    formData: ContentCreationFormData,
  ): Promise<void> => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // TODO: Replace with actual API call
      const response = await fetch("/api/v1/content/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          requestId: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create content");
      }

      const result: CreateContentResponse = await response.json();

      // Show success notification
      // TODO: Integrate with existing notification system
      console.log("Content creation started:", result);

      // Redirect to content list or flow monitoring page
      window.location.href = `/content/${result.contentId}`;
    } catch (error) {
      console.error("Content creation failed:", error);
      setSubmitError(
        error instanceof Error ? error.message : "An unexpected error occurred",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle draft saving
   */
  const handleSaveDraft = async (
    formData: PartialContentCreationFormData,
  ): Promise<void> => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch("/api/v1/content/drafts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          draftId: crypto.randomUUID(),
          lastModified: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save draft");
      }

      // Show success notification
      console.log("Draft saved successfully");
    } catch (error) {
      console.error("Draft save failed:", error);
      // Show error notification
    }
  };

  /**
   * Handle wizard cancellation
   */
  const handleCancel = (): void => {
    // Show confirmation dialog if there are unsaved changes
    const hasUnsavedChanges = true; // TODO: Check actual wizard state

    if (hasUnsavedChanges) {
      const shouldLeave = confirm(
        "You have unsaved changes. Are you sure you want to leave? Your progress will be lost.",
      );

      if (!shouldLeave) {
        return;
      }
    }

    // Navigate back to content list
    window.location.href = "/content";
  };

  return (
    <PageLayout
      title="Create Content"
      description="Generate high-quality content with AI assistance using our intelligent wizard"
      breadcrumbs={breadcrumbs}
      actions={pageActions}
      className="max-w-none" // Remove max-width constraint for wizard
    >
      <div className="space-y-6">
        {/* Error Display */}
        {submitError && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-destructive text-base">
                Content Creation Failed
              </CardTitle>
              <CardDescription className="text-destructive/80">
                {submitError}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSubmitError(null)}
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main Wizard Component */}
        <div className="relative">
          {/* Loading Overlay */}
          {isSubmitting && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
              <div className="flex items-center gap-3 bg-card p-6 rounded-lg border shadow-lg">
                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                <div>
                  <p className="font-medium">Creating your content...</p>
                  <p className="text-sm text-muted-foreground">
                    This may take a few moments
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Content Creation Wizard */}
          <ContentCreationWizard
            initialTopicId={topicId}
            onSubmit={handleSubmit}
            onSaveDraft={handleSaveDraft}
            onCancel={handleCancel}
            debug={process.env.NODE_ENV === "development"}
          />
        </div>
      </div>
    </PageLayout>
  );
}

/**
 * Main content creation page component
 *
 * This page provides a wizard interface for creating content with AI assistance.
 * It follows the existing design patterns from the codebase and integrates with
 * the content creation system.
 */
export default function CreateContentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateContentPageContent />
    </Suspense>
  );
}
