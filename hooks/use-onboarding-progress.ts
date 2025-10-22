"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useWorkspaceStore } from "@/stores/workspace";

/**
 * Onboarding Progress Hook
 *
 * Tracks user's onboarding completion across multiple milestones:
 * - Account created (automatic - 0%)
 * - First workspace created (40%)
 * - First topic created (70%)
 * - First content created (100%)
 *
 * Returns progress percentage and milestone status for UI display.
 *
 * @example
 * ```tsx
 * const { progress, milestones, isComplete } = useOnboardingProgress();
 *
 * if (!isComplete) {
 *   return <OnboardingProgressBar progress={progress} />;
 * }
 * ```
 */

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
  nextMilestone: OnboardingMilestone | null;
}

export function useOnboardingProgress(): OnboardingProgress {
  const { user } = useAuthSession();
  const workspaceList = useWorkspaceStore((state) => state.workspaceList);
  const hasWorkspaces = workspaceList.length > 0;

  // Fetch topics count for current user (across all workspaces)
  const { data: topicsData } = useQuery({
    queryKey: ["user-topics-count", user?.id],
    queryFn: async () => {
      // This is a simplified check - you may want to create a dedicated endpoint
      // For now, we'll use workspace list as a proxy
      // In production, create: GET /api/users/me/onboarding-stats
      return { count: 0 }; // Placeholder
    },
    enabled: !!user?.id && hasWorkspaces,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch content count
  const { data: contentData } = useQuery({
    queryKey: ["user-content-count", user?.id],
    queryFn: async () => {
      return { count: 0 }; // Placeholder
    },
    enabled: !!user?.id && hasWorkspaces,
    staleTime: 5 * 60 * 1000,
  });

  // Calculate milestone completion
  const milestones = useMemo<OnboardingMilestone[]>(() => {
    const topicCount = topicsData?.count || 0;
    const contentCount = contentData?.count || 0;

    // Get skipped steps from localStorage
    const skippedSteps =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("onboarding_skipped") || "[]")
        : [];

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
        weight: 40,
      },
      {
        id: "topic",
        label: "Create Topic",
        description: "Generate your first content topic",
        completed: topicCount > 0,
        weight: 30,
      },
      {
        id: "content",
        label: "Create Content",
        description: "Publish your first piece of content",
        completed: contentCount > 0,
        weight: 30,
      },
      {
        id: "knowledge",
        label: "Add Knowledge Base",
        description: "Upload documents to your knowledge base",
        completed: false, // TODO: Implement knowledge base check
        weight: 0, // Optional, doesn't affect progress
        optional: true,
        skipped: skippedSteps.includes("knowledge"),
      },
      {
        id: "members",
        label: "Invite Team Members",
        description: "Add collaborators to your workspace",
        completed: false, // TODO: Implement team members check
        weight: 0, // Optional, doesn't affect progress
        optional: true,
        skipped: skippedSteps.includes("members"),
      },
    ];
  }, [user, hasWorkspaces, topicsData?.count, contentData?.count]);

  // Calculate total progress
  const progress = useMemo(() => {
    const totalWeight = milestones.reduce((sum, m) => sum + m.weight, 0);
    const completedWeight = milestones
      .filter((m) => m.completed)
      .reduce((sum, m) => sum + m.weight, 0);

    return Math.round((completedWeight / totalWeight) * 100);
  }, [milestones]);

  // Check if onboarding is complete
  const isComplete = milestones.every((m) => m.completed);

  // Get next milestone to complete
  const nextMilestone = milestones.find((m) => !m.completed) || null;

  return {
    progress,
    milestones,
    isComplete,
    nextMilestone,
  };
}
