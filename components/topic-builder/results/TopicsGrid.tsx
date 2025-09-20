"use client";

import { memo } from "react";
import type { TopicsGridProps } from "@/types/topic-builder-results";
import { TopicsTable } from "./TopicsTable";

export const TopicsGrid = memo(function TopicsGrid({
  topics,
  selectedTopicIds,
  viewMode,
  newlyAddedTopicIds = [],
  onTopicSelect,
  onTopicSave,
  onNavigateToContent,
  onViewDetails,
  onCopyTopic,
}: TopicsGridProps) {
  if (topics.length === 0) {
    return null;
  }

  // Always use table format now instead of grid/list cards
  return (
    <TopicsTable
      topics={topics}
      selectedTopicIds={selectedTopicIds}
      newlyAddedTopicIds={newlyAddedTopicIds}
      onTopicSelect={onTopicSelect}
      onTopicSave={onTopicSave}
      onNavigateToContent={onNavigateToContent}
      onViewDetails={onViewDetails}
      onCopyTopic={onCopyTopic}
    />
  );
});
