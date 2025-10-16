/**
 * Shared types for Topic Actions components
 */

import type { BackendError } from "@/types/backend";
import type { GeneratedTopic } from "@/types/topic-builder";

/**
 * Common props shared across all action components
 */
export interface BaseActionProps {
  topic: GeneratedTopic;
  disabled?: boolean;
  showLabel?: boolean;
}

/**
 * Loading states for various actions
 */
export interface LoadingStates {
  saving: boolean;
  editing: boolean;
  regenerating: boolean;
  exporting: boolean;
  deleting: boolean;
  navigatingToContent: boolean;
}

/**
 * Error states for various actions
 */
export interface ErrorStates {
  saving?: BackendError;
  editing?: BackendError;
  regenerating?: BackendError;
  exporting?: BackendError;
  deleting?: BackendError;
  navigatingToContent?: BackendError;
}

/**
 * Success message states for various actions
 */
export interface SuccessStates {
  saving?: string;
  editing?: string;
  regenerating?: string;
  exporting?: string;
  deleting?: string;
  navigatingToContent?: string;
}

/**
 * Export format options
 */
export type ExportFormat = "json" | "csv";

/**
 * Callback handlers for topic actions
 */
export interface TopicActionHandlers {
  onSave?: (topicId: string) => Promise<void> | void;
  onEdit?: (
    topicId: string,
    updates: Partial<GeneratedTopic>,
  ) => Promise<void> | void;
  onRegenerate?: (topicId: string) => Promise<void> | void;
  onExport?: (
    topics: GeneratedTopic[],
    format: ExportFormat,
  ) => Promise<void> | void;
  onDelete?: (topicId: string) => Promise<void> | void;
  onNavigateToContent?: (topicId: string) => void;
  onNavigateToTopics?: () => void;
  onGenerateNew?: () => void;
}

/**
 * Result of an action operation
 */
export interface ActionResult {
  success: boolean;
  error?: BackendError;
  message?: string;
}
