"use client";

import { motion } from "framer-motion";
import { Check, Clock, Loader2, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { SSEEvent } from "@/types/sse";

interface ProgressStep {
  id: string;
  label: string;
  description: string;
}

const WORKSPACE_STEPS: ProgressStep[] = [
  {
    id: "scrape",
    label: "Website Scraping",
    description: "Analyzing your website content",
  },
  {
    id: "brand_voice",
    label: "Brand Voice",
    description: "Extracting brand characteristics with AI",
  },
  {
    id: "pipeline",
    label: "Finalization",
    description: "Completing workspace setup",
  },
];

type StepStatus = "pending" | "in-progress" | "completed" | "failed";

interface WorkspaceProgressTimelineProps {
  events: SSEEvent[];
  progress?: number;
}

/**
 * WorkspaceProgressTimeline Component
 *
 * Displays real-time progress updates for workspace creation pipeline.
 * Shows 3 main steps: Scraping → Brand Voice → Finalization.
 *
 * @example
 * ```tsx
 * const { events, latestEvent } = useSSEChannel(operationId);
 * <WorkspaceProgressTimeline
 *   events={events}
 *   progress={latestEvent?.progress || 0}
 * />
 * ```
 */
export function WorkspaceProgressTimeline({
  events,
  progress = 0,
}: WorkspaceProgressTimelineProps) {
  /**
   * Determine step status from events
   */
  const getStepStatus = (stepId: string): StepStatus => {
    const stepEvents = events.filter((e) => e.step.startsWith(stepId));

    // Special handling for finalization step based on overall progress
    if (stepId === "pipeline") {
      if (progress === 100) return "completed";
      if (progress >= 90) return "in-progress";
      return "pending";
    }

    if (stepEvents.length === 0) return "pending";

    const latestEvent = stepEvents[stepEvents.length - 1];

    if (latestEvent.step.includes("completed")) return "completed";
    if (latestEvent.step.includes("failed")) return "failed";
    if (
      latestEvent.step.includes("started") ||
      latestEvent.status === "progress"
    )
      return "in-progress";

    return "pending";
  };

  /**
   * Get icon component based on step status
   */
  const getStepIcon = (status: StepStatus) => {
    switch (status) {
      case "completed":
        return <Check className="h-5 w-5 text-green-600" />;
      case "failed":
        return <X className="h-5 w-5 text-red-600" />;
      case "in-progress":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  /**
   * Get latest event message for a step
   */
  const getLatestMessage = (stepId: string): string | null => {
    const stepEvents = events.filter((e) => e.step.startsWith(stepId));
    if (stepEvents.length === 0) return null;
    return stepEvents[stepEvents.length - 1].message;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Creating Your Workspace</CardTitle>
        <CardDescription>
          Please wait while we analyze your website and set up your workspace
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Overall Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Timeline */}
        <div className="space-y-4">
          {WORKSPACE_STEPS.map((step, index) => {
            const status = getStepStatus(step.id);
            const latestMessage = getLatestMessage(step.id);
            const isLast = index === WORKSPACE_STEPS.length - 1;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`
                    flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full
                    ${status === "completed" ? "bg-green-100" : ""}
                    ${status === "in-progress" ? "bg-blue-100" : ""}
                    ${status === "failed" ? "bg-red-100" : ""}
                    ${status === "pending" ? "bg-gray-100" : ""}
                  `}
                  >
                    {getStepIcon(status)}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <h4
                      className={`
                      font-medium
                      ${status === "completed" ? "text-green-900" : ""}
                      ${status === "in-progress" ? "text-blue-900" : ""}
                      ${status === "failed" ? "text-red-900" : ""}
                      ${status === "pending" ? "text-gray-500" : ""}
                    `}
                    >
                      {step.label}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>

                    {/* Show latest event message for this step */}
                    {status === "in-progress" && latestMessage && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1 text-xs text-blue-600"
                      >
                        {latestMessage}
                      </motion.p>
                    )}

                    {/* Show error message for failed steps */}
                    {status === "failed" && latestMessage && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1 text-xs text-red-600"
                      >
                        {latestMessage}
                      </motion.p>
                    )}
                  </div>
                </div>

                {/* Connector Line */}
                {!isLast && (
                  <div className="absolute left-5 top-12 h-8 w-px bg-border" />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Latest Event Message */}
        {events.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 rounded-lg bg-muted p-3"
          >
            <p className="text-sm text-muted-foreground">
              {events[events.length - 1].message}
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
