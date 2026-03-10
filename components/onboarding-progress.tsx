"use client";

import { ArrowRight, CheckCircle2, Circle, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Celebration } from "@/components/celebration";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useOnboardingProgress } from "@/hooks/use-onboarding-progress";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/stores/workspace";
import type { Route } from "next";

/**
 * Onboarding Progress Component (Hybrid Approach)
 *
 * Displays user's onboarding completion status with:
 * - Visual progress bar
 * - Milestone checklist
 * - Real-time updates from database
 * - Workspace-specific tracking
 * - Next step guidance
 *
 * Features:
 * - Compact design suitable for dashboard or sidebar
 * - Real-time updates as user completes milestones
 * - Feature-aware navigation (checks if topic/content builders are enabled)
 * - Workspace dependency for Knowledge and Members milestones
 *
 * @example
 * ```tsx
 * // Show in dashboard for new users
 * {!isComplete && <OnboardingProgress workspaceId={workspaceId} />}
 * ```
 */

interface OnboardingProgressProps {
  compact?: boolean; // Compact mode for sidebar
  showMilestones?: boolean; // Show detailed milestone list
  className?: string;
  workspaceId?: string; // Workspace ID for workspace-specific tracking
}

// Milestone action configuration with feature-aware navigation
const getMilestoneAction = (
  milestoneId: string,
  workspaceSlug?: string,
  hasTopicBuilder?: boolean,
  hasContentBuilder?: boolean,
) => {
  const actions: Record<
    string,
    { label: string; href: string; icon: typeof ArrowRight; enabled: boolean }
  > = {
    workspace: {
      label: "Create Workspace",
      href: "/w/create",
      icon: ArrowRight,
      enabled: true,
    },
    topic: {
      label: "Create Topic",
      href:
        hasTopicBuilder && workspaceSlug
          ? `/w/${workspaceSlug}/topics/create`
          : "/w/create",
      icon: ArrowRight,
      enabled: !!workspaceSlug, // Only enabled after workspace created
    },
    content: {
      label: "Create Content",
      href:
        hasContentBuilder && workspaceSlug
          ? `/w/${workspaceSlug}/content/create`
          : "/w/create",
      icon: ArrowRight,
      enabled: !!workspaceSlug, // Only enabled after workspace created
    },
    knowledge: {
      label: "Add Knowledge",
      href: workspaceSlug ? `/w/${workspaceSlug}/knowledge` : "/w/create",
      icon: ArrowRight,
      enabled: !!workspaceSlug, // Only enabled after workspace created
    },
    members: {
      label: "Invite Members",
      href: workspaceSlug ? `/w/${workspaceSlug}/members` : "/w/create",
      icon: ArrowRight,
      enabled: !!workspaceSlug, // Only enabled after workspace created
    },
  };
  return actions[milestoneId];
};

export function OnboardingProgress({
  compact = false,
  showMilestones = true,
  className,
  workspaceId,
}: OnboardingProgressProps) {
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const workspaceSlug = currentWorkspace?.slug;

  const {
    progress,
    milestones,
    isComplete,
    isDismissed,
    nextMilestone,
    skipMilestone,
    dismissOnboarding,
  } = useOnboardingProgress(workspaceId);

  // Celebration states (only for full completion)
  const [showCelebration, setShowCelebration] = useState(false);

  // Show celebration when onboarding completes
  useEffect(() => {
    if (isComplete && !isDismissed && !compact) {
      setShowCelebration(true);
    }
  }, [isComplete, isDismissed, compact]);

  // Get feature flags from stats (via the hook)
  // For now, we'll assume builders are always available
  // TODO(TASK-126): Get from subscription via stats endpoint
  const hasTopicBuilder = true;
  const hasContentBuilder = true;

  if (isDismissed || (isComplete && !compact)) {
    // Hide when dismissed or complete
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
    <>
      {/* Celebration animation (only when fully complete) */}
      {showCelebration && (
        <Celebration onComplete={() => setShowCelebration(false)} />
      )}

      <div className={cn("space-y-4", className)}>
        {/* Simple header with progress and dismiss button */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold">
                {isComplete ? "Setup Complete" : "Getting Started"}
              </h3>
              {!isComplete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={dismissOnboarding}
                  title="Dismiss onboarding"
                >
                  <X className="h-4 w-4 mr-1" />
                  Dismiss
                </Button>
              )}
            </div>
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
              const action = getMilestoneAction(
                milestone.id,
                workspaceSlug,
                hasTopicBuilder,
                hasContentBuilder,
              );
              const isNext = nextMilestone?.id === milestone.id;

              // Check if this step should be enabled
              // Special handling: Knowledge and Members are only enabled after workspace is created
              const workspaceCreated = milestones.find(
                (m) => m.id === "workspace",
              )?.completed;

              const isEnabled =
                milestone.completed ||
                milestone.skipped ||
                milestone.id === "workspace" || // Workspace is always enabled
                milestone.id === "account" || // Account is always enabled
                (["topic", "content", "knowledge", "members"].includes(
                  milestone.id,
                ) &&
                  workspaceCreated); // Others need workspace first

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
                      {milestone.optional && isEnabled && (
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
                        {milestone.id === "workspace"
                          ? "Get started"
                          : "Create workspace first"}
                      </div>
                    ) : action ? (
                      <div className="space-y-2">
                        <Button
                          asChild
                          variant={isNext ? "default" : "outline"}
                          className="w-full"
                          size="sm"
                          disabled={!action.enabled}
                        >
                          <Link href={action.href as Route}>
                            {action.label}
                            <action.icon className="h-3.5 w-3.5 ml-1.5" />
                          </Link>
                        </Button>
                        {milestone.optional && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs h-7"
                            onClick={() => skipMilestone(milestone.id)}
                          >
                            Skip for now
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground py-2">
                        Complete workspace first
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

/**
 * Compact version for sidebar
 */
export function OnboardingProgressCompact({
  workspaceId,
}: {
  workspaceId?: string;
}) {
  return (
    <div className="px-2 py-4">
      <OnboardingProgress
        compact
        showMilestones={false}
        workspaceId={workspaceId}
      />
    </div>
  );
}
