"use client";

import { motion } from "framer-motion";
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
    id: "competitor_analysis",
    label: "Competitor Analysis",
    description: "Researching market competitors and positioning",
  },
  {
    id: "persona_extraction",
    label: "Persona Extraction",
    description: "Identifying target audience and buyer personas",
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

const STEP_PROGRESS_THRESHOLDS: Record<string, number> = {
  scrape: 15,
  brand_voice: 35,
  competitor_analysis: 55,
  persona_extraction: 75,
  pipeline: 90,
};
type StepStatus = "pending" | "in-progress" | "completed" | "failed";

interface WorkspaceProgressTimelineProps {
  events: SSEEvent[];
  progress?: number;
}

/**
 * WorkspaceProgressTimeline Component
 *
 * Displays real-time progress updates for workspace creation pipeline.
 * Shows the full setup flow: Website Scraping → Brand Voice → Competitor Analysis → Persona Extraction → Finalize.
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
  const getFallbackStatus = (stepId: string): StepStatus => {
    const threshold = STEP_PROGRESS_THRESHOLDS[stepId] ?? 0;

    if (stepId === "pipeline") {
      if (progress >= 100) return "completed";
      if (progress >= threshold) return "in-progress";
      return "pending";
    }

    if (progress >= 100) return "completed";
    if (progress >= threshold) return "completed";
    if (progress >= threshold - 15) return "in-progress";
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
