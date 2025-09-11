/**
 * Topic Builder Results Component Types
 * Types for topic results, cards, actions, and related components
 */

import type { GeneratedTopic } from "./topic-builder";

// View Mode (simplified - only grid used now)
export type ViewMode = "grid" | "list";

// Topics List
export interface TopicsListProps {
  topics: GeneratedTopic[];
  onTopicSave: (topicId: string) => void;
  onTopicEdit?: (
    topicId: string,
    updates: Partial<GeneratedTopic>,
  ) => Promise<void> | void;
  onTopicRegenerate?: (topicId: string) => Promise<void> | void;
  onTopicExport?: (
    topics: GeneratedTopic[],
    format: "json" | "csv",
  ) => Promise<void> | void;
  onTopicDelete?: (topicId: string) => Promise<void> | void;
  onBulkSave: (topicIds: string[]) => void;
  onBackToWizard: () => void;
  onRegenerateTopics: (count: number) => void;
  onNavigateToTopics?: () => void;
  onGenerateNew?: () => void;
  className?: string;
}

// Topic Card
export interface TopicCardProps {
  topic: GeneratedTopic;
  onSelect?: (id: string, selected: boolean) => void;
  isSelected?: boolean;
  isHighlighted?: boolean;
  onSave?: (topicId: string) => Promise<void> | void;
  onNavigateToContent?: (topicId: string) => void;
  onViewDetails?: (topicId: string) => void;
  onCopy?: (topicId: string) => void;
  className?: string;
}

// Topic Card Actions
export interface TopicCardActionsProps {
  topic: GeneratedTopic;
  onSave?: (topicId: string) => Promise<void> | void;
  onNavigateToContent?: (topicId: string) => void;
  onViewDetails?: (topicId: string) => void;
  onCopy?: (topicId: string) => void;
}

// Topic Score Display
export interface TopicScoreDisplayProps {
  topic: GeneratedTopic;
}

// Topics Header
export interface TopicsHeaderProps {
  filteredCount: number;
  totalCount: number;
  hasActiveFilters: boolean;
  isGeneratingMore?: boolean;
  onRegenerateTopics: (count: number) => void;
  onBackToWizard: () => void;
  // Bulk save functionality
  selectedTopicIds?: string[];
  selectedTopics?: GeneratedTopic[];
  isBulkSaving?: boolean;
  onBulkSave?: (topicIds: string[]) => void;
  onClearSelection?: () => void;
}

// Topics Grid
export interface TopicsGridProps {
  topics: GeneratedTopic[];
  selectedTopicIds: string[];
  viewMode: ViewMode;
  newlyAddedTopicIds?: string[];
  onTopicSelect: (topicId: string, selected: boolean) => void;
  onTopicSave: (topicId: string) => void;
  onNavigateToContent: (topicId: string) => void;
  onViewDetails: (topicId: string) => void;
  onCopyTopic: (topicId: string) => void;
}

// Empty States
export interface EmptyStatesProps {
  variant: "no-topics" | "no-matches";
  totalTopics?: number;
  onBackToWizard: () => void;
  onClearFilters?: () => void;
}

// Topic Detail Drawer
export interface TopicDetailDrawerProps {
  topic: GeneratedTopic | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (topicId: string) => Promise<void> | void;
  onNavigateToContent?: (topicId: string) => void;
  onCopy?: (topicId: string) => void;
}

// Topic Actions
export interface TopicActionsProps {
  topic: GeneratedTopic;
  onSave?: (topicId: string) => Promise<void> | void;
  onEdit?: (topicId: string, updates: Partial<GeneratedTopic>) => Promise<void>;
  onNavigateToContent?: (topicId: string) => void;
  onCopy?: (topicId: string) => void;
  onDelete?: (topicId: string) => Promise<void>;
  onExport?: (topic: GeneratedTopic, format: "json" | "csv") => Promise<void>;
  showConfirmationDialog?: boolean;
  onToggleConfirmationDialog?: (show: boolean) => void;
  className?: string;
}

// Success Confirmation Dialog
export interface SuccessConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onViewTopics: () => void;
  onGenerateMore: () => void;
  topicCount: number;
}

// Performance Monitor
export interface PerformanceMonitorProps {
  componentName: string;
  children: React.ReactNode;
}

// Error Boundary
export interface TopicBuilderErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  componentName?: string;
}

export interface TopicBuilderErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}
