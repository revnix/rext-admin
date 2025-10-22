"use client";

import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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

// Milestone action configuration
const getMilestoneAction = (milestoneId: string) => {
  const actions: Record<
    string,
    { label: string; href: string; icon: typeof ArrowRight }
  > = {
    workspace: {
      label: "Create Workspace",
      href: "/w/create",
      icon: ArrowRight,
    },
    topic: {
      label: "Create Topic",
      href: "/w/create", // Will redirect to workspace creation if needed
      icon: ArrowRight,
    },
    content: {
      label: "Create Content",
      href: "/w/create",
      icon: ArrowRight,
    },
    knowledge: {
      label: "Add Knowledge",
      href: "/w/create", // TODO: Update to knowledge base page
      icon: ArrowRight,
    },
    members: {
      label: "Invite Members",
      href: "/w/create", // TODO: Update to team invite page
      icon: ArrowRight,
    },
  };
  return actions[milestoneId];
};

// Skip milestone handler
const handleSkipMilestone = (milestoneId: string) => {
  if (typeof window !== "undefined") {
    const skipped = JSON.parse(
      localStorage.getItem("onboarding_skipped") || "[]",
    );
    if (!skipped.includes(milestoneId)) {
      localStorage.setItem(
        "onboarding_skipped",
        JSON.stringify([...skipped, milestoneId]),
      );
      // Trigger re-render by reloading
      window.location.reload();
    }
  }
};

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

  // Compact version for sidebar
  if (compact) {
    return (
      <Card className={cn("border-primary/20", className)}>
        <CardHeader className="pb-3 space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">
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
          <Progress
            value={progress}
            className={cn("h-2", isComplete && "bg-green-100")}
          />
        </CardHeader>
      </Card>
    );
  }

  // Full version - Minimal shadcn style
  return (
    <div className={cn("space-y-4", className)}>
      {/* Simple header with progress */}
      <div className="flex items-center justify-between pb-2">
        <div>
          <h3 className="text-lg font-semibold">
            {isComplete ? "Setup Complete" : "Getting Started"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isComplete
              ? "You're all set up"
              : `${milestones.filter((m) => m.completed).length} of ${milestones.length} steps completed`}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-primary">{progress}%</div>
          <Progress value={progress} className="h-2 w-24 mt-1" />
        </div>
      </div>

      {/* Big Milestone Cards - Full Width Grid */}
      {showMilestones && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {milestones.map((milestone, index) => {
            const action = getMilestoneAction(milestone.id);
            const isNext = nextMilestone?.id === milestone.id;

            // Check if this step should be enabled
            // A step is enabled if all previous required (non-optional) steps are completed
            const previousMilestones = milestones.slice(0, index);
            const previousRequiredMilestones = previousMilestones.filter(
              (m) => !m.optional,
            );
            const allPreviousCompleted = previousRequiredMilestones.every(
              (m) => m.completed,
            );
            const isEnabled =
              milestone.completed ||
              milestone.skipped ||
              milestone.optional ||
              allPreviousCompleted;

            return (
              <Card
                key={milestone.id}
                className={cn(
                  "relative transition-all duration-200",
                  milestone.completed && "border-green-600/50",
                  isNext && !milestone.completed && "border-primary",
                  !milestone.completed && !isNext && "border-muted",
                  !isEnabled && "opacity-50",
                )}
              >
                <CardHeader className="pb-3 space-y-0">
                  <div className="flex items-start justify-between mb-3">
                    {/* Icon */}
                    <div
                      className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center",
                        milestone.completed
                          ? "bg-green-100 dark:bg-green-900/30"
                          : isNext
                            ? "bg-primary/10"
                            : "bg-muted",
                      )}
                    >
                      {milestone.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <Circle
                          className={cn(
                            "h-5 w-5",
                            isNext ? "text-primary" : "text-muted-foreground",
                          )}
                        />
                      )}
                    </div>
                    {/* Step number */}
                    <div
                      className={cn(
                        "h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium",
                        milestone.completed
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {index + 1}
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-semibold leading-tight flex-1">
                      {milestone.label}
                    </CardTitle>
                    {milestone.optional && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium shrink-0">
                        Optional
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">
                    {milestone.description}
                  </p>
                </CardHeader>

                <CardContent className="pt-0">
                  {milestone.completed ? (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400 py-2">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Completed
                    </div>
                  ) : milestone.skipped ? (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground py-2">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Skipped
                    </div>
                  ) : !isEnabled ? (
                    <div className="text-xs text-muted-foreground py-2">
                      Complete previous steps first
                    </div>
                  ) : action ? (
                    <div className="space-y-2">
                      <Button
                        asChild
                        variant={isNext ? "default" : "outline"}
                        className="w-full"
                        size="sm"
                      >
                        <Link href={action.href}>
                          {action.label}
                          <action.icon className="h-3.5 w-3.5 ml-1.5" />
                        </Link>
                      </Button>
                      {milestone.optional && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs h-7"
                          onClick={() => handleSkipMilestone(milestone.id)}
                        >
                          Skip for now
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground py-2">
                      Complete previous steps
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
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
