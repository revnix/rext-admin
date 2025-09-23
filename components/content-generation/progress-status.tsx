"use client";

import { AlertCircle, CheckCircle, Loader2, Play, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ContentGenerationProgress } from "@/types/content-generation-progress";

interface ProgressStatusProps {
  progress: ContentGenerationProgress;
  onCancel?: () => void;
  onRetry?: () => void;
  className?: string;
}

export function ProgressStatus({
  progress,
  onCancel,
  onRetry,
  className = "",
}: ProgressStatusProps) {
  const getStatusIcon = () => {
    switch (progress.status) {
      case "completed":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "in-progress":
        return <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />;
      case "failed":
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      case "cancelled":
        return <X className="h-6 w-6 text-gray-500" />;
      default:
        return <Play className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (progress.status) {
      case "completed":
        return (
          <Badge
            variant="default"
            className="bg-green-100 text-green-700 border-green-200"
          >
            Completed
          </Badge>
        );
      case "in-progress":
        return (
          <Badge
            variant="default"
            className="bg-blue-100 text-blue-700 border-blue-200"
          >
            In Progress
          </Badge>
        );
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-700">
            Cancelled
          </Badge>
        );
      case "queued":
        return <Badge variant="outline">Queued</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const calculateOverallProgress = () => {
    const completedSteps = progress.steps.filter(
      (step) => step.status === "completed",
    ).length;
    const totalSteps = progress.steps.length;
    const currentStepProgress =
      progress.steps.find((step) => step.status === "in-progress")?.progress ||
      0;

    // Add partial progress from current step
    const baseProgress = (completedSteps / totalSteps) * 100;
    const currentStepContribution =
      (currentStepProgress / 100) * (1 / totalSteps) * 100;

    return Math.min(100, baseProgress + currentStepContribution);
  };

  const getEstimatedTimeRemaining = () => {
    if (progress.status === "completed") return null;

    const remainingSteps = progress.steps.filter(
      (step) => step.status === "pending" || step.status === "in-progress",
    );

    const totalMinutes = remainingSteps.reduce((sum, step) => {
      if (step.status === "in-progress" && step.progress) {
        // Calculate remaining time for current step
        const remainingProgress = (100 - step.progress) / 100;
        return sum + (step.estimatedDuration || 0) * remainingProgress;
      }
      return sum + (step.estimatedDuration || 0);
    }, 0);

    if (totalMinutes < 1) return "Less than 1 minute";
    if (totalMinutes < 60) return `${Math.round(totalMinutes)} minutes`;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <div className="text-lg">Content Generation</div>
              <div className="text-sm font-normal text-muted-foreground">
                ID: {progress.id}
              </div>
            </div>
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        {progress.status === "in-progress" && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">
                {Math.round(calculateOverallProgress())}%
              </span>
            </div>
            <Progress value={calculateOverallProgress()} className="h-3" />
          </div>
        )}

        {/* Time Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">
              Started
            </h4>
            <p className="text-sm">{formatTimestamp(progress.createdAt)}</p>
          </div>

          {progress.status === "completed" && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Completed
              </h4>
              <p className="text-sm">{formatTimestamp(progress.updatedAt)}</p>
            </div>
          )}

          {progress.status === "in-progress" && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Estimated Time Remaining
              </h4>
              <p className="text-sm">{getEstimatedTimeRemaining()}</p>
            </div>
          )}
        </div>

        {/* Content Information */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Content Details
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">Topic:</span>
              <Badge variant="outline" className="text-xs">
                {progress.metadata.topicId}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Type:</span>
              <Badge variant="outline" className="text-xs">
                {progress.metadata.contentType}
              </Badge>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          {progress.status === "in-progress" && onCancel && (
            <Button variant="outline" onClick={onCancel} size="sm">
              <X className="h-4 w-4 mr-2" />
              Cancel Generation
            </Button>
          )}

          {progress.status === "failed" && onRetry && (
            <Button onClick={onRetry} size="sm">
              <Play className="h-4 w-4 mr-2" />
              Retry Generation
            </Button>
          )}

          {progress.status === "completed" && (
            <Button asChild size="sm">
              <a href={`/content/${progress.id}`}>View Generated Content</a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
