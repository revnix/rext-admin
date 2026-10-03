"use client";

import { AlertCircle, CheckCircle, Clock, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { GenerationStep } from "@/types/content-generation-progress";

interface ProgressTimelineProps {
  steps: GenerationStep[];
  currentStep?: string;
  className?: string;
}

export function ProgressTimeline({
  steps,
  currentStep,
  className = "",
}: ProgressTimelineProps) {
  const getStepIcon = (step: GenerationStep) => {
    switch (step.status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "in-progress":
        return <Loader2 className="h-5 w-5 text-foreground animate-spin" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStepBadge = (step: GenerationStep) => {
    switch (step.status) {
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
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}min`
      : `${hours}h`;
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return null;
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Generation Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isLast = index === steps.length - 1;

            return (
              <div key={step.id} className="relative">
                {/* Timeline line */}
                {!isLast && (
                  <div
                    className={`absolute left-6 top-12 w-0.5 h-8 ${
                      step.status === "completed"
                        ? "bg-green-200"
                        : "bg-gray-200"
                    }`}
                  />
                )}

                {/* Step content */}
                <div
                  className={`flex items-start gap-4 p-4 rounded-md transition-colors ${
                    isActive
                      ? "bg-blue-50 border border-blue-200"
                      : step.status === "completed"
                        ? "bg-green-50 border border-green-200"
                        : step.status === "failed"
                          ? "bg-red-50 border border-red-200"
                          : "bg-gray-50 border border-gray-200"
                  }`}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {getStepIcon(step)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-medium text-sm">{step.title}</h3>
                      {getStepBadge(step)}
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">
                      {step.description}
                    </p>

                    {/* Progress bar for in-progress steps */}
                    {step.status === "in-progress" &&
                      step.progress !== undefined && (
                        <div className="mb-2">
                          <Progress value={step.progress} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {step.progress}% complete
                          </p>
                        </div>
                      )}

                    {/* Timestamps and duration */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {step.startedAt && (
                        <span>Started: {formatTimestamp(step.startedAt)}</span>
                      )}
                      {step.completedAt && (
                        <span>
                          Completed: {formatTimestamp(step.completedAt)}
                        </span>
                      )}
                      {step.estimatedDuration && (
                        <span>
                          Est: {formatDuration(step.estimatedDuration)}
                        </span>
                      )}
                    </div>

                    {/* Error message */}
                    {step.error && (
                      <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded-md text-sm text-red-700">
                        {step.error}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
