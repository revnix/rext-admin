"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthSession } from "@/hooks/use-auth-session";
import { analytics } from "@/lib/analytics";
import { apiClient } from "@/lib/api-client";
import { useWorkspaceStore } from "@/stores/workspace";
import { local } from "@/lib/storage";
import { ONBOARDING_STORAGE_KEYS } from "@/lib/storage-keys";

/**
 * Onboarding Progress Hook (Hybrid Approach)
 *
 * Tracks user's onboarding completion using:
 * - Real-time database queries for milestone completion
 * - LocalStorage for UI preferences (dismissed/skipped states)
 *
 * Milestones:
 * - Account created (automatic - 0%)
 * - Workspace created (50%)
 * - Content created (50%)
 * - Members invited (optional - 0%)
 *
 * @param workspaceId - Optional workspace ID for workspace-specific tracking
 *
 * @example
 * ```tsx
 * const { progress, milestones, isComplete, isDismissed } = useOnboardingProgress(workspaceId);
 *
 * if (!isComplete && !isDismissed) {
 *   return <OnboardingProgressBar progress={progress} />;
 * }
 * ```
 */

/** The tracked-milestones entry that records the completion event was sent. */
const COMPLETION_ID = "onboarding-completed";
/** The required milestones before the topic one was retired. */
const LEGACY_REQUIRED = ["workspace", "topic", "content"];

export interface OnboardingMilestone {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  weight: number; // Contribution to total progress (0-100)
  optional?: boolean; // Optional steps can be skipped
  skipped?: boolean; // Whether the user skipped this step
}

export interface OnboardingProgress {
  progress: number; // Total progress percentage (0-100)
  milestones: OnboardingMilestone[];
  isComplete: boolean;
  isDismissed: boolean;
  nextMilestone: OnboardingMilestone | null;
  dismissOnboarding: () => void;
  skipMilestone: (milestoneId: string) => void;
  resetOnboarding: () => void;
  isLoading: boolean;
}

export function useOnboardingProgress(
  workspaceId?: string,
): OnboardingProgress {
  const { user } = useAuthSession();
  const workspaceList = useWorkspaceStore((state) => state.workspaceList);
  const hasWorkspaces = workspaceList.length > 0;

  // Force re-render trigger for when workspace doesn't exist
  const [, forceUpdate] = useState(0);
  const triggerUpdate = useCallback(() => forceUpdate((n) => n + 1), []);

  // Fetch real-time workspace stats
  const {
    data: stats,
    refetch: refetchStats,
    isLoading,
    isFetching, // optional if you want more granular control
  } = useQuery({
    queryKey: ["workspace-stats", workspaceId],
    queryFn: () => {
      if (!workspaceId) throw new Error("Workspace ID required");
      return apiClient.workspaces.getStats(workspaceId);
    },
    enabled: !!workspaceId && !!user, // Only fetch if we have a workspace and user
    staleTime: 30 * 1000, // 30 seconds - balance between real-time and performance
    refetchOnMount: true, // Always refetch on mount for latest data
    refetchOnWindowFocus: true, // Refetch when user comes back to tab
  });

  // Get localStorage keys for this workspace
  const dismissedKey = ONBOARDING_STORAGE_KEYS.dismissed(workspaceId);
  const skippedKey = ONBOARDING_STORAGE_KEYS.skipped(workspaceId);
  const trackedMilestonesKey =
    ONBOARDING_STORAGE_KEYS.trackedMilestones(workspaceId);

  // Get UI preferences from localStorage
  const isDismissed = local.getBoolean(dismissedKey);
  const skippedSteps: string[] = local.getJSON<string[]>(skippedKey, []);

  // Calculate milestone completion based on real-time stats
  const milestones = useMemo<OnboardingMilestone[]>(() => {
    const contentCount = stats?.content_count || 0;
    const membersCount = stats?.members_count || 0;

    return [
      {
        id: "account",
        label: "Create Account",
        description: "Sign up and verify your email",
        completed: !!user, // Always true if hook is running
        weight: 0, // Free milestone
      },
      {
        id: "workspace",
        label: "Create Workspace",
        description: "Set up your first workspace",
        completed: hasWorkspaces,
        weight: 50,
      },
      {
        id: "content",
        label: "Create Content",
        description: "Generate your first article from a keyword",
        completed: contentCount > 0,
        weight: 50,
      },
      {
        id: "members",
        label: "Invite Team Members",
        description: "Add collaborators to your workspace",
        completed: membersCount > 1, // > 1 because owner is already a member
        weight: 0, // Optional, doesn't affect progress
        optional: true,
        skipped: skippedSteps.includes("members"),
      },
    ];
  }, [user, hasWorkspaces, stats, skippedSteps]);

  // Calculate total progress (only required milestones count)
  const progress = useMemo(() => {
    const requiredMilestones = milestones.filter((m) => !m.optional);
    const totalWeight = requiredMilestones.reduce(
      (sum, m) => sum + m.weight,
      0,
    );
    const completedWeight = requiredMilestones
      .filter((m) => m.completed)
      .reduce((sum, m) => sum + m.weight, 0);

    return totalWeight > 0
      ? Math.round((completedWeight / totalWeight) * 100)
      : 0;
  }, [milestones]);

  // Check if all required milestones are complete
  const isComplete = useMemo(() => {
    const requiredMilestones = milestones.filter((m) => !m.optional);
    return requiredMilestones.every((m) => m.completed);
  }, [milestones]);

  // Get next milestone to complete
  const nextMilestone = useMemo(() => {
    return milestones.find((m) => !m.completed && !m.skipped) || null;
  }, [milestones]);

  // Track milestone completion with analytics.
  // Persisted per-workspace (rather than diffed against an in-memory ref) so that
  // a milestone completed while this hook wasn't mounted (e.g. on another page)
  // still gets reported the next time it mounts, instead of being silently
  // treated as the starting baseline.
  useEffect(() => {
    if (isLoading || isFetching) return;

    const tracked = new Set(local.getJSON<string[]>(trackedMilestonesKey, []));
    let changed = false;

    milestones.forEach((milestone) => {
      if (!milestone.completed || tracked.has(milestone.id)) return;

      tracked.add(milestone.id);
      changed = true;

      analytics.track("onboarding_milestone_completed", {
        milestone_id: milestone.id,
        milestone_label: milestone.label,
        workspace_id: workspaceId,
        user_id: user?.id,
        progress_percentage: progress,
      });
    });

    // Completion is recorded on its own: retiring a milestone (the topic one) can complete
    // onboarding without any new milestone. Before that, it was reported when workspace, topic
    // and content were all tracked, so those users aren't counted twice.
    const completionReported =
      tracked.has(COMPLETION_ID) ||
      LEGACY_REQUIRED.every((id) => tracked.has(id));
    if (isComplete && !completionReported) {
      tracked.add(COMPLETION_ID);
      changed = true;
      analytics.track("onboarding_completed", {
        workspace_id: workspaceId,
        user_id: user?.id,
        completion_time_ms: Date.now(),
      });
    }

    if (changed) {
      local.setJSON(trackedMilestonesKey, Array.from(tracked));
    }
  }, [
    milestones,
    progress,
    isComplete,
    isLoading,
    isFetching,
    workspaceId,
    user?.id,
    trackedMilestonesKey,
  ]);

  // Helper: Dismiss onboarding
  const dismissOnboarding = useCallback(() => {
    local.setBoolean(dismissedKey, true);

    // Track dismissal
    analytics.track("onboarding_dismissed", {
      workspace_id: workspaceId,
      user_id: user?.id,
      progress_at_dismiss: progress,
      milestones_completed: milestones.filter((m) => m.completed).length,
      total_milestones: milestones.length,
    });

    // Force re-render by refetching (only if we have a workspace)
    if (workspaceId) {
      refetchStats();
    } else {
      // Force re-render without workspace
      triggerUpdate();
    }
  }, [
    dismissedKey,
    refetchStats,
    workspaceId,
    user?.id,
    progress,
    milestones,
    triggerUpdate,
  ]);

  // Helper: Skip a milestone
  const skipMilestone = useCallback(
    (milestoneId: string) => {
      const currentSkipped = local.getJSON<string[]>(skippedKey, []);
      if (!currentSkipped.includes(milestoneId)) {
        const updated = [...currentSkipped, milestoneId];
        local.setJSON(skippedKey, updated);

        // Track skipping
        const milestone = milestones.find((m) => m.id === milestoneId);
        analytics.track("onboarding_milestone_skipped", {
          milestone_id: milestoneId,
          milestone_label: milestone?.label,
          workspace_id: workspaceId,
          user_id: user?.id,
          progress_percentage: progress,
        });

        // Force re-render
        if (workspaceId) {
          refetchStats();
        } else {
          triggerUpdate();
        }
      }
    },
    [
      skippedKey,
      refetchStats,
      milestones,
      workspaceId,
      user?.id,
      progress,
      triggerUpdate,
    ],
  );

  // Helper: Reset onboarding (for testing/debugging)
  const resetOnboarding = useCallback(() => {
    local.remove(dismissedKey);
    local.remove(skippedKey);

    // Track reset
    analytics.track("onboarding_reset", {
      workspace_id: workspaceId,
      user_id: user?.id,
    });

    // Force re-render
    if (workspaceId) {
      refetchStats();
    } else {
      triggerUpdate();
    }
  }, [
    dismissedKey,
    skippedKey,
    refetchStats,
    workspaceId,
    user?.id,
    triggerUpdate,
  ]);

  return {
    progress,
    milestones,
    isComplete,
    isDismissed,
    nextMilestone,
    dismissOnboarding,
    skipMilestone,
    resetOnboarding,
    isLoading,
  };
}
