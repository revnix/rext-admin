"use client";

import { ArrowLeft, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  lazy,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useBulkTopicSaveMutation } from "@/hooks/useTopicMutations";
import { cn } from "@/lib/utils";
import type { GeneratedTopic } from "@/types/topic-builder";
import type { SortOption, ViewMode } from "@/types/topic-builder-results";
import { BulkActions } from "./BulkActions";
import { EmptyStates } from "./EmptyStates";
import { TopicFilters } from "./TopicFilters";
import { TopicsGrid } from "./TopicsGrid";
import { TopicsHeader } from "./TopicsHeader";

// Lazy load TopicDetailDrawer for better performance
const TopicDetailDrawer = lazy(() =>
  import("./TopicDetailDrawer").then((module) => ({
    default: module.TopicDetailDrawer,
  })),
);

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
  onNavigateToTopics?: () => void;
  onGenerateNew?: () => void;
  className?: string;
}

export const TopicsList = memo(function TopicsList({
  topics,
  onTopicSave,
  onTopicEdit: _onTopicEdit,
  onTopicRegenerate: _onTopicRegenerate,
  onTopicExport: _onTopicExport,
  onTopicDelete: _onTopicDelete,
  onBulkSave,
  onBackToWizard,
  onRegenerateTopics,
  onNavigateToTopics: _onNavigateToTopics,
  onGenerateNew: _onGenerateNew,
  className,
}: TopicsListProps) {
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([]);
  const [minScore, setMinScore] = useState(0);
  const [selectedTopicForDrawer, setSelectedTopicForDrawer] =
    useState<GeneratedTopic | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const bulkSaveMutation = useBulkTopicSaveMutation();
  const router = useRouter();

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
      if (selected) {
        // When selecting all, only select currently visible topics
        setSelectedTopicIds(filteredAndSortedTopics.map((topic) => topic.id));
      } else {
        // When deselecting all, clear all selections (including hidden ones)
        setSelectedTopicIds([]);
      }
    },
    [filteredAndSortedTopics],
  );

  // Clean up selection when topics are no longer available
  useEffect(() => {
    const availableTopicIds = new Set(topics.map((topic) => topic.id));
    setSelectedTopicIds((prev) =>
      prev.filter((id) => availableTopicIds.has(id)),
    );
  }, [topics]);

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
    async (topicIds: string[]) => {
      const topicsToSave = topics.filter((topic) =>
        topicIds.includes(topic.id),
      );

      try {
        await bulkSaveMutation.mutateAsync(topicsToSave);
        toast.success(`Successfully saved ${topicsToSave.length} topics`);
        // Clear selection after successful save
        setSelectedTopicIds([]);
        // Also call the parent callback for any additional handling
        onBulkSave(topicIds);
      } catch (error) {
        console.error("Bulk save failed:", error);
        toast.error(
          `Failed to save topics: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        throw error;
      }
    },
    [topics, bulkSaveMutation, onBulkSave],
  );

  const handleBulkExport = useCallback(
    async (topics: GeneratedTopic[], format: "json" | "csv") => {
      if (!_onTopicExport) return;

      try {
        await _onTopicExport(topics, format);
        console.log(
          `Bulk exported ${topics.length} topics as ${format.toUpperCase()}`,
        );
      } catch (error) {
        console.error(`Bulk export (${format}) failed:`, error);
        throw error;
      }
    },
    [_onTopicExport],
  );

  const handleBulkDelete = useCallback(
    async (topicIds: string[]) => {
      if (!_onTopicDelete) return;

      try {
        // Delete each topic individually since onTopicDelete expects single IDs
        for (const topicId of topicIds) {
          await _onTopicDelete(topicId);
        }
        console.log(`Bulk deleted ${topicIds.length} topics`);
        // Clear selection after successful delete
        setSelectedTopicIds([]);
      } catch (error) {
        console.error("Bulk delete failed:", error);
        throw error;
      }
    },
    [_onTopicDelete],
  );

  const handleNavigateToContent = useCallback(
    (topicId: string) => {
      try {
        console.log(`Navigating to content creation for topic ${topicId}`);
        router.push(`/flows/create?topicId=${topicId}`);
        toast.success("Navigating to content creation...");
      } catch (error) {
        console.error(
          `Failed to navigate to content creation for topic ${topicId}:`,
          error,
        );
        toast.error("Failed to navigate to content creation");
      }
    },
    [router],
  );

  const handleBulkNavigateToContent = useCallback(
    (topicIds: string[]) => {
      try {
        console.log(
          `Navigating to content creation for ${topicIds.length} topics`,
        );
        const queryParam =
          topicIds.length === 1
            ? `topicId=${topicIds[0]}`
            : `topicIds=${topicIds.join(",")}`;
        router.push(`/flows/create?${queryParam}`);
        toast.success(
          `Navigating to content creation for ${topicIds.length} topics...`,
        );
      } catch (error) {
        console.error(
          `Failed to navigate to content creation for topics:`,
          error,
        );
        toast.error("Failed to navigate to content creation");
      }
    },
    [router],
  );

  const handleViewDetails = useCallback(
    (topicId: string) => {
      const topic = topics.find((t) => t.id === topicId);
      if (topic) {
        setSelectedTopicForDrawer(topic);
        setIsDrawerOpen(true);
      }
    },
    [topics],
  );

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setSelectedTopicForDrawer(null);
  }, []);

  const handleCopyTopic = useCallback(
    async (topicId: string) => {
      const topic = topics.find((t) => t.id === topicId);
      if (topic) {
        await navigator.clipboard.writeText(
          `${topic.title}\n${topic.description || topic.angle}`,
        );
        toast.success("Topic copied to clipboard");
      }
    },
    [topics],
  );

  // Empty state - no topics generated
  if (topics.length === 0) {
    return (
      <div className={cn("space-y-6", className)}>
        <EmptyStates variant="no-topics" onBackToWizard={onBackToWizard} />
      </div>
    );
  }

  // Filtered empty state - topics exist but none match filters
  if (topics.length > 0 && filteredAndSortedTopics.length === 0) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="space-y-4">
          <TopicsHeader
            filteredCount={0}
            totalCount={topics.length}
            hasActiveFilters={hasActiveFilters}
            onRegenerateTopics={onRegenerateTopics}
            onBackToWizard={onBackToWizard}
          />

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

        <EmptyStates
          variant="no-matches"
          totalTopics={topics.length}
          onBackToWizard={onBackToWizard}
          onClearFilters={handleClearFilters}
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-4">
        <TopicsHeader
          filteredCount={filteredAndSortedTopics.length}
          totalCount={topics.length}
          hasActiveFilters={hasActiveFilters}
          onRegenerateTopics={onRegenerateTopics}
          onBackToWizard={onBackToWizard}
        />

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
          onBulkExport={_onTopicExport ? handleBulkExport : undefined}
          onBulkDelete={_onTopicDelete ? handleBulkDelete : undefined}
          onBulkNavigateToContent={handleBulkNavigateToContent}
        />
      </div>

      {/* Topics Display */}
      <TopicsGrid
        topics={filteredAndSortedTopics}
        selectedTopicIds={selectedTopicIds}
        viewMode={viewMode}
        onTopicSelect={handleTopicSelect}
        onTopicSave={handleTopicSave}
        onNavigateToContent={handleNavigateToContent}
        onViewDetails={handleViewDetails}
        onCopyTopic={handleCopyTopic}
      />

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

      {/* Topic Detail Drawer */}
      <Suspense
        fallback={
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            Loading...
          </div>
        }
      >
        <TopicDetailDrawer
          topic={selectedTopicForDrawer}
          isOpen={isDrawerOpen}
          onClose={handleCloseDrawer}
          onSave={handleTopicSave}
          onNavigateToContent={handleNavigateToContent}
          onCopy={handleCopyTopic}
        />
      </Suspense>
    </div>
  );
});
