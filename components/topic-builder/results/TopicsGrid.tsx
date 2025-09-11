"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import type { TopicsGridProps } from "@/types/topic-builder-results";
import { TopicCard } from "./TopicCard";

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

  return (
    <div
      className={cn(
        "gap-4",
        viewMode === "grid"
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          : "flex flex-col space-y-4",
      )}
    >
      {topics.map((topic) => (
        <TopicCard
          key={topic.id}
          topic={topic}
          isSelected={selectedTopicIds.includes(topic.id)}
          isHighlighted={newlyAddedTopicIds.includes(topic.id)}
          onSelect={onTopicSelect}
          onSave={onTopicSave}
          onNavigateToContent={onNavigateToContent}
          onViewDetails={onViewDetails}
          onCopy={onCopyTopic}
          className={viewMode === "list" ? "max-w-none" : undefined}
        />
      ))}
    </div>
  );
});
