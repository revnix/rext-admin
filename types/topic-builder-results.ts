/**
 * Topic Builder Results Component Types
 * Types for topic results, cards, actions, and related components
 */

import type { GeneratedTopic } from "./topic-builder";

// View and Sort Options
export type ViewMode = "grid" | "list";
export type SortOption = "relevance" | "freshness" | "novelty" | "overall";

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
  onRegenerateTopics: () => void;
  onNavigateToTopics?: () => void;
  onGenerateNew?: () => void;
  className?: string;
}

// Topic Card
export interface TopicCardProps {
  topic: GeneratedTopic;
  onSelect?: (id: string, selected: boolean) => void;
  isSelected?: boolean;
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
  onRegenerateTopics: () => void;
  onBackToWizard: () => void;
}

// Topics Grid
export interface TopicsGridProps {
  topics: GeneratedTopic[];
  selectedTopicIds: string[];
  viewMode: ViewMode;
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

// Topic Filters
export interface TopicFiltersProps {
  sortBy: SortOption;
  onSortChange: (sortBy: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (viewMode: ViewMode) => void;
  availableTags: string[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  availableAudiences: string[];
  selectedAudiences: string[];
  onAudiencesChange?: (audiences: string[]) => void;
  minScore: number;
  onMinScoreChange: (score: number) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  className?: string;
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

// Bulk Actions
export interface BulkActionsProps {
  topics: GeneratedTopic[];
  selectedTopicIds: string[];
  onSelectAll: (selected: boolean) => void;
  onBulkSave: (topicIds: string[]) => Promise<void>;
  onBulkExport?: (
    topics: GeneratedTopic[],
    format: "json" | "csv",
  ) => Promise<void>;
  onBulkDelete?: (topicIds: string[]) => Promise<void>;
  onBulkNavigateToContent: (topicIds: string[]) => void;
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
