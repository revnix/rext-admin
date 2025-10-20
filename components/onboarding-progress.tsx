"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useOnboardingProgress } from "@/hooks/use-onboarding-progress";
import { cn } from "@/lib/utils";

/**
 * Onboarding Progress Component
 *
 * Displays user's onboarding completion status with:
 * - Visual progress bar
 * - Milestone checklist
 * - Motivational messaging
 * - Next step guidance
 *
 * Features:
 * - Compact design suitable for dashboard or sidebar
 * - Real-time updates as user completes milestones
 * - Celebratory styling when complete
 *
 * @example
 * ```tsx
 * // Show in dashboard for new users
 * {!isComplete && <OnboardingProgress />}
 * ```
 */

interface OnboardingProgressProps {
  compact?: boolean; // Compact mode for sidebar
  showMilestones?: boolean; // Show detailed milestone list
  className?: string;
}

export function OnboardingProgress({
  compact = false,
  showMilestones = true,
  className,
}: OnboardingProgressProps) {
  const { progress, milestones, isComplete, nextMilestone } =
    useOnboardingProgress();

  if (isComplete && !compact) {
    // Optionally hide when complete, or show celebration
    return null;
  }

  return (
    <Card className={cn("border-primary/20", className)}>
      <CardHeader className={compact ? "pb-3" : undefined}>
        <div className="flex items-center justify-between">
          <CardTitle className={compact ? "text-sm" : "text-base"}>
            {isComplete ? "Setup Complete! 🎉" : "Getting Started"}
          </CardTitle>
          <span
            className={cn(
              "text-sm font-semibold",
              isComplete ? "text-green-600" : "text-primary",
            )}
          >
            {progress}%
          </span>
        </div>

        {/* Progress Bar */}
        <Progress
          value={progress}
          className={cn("h-2", isComplete && "bg-green-100")}
        />

        {/* Next Step Hint */}
        {!isComplete && nextMilestone && !compact && (
          <p className="text-xs text-muted-foreground mt-2">
            Next: {nextMilestone.description}
          </p>
        )}
      </CardHeader>

      {/* Milestone List */}
      {showMilestones && !compact && (
        <CardContent className="space-y-2">
          {milestones.map((milestone) => (
            <div
              key={milestone.id}
              className={cn(
                "flex items-start gap-3 p-2 rounded-md transition-colors",
                milestone.completed
                  ? "bg-green-50 dark:bg-green-950/20"
                  : "bg-muted/30",
              )}
            >
              {milestone.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p
                  className={cn(
                    "text-sm font-medium",
                    milestone.completed
                      ? "text-green-900 dark:text-green-100"
                      : "text-foreground",
                  )}
                >
                  {milestone.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {milestone.description}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}

/**
 * Compact version for sidebar
 */
export function OnboardingProgressCompact() {
  return (
    <div className="px-2 py-4">
      <OnboardingProgress compact showMilestones={false} />
    </div>
  );
}
