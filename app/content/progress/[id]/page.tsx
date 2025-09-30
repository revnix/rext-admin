"use client";

import { ArrowLeft, RefreshCw } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ProgressStatus } from "@/components/content-generation/progress-status";
import { ProgressTimeline } from "@/components/content-generation/progress-timeline";
import { Button } from "@/components/ui/button";
import type {
  ContentGenerationProgress,
  GenerationStep,
  GenerationStepStatus,
} from "@/types/content-generation-progress";
import { GENERATION_STEPS } from "@/types/content-generation-progress";

// Mock data generator for demo purposes
const generateMockProgress = (id: string): ContentGenerationProgress => {
  const steps: GenerationStep[] = GENERATION_STEPS.map((stepTemplate) => ({
    ...stepTemplate,
    status: "pending" as GenerationStepStatus,
    startedAt: undefined,
    completedAt: undefined,
    progress: undefined,
    error: undefined,
  }));

  // Simulate some progress for demo
  const mockStatuses: GenerationStepStatus[] = [
    "completed",
    "completed",
    "in-progress",
    "pending",
    "pending",
  ];
  steps.forEach((step, index) => {
    step.status = mockStatuses[index] || "pending";
    if (step.status === "completed") {
      step.startedAt = new Date(
        Date.now() - (5 - index) * 2 * 60 * 1000,
      ).toISOString();
      step.completedAt = new Date(
        Date.now() - (5 - index) * 2 * 60 * 1000 + 60 * 1000,
      ).toISOString();
    } else if (step.status === "in-progress") {
      step.startedAt = new Date(Date.now() - 30 * 1000).toISOString();
      step.progress = 65;
    }
  });

  return {
    id,
    status: "in-progress",
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    totalEstimatedDuration: 8,
    currentStep: "content-generation",
    steps,
    metadata: {
      topicId: "sample-topic-id",
      contentType: "Article/Blog Post",
      formData: {},
    },
  };
};

export default function ContentProgressPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [progress, setProgress] = useState<ContentGenerationProgress | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Simulate fetching progress data
  const fetchProgress = useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) setIsRefreshing(true);

      try {
        // In a real implementation, this would be an API call
        await new Promise((resolve) => setTimeout(resolve, 500));
        const mockData = generateMockProgress(id);
        setProgress(mockData);
      } catch (_error) {
        toast.error("Failed to load progress data");
      } finally {
        setIsLoading(false);
        if (showRefreshing) setIsRefreshing(false);
      }
    },
    [id],
  );

  // Initial load and polling setup
  useEffect(() => {
    fetchProgress();

    // Set up polling every 5 seconds for active generations
    const interval = setInterval(() => {
      if (progress && ["in-progress", "queued"].includes(progress.status)) {
        fetchProgress();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchProgress, progress]);

  const handleCancel = async () => {
    try {
      // In a real implementation, this would cancel the generation
      toast.success("Content generation cancelled");
      // Update local state
      if (progress) {
        setProgress({
          ...progress,
          status: "cancelled",
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (_error) {
      toast.error("Failed to cancel generation");
    }
  };

  const handleRetry = async () => {
    try {
      // In a real implementation, this would retry the generation
      toast.success("Content generation restarted");
      // Simulate restart
      const retryProgress = generateMockProgress(id);
      retryProgress.status = "in-progress";
      setProgress(retryProgress);
    } catch (_error) {
      toast.error("Failed to retry generation");
    }
  };

  const handleRefresh = () => {
    fetchProgress(true);
  };

  const handleGoBack = () => {
    router.push("/content");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading progress...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">
                Content generation not found
              </p>
              <p className="text-muted-foreground mb-4">
                The content generation with ID "{id}" could not be found.
              </p>
              <Button onClick={handleGoBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Content
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleGoBack} size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Content
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                Content Generation Progress
              </h1>
              <p className="text-muted-foreground">
                Track the progress of your content generation
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            size="sm"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Card */}
          <div className="lg:col-span-1">
            <ProgressStatus
              progress={progress}
              onCancel={handleCancel}
              onRetry={handleRetry}
            />
          </div>

          {/* Timeline */}
          <div className="lg:col-span-2">
            <ProgressTimeline
              steps={progress.steps}
              currentStep={progress.currentStep}
            />
          </div>
        </div>

        {/* Additional Information */}
        {progress.status === "completed" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-800 mb-2">
              Generation Complete!
            </h3>
            <p className="text-green-700 text-sm mb-3">
              Your content has been successfully generated and is ready for
              review.
            </p>
            <Button asChild size="sm">
              <a href={`/content/${progress.id}`}>View Generated Content</a>
            </Button>
          </div>
        )}

        {progress.status === "failed" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-medium text-red-800 mb-2">Generation Failed</h3>
            <p className="text-red-700 text-sm mb-3">
              There was an issue generating your content. You can retry the
              generation or contact support if the problem persists.
            </p>
            <div className="flex gap-3">
              <Button onClick={handleRetry} size="sm">
                Retry Generation
              </Button>
              <Button variant="outline" size="sm">
                Contact Support
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
