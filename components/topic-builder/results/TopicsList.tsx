"use client";

import { ArrowLeft, FileText, RotateCcw, Sparkles } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { GeneratedTopic } from "@/types/topic-builder";
import { BulkActions } from "./BulkActions";
import { TopicCard } from "./TopicCard";
import { type SortOption, TopicFilters, type ViewMode } from "./TopicFilters";

interface TopicsListProps {
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
  className?: string;
}

export function TopicsList({
  topics,
  onTopicSave,
  onTopicEdit,
  onTopicRegenerate,
  onTopicExport,
  onTopicDelete,
  onBulkSave,
  onBackToWizard,
  onRegenerateTopics,
  className,
}: TopicsListProps) {
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([]);
  const [minScore, setMinScore] = useState(0);

  // Get unique tags and audiences for filtering
  const availableTags = useMemo(() => {
    return Array.from(new Set(topics.flatMap((topic) => topic.tags || [])));
  }, [topics]);

  const availableAudiences = useMemo(() => {
    return Array.from(
      new Set(topics.flatMap((topic) => topic.audience_fit || [])),
    );
  }, [topics]);

  // Filter and sort topics based on selected criteria
  const filteredAndSortedTopics = useMemo(() => {
    let filtered = [...topics];

    // Apply tag filters
    if (selectedTags.length > 0) {
      filtered = filtered.filter((topic) =>
        topic.tags?.some((tag) => selectedTags.includes(tag)),
      );
    }

    // Apply audience filters
    if (selectedAudiences.length > 0) {
      filtered = filtered.filter((topic) =>
        topic.audience_fit?.some((audience) =>
          selectedAudiences.includes(audience),
        ),
      );
    }

    // Apply minimum score filter
    if (minScore > 0) {
      filtered = filtered.filter((topic) => {
        const score =
          sortBy === "overall"
            ? (topic.scores.relevance +
                topic.scores.freshness +
                topic.scores.novelty) /
              3
            : topic.scores[sortBy as keyof typeof topic.scores];
        return score >= minScore;
      });
    }

    // Sort filtered topics
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "relevance":
          return b.scores.relevance - a.scores.relevance;
        case "freshness":
          return b.scores.freshness - a.scores.freshness;
        case "novelty":
          return b.scores.novelty - a.scores.novelty;
        case "overall": {
          const aOverall =
            (a.scores.relevance + a.scores.freshness + a.scores.novelty) / 3;
          const bOverall =
            (b.scores.relevance + b.scores.freshness + b.scores.novelty) / 3;
          return bOverall - aOverall;
        }
        default:
          return 0;
      }
    });
  }, [topics, selectedTags, selectedAudiences, minScore, sortBy]);

  const handleTopicSelect = useCallback(
    (topicId: string, selected: boolean) => {
      setSelectedTopicIds((prev) =>
        selected ? [...prev, topicId] : prev.filter((id) => id !== topicId),
      );
    },
    [],
  );

  const hasActiveFilters =
    selectedTags.length > 0 || selectedAudiences.length > 0 || minScore > 0;

  const handleClearFilters = useCallback(() => {
    setSelectedTags([]);
    setSelectedAudiences([]);
    setMinScore(0);
  }, []);

  const handleSelectAll = useCallback(
    (selected: boolean) => {
      setSelectedTopicIds(
        selected ? filteredAndSortedTopics.map((topic) => topic.id) : [],
      );
    },
    [filteredAndSortedTopics],
  );

  const handleTopicSave = useCallback(
    (topicId: string) => {
      try {
        onTopicSave(topicId);
        console.log(`Topic ${topicId} saved successfully`);
      } catch (error) {
        console.error(`Failed to save topic ${topicId}:`, error);
        throw error;
      }
    },
    [onTopicSave],
  );

  const handleBulkSave = useCallback(
    (topicIds: string[]) => {
      try {
        onBulkSave(topicIds);
        console.log(`Bulk saved ${topicIds.length} topics`);
        // Clear selection after successful save
        setSelectedTopicIds([]);
      } catch (error) {
        console.error("Bulk save failed:", error);
        throw error;
      }
    },
    [onBulkSave],
  );

  // Empty state - no topics generated
  if (topics.length === 0) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Topics Generated</h3>
          <p className="text-muted-foreground mb-4">
            Something went wrong during topic generation.
          </p>
          <Button onClick={onBackToWizard} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Topic Builder
          </Button>
        </div>
      </div>
    );
  }

  // Filtered empty state - topics exist but none match filters
  if (topics.length > 0 && filteredAndSortedTopics.length === 0) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Generated Topics
              </h2>
              <p className="text-muted-foreground">
                {topics.length} topic{topics.length !== 1 ? "s" : ""} generated,
                0 match your filters
              </p>
            </div>
          </div>

          <Separator />

          <TopicFilters
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            availableTags={availableTags}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            availableAudiences={availableAudiences}
            selectedAudiences={selectedAudiences}
            onAudiencesChange={setSelectedAudiences}
            minScore={minScore}
            onMinScoreChange={setMinScore}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
          />
        </div>

        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">
            No Topics Match Your Filters
          </h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your filter criteria to see more topics.
          </p>
          <Button onClick={handleClearFilters} variant="outline">
            Clear All Filters
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Generated Topics
            </h2>
            <p className="text-muted-foreground">
              {filteredAndSortedTopics.length} of {topics.length} topic
              {topics.length !== 1 ? "s" : ""}{" "}
              {hasActiveFilters
                ? "match your filters"
                : "ready for your content"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={onRegenerateTopics}
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <RotateCcw className="h-4 w-4" />
              Regenerate
            </Button>
            <Button
              onClick={onBackToWizard}
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Edit Settings
            </Button>
          </div>
        </div>

        <Separator />

        {/* Filter Controls */}
        <TopicFilters
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          availableTags={availableTags}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
          availableAudiences={availableAudiences}
          selectedAudiences={selectedAudiences}
          onAudiencesChange={setSelectedAudiences}
          minScore={minScore}
          onMinScoreChange={setMinScore}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />

        {/* Bulk Actions */}
        <BulkActions
          topics={filteredAndSortedTopics}
          selectedTopicIds={selectedTopicIds}
          onSelectAll={handleSelectAll}
          onBulkSave={handleBulkSave}
        />
      </div>

      {/* Topics Display */}
      <div
        className={cn(
          "gap-4",
          viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            : "flex flex-col space-y-4",
        )}
      >
        {filteredAndSortedTopics.map((topic) => (
          <TopicCard
            key={topic.id}
            topic={topic}
            isSelected={selectedTopicIds.includes(topic.id)}
            onSelect={handleTopicSelect}
            onSave={handleTopicSave}
            onEdit={onTopicEdit}
            onRegenerate={onTopicRegenerate}
            onExport={onTopicExport}
            onDelete={onTopicDelete}
            className={viewMode === "list" ? "max-w-none" : undefined}
          />
        ))}
      </div>

      {/* Footer Actions */}
      <div className="pt-6 border-t">
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={onRegenerateTopics}
            variant="outline"
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Generate More Topics
          </Button>
          <Button onClick={onBackToWizard} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Topic Builder
          </Button>
        </div>
      </div>
    </div>
  );
}
