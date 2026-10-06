"use client";

import { motion } from "motion/react";
import { Check, Clock, Loader2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
    id: "persona_extraction",
    label: "Persona Extraction",
    description: "Identifying target audience and buyer personas",
  },
  {
    id: "competitor_analysis",
    label: "Competitor Analysis",
    description: "Researching market competitors and positioning",
  },
  {
    id: "pipeline",
    label: "Finalize",
    description: "Completing workspace setup",
  },
];

const STEP_ID_ALIASES: Record<string, string[]> = {
  scrape: ["scrape", "website_scraping", "website-scraping"],
  brand_voice: ["brand_voice", "brand-voice", "brandvoice"],
  competitor_analysis: [
    "competitor_analysis",
    "competitor-analysis",
    "competitor",
    "competitor_discovery",
    "competitor-discovery",
    "find",
    "competitor_find",
    "competitor-find",
  ],
  persona_extraction: [
    "persona_extraction",
    "persona-extraction",
    "persona",
    "persona_find",
    "persona-find",
  ],
  pipeline: ["pipeline", "finalize", "finalization"],
};

const STEP_PROGRESS_THRESHOLDS: Record<
  string,
  { startsAt: number; completesAt: number }
> = {
  scrape: { startsAt: 10, completesAt: 30 },
  brand_voice: { startsAt: 70, completesAt: 80 },
  persona_extraction: { startsAt: 81, completesAt: 90 },
  competitor_analysis: { startsAt: 91, completesAt: 98 },
  pipeline: { startsAt: 98, completesAt: 100 },
};
type StepStatus = "pending" | "in-progress" | "completed" | "failed";

interface WorkspaceProgressTimelineProps {
  events: SSEEvent[];
  progress?: number;
  isFinalizing?: boolean;
}

/**
 * WorkspaceProgressTimeline Component
 *
 * Displays real-time progress updates for workspace creation pipeline.
 * Shows the backend sequence, inferring Persona Extraction between competitor
 * discovery and pipeline completion because the backend emits no persona event.
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
  isFinalizing = false,
}: WorkspaceProgressTimelineProps) {
  /**
   * Determine step status from events
   */
  const getFallbackStatus = (stepId: string): StepStatus => {
    const threshold = STEP_PROGRESS_THRESHOLDS[stepId];
    if (!threshold) return "pending";
    if (progress >= threshold.completesAt) return "completed";
    if (progress >= threshold.startsAt) return "in-progress";
    return "pending";
  };

  const getStepStatus = (stepId: string): StepStatus => {
    const aliases = STEP_ID_ALIASES[stepId] ?? [stepId];
    const stepEvents = events.filter((event) => {
      const stepName = event.step.toLowerCase();
      return aliases.some(
        (alias) =>
          stepName === alias ||
          stepName.startsWith(`${alias}.`) ||
          stepName.startsWith(`${alias}_`) ||
          stepName.startsWith(`${alias}-`) ||
          stepName.includes(alias),
      );
    });

    if (stepEvents.length === 0) {
      if (stepId === "persona_extraction") {
        const pipelineCompleted = events.some(
          (event) =>
            event.step.toLowerCase() === "pipeline.completed" ||
            (event.step.toLowerCase().startsWith("pipeline") &&
              event.status === "completed"),
        );
        if (pipelineCompleted) return "completed";
        if (getStepStatus("competitor_analysis") === "completed") {
          return "in-progress";
        }
      }
      return getFallbackStatus(stepId);
    }

    const latestEvent = stepEvents[stepEvents.length - 1];

    if (
      latestEvent.status === "completed" ||
      latestEvent.step.toLowerCase().includes("completed") ||
      latestEvent.message.toLowerCase().includes("successfully")
    )
      return "completed";
    if (
      latestEvent.status === "failed" ||
      latestEvent.step.toLowerCase().includes("failed")
    )
      return "failed";
    if (
      latestEvent.step.toLowerCase().includes("started") ||
      latestEvent.status === "progress" ||
      latestEvent.message.toLowerCase().includes("processing") ||
      latestEvent.message.toLowerCase().includes("analyzing")
    )
      return "in-progress";

    return getFallbackStatus(stepId);
  };

  // Show pipeline stages one at a time. Progress percentages can move ahead of
  // the active SSE step, so later stages must wait until every earlier stage
  // has explicitly reached completed.
  const getSequentialStepStatus = (stepId: string): StepStatus => {
    const stepIndex = WORKSPACE_STEPS.findIndex((step) => step.id === stepId);
    for (let index = 0; index < stepIndex; index += 1) {
      if (getStepStatus(WORKSPACE_STEPS[index].id) !== "completed") {
        return "pending";
      }
    }
    const status = getStepStatus(stepId);
    if (stepId === "pipeline" && status === "completed" && isFinalizing) {
      return "in-progress";
    }
    return status;
  };

  /**
   * Get icon component based on step status
   */
  const getStepIcon = (status: StepStatus) => {
    switch (status) {
      case "completed":
        return <Check className="h-5 w-5 text-success-600" />;
      case "failed":
        return <X className="h-5 w-5 text-danger-600" />;
      case "in-progress":
        return <Loader2 className="h-5 w-5 animate-spin text-foreground" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  /**
   * Get latest event message for a step
   */
  const getLatestMessage = (stepId: string): string | null => {
    const aliases = STEP_ID_ALIASES[stepId] ?? [stepId];
    const stepEvents = events.filter((event) => {
      const stepName = event.step.toLowerCase();
      return aliases.some(
        (alias) =>
          stepName === alias ||
          stepName.startsWith(`${alias}.`) ||
          stepName.startsWith(`${alias}_`) ||
          stepName.startsWith(`${alias}-`),
      );
    });
    if (stepEvents.length === 0) return null;
    return stepEvents[stepEvents.length - 1].message;
  };

  return (
    <Card className="border-none">
      <CardContent className="space-y-6 pt-4">
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
            const status = getSequentialStepStatus(step.id);
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
                    flex h-10 w-10 shrink-0 items-center justify-center rounded-full
                    ${status === "completed" ? "bg-success-50" : ""}
                    ${status === "in-progress" ? "bg-info-50" : ""}
                    ${status === "failed" ? "bg-danger-50" : ""}
                    ${status === "pending" ? "bg-surface-inset" : ""}
                  `}
                  >
                    {getStepIcon(status)}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <h4
                      className={`
                      font-medium
                      ${status === "completed" ? "text-success-700" : ""}
                      ${status === "in-progress" ? "text-info-700" : ""}
                      ${status === "failed" ? "text-danger-700" : ""}
                      ${status === "pending" ? "text-muted-foreground" : ""}
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
                        className="mt-1 text-xs text-info-600"
                      >
                        {latestMessage}
                      </motion.p>
                    )}

                    {/* Show error message for failed steps */}
                    {status === "failed" && latestMessage && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1 text-xs text-danger-600"
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
            className="mt-4 rounded-md bg-muted p-3"
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
