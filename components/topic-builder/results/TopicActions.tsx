"use client";

/**
 * TopicActions - Refactored Component
 *
 * This file now serves as a thin wrapper around the modular TopicActionMenu component.
 * The original 1,095-line monolithic component has been refactored into:
 * - 6 custom hooks for business logic (in ./actions/hooks/)
 * - 6 individual action components (in ./actions/)
 * - 1 orchestrator component (TopicActionMenu)
 *
 * For implementation details, see ./actions/
 *
 * Refactored: October 16, 2025
 * Original file backed up as: TopicActions.old.tsx
 */

import type { GeneratedTopic } from "@/types/topic-builder";
import { TopicActionMenu } from "./actions";

interface TopicActionsProps {
  topic: GeneratedTopic;
  onSave?: (topicId: string) => Promise<void> | void;
  onEdit?: (
    topicId: string,
    updates: Partial<GeneratedTopic>,
  ) => Promise<void> | void;
  onRegenerate?: (topicId: string) => Promise<void> | void;
  onExport?: (
    topics: GeneratedTopic[],
    format: "json" | "csv",
  ) => Promise<void> | void;
  onDelete?: (topicId: string) => Promise<void> | void;
  onNavigateToTopics?: () => void;
  onGenerateNew?: () => void;
  onNavigateToContent?: (topicId: string) => void;
  className?: string;
  variant?: "dropdown" | "buttons";
  showLabels?: boolean;
}

export function TopicActions(props: TopicActionsProps) {
  return <TopicActionMenu {...props} />;
}
