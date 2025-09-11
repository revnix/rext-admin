"use client";

import { ArrowLeft, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { lazy, memo, Suspense, useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GeneratedTopic } from "@/types/topic-builder";
import { EmptyStates } from "./EmptyStates";
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
  onBulkSave: _onBulkSave,
  onBackToWizard,
  onRegenerateTopics,
  onNavigateToTopics: _onNavigateToTopics,
  onGenerateNew: _onGenerateNew,
  className,
}: TopicsListProps) {
  const [selectedTopicForDrawer, setSelectedTopicForDrawer] =
    useState<GeneratedTopic | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const router = useRouter();

  // Sort topics by overall score (highest first) - no filters
  const sortedTopics = useMemo(() => {
    return [...topics].sort((a, b) => {
      const aOverall =
        (a.scores.relevance + a.scores.freshness + a.scores.novelty) / 3;
      const bOverall =
        (b.scores.relevance + b.scores.freshness + b.scores.novelty) / 3;
      return bOverall - aOverall;
    });
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

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <TopicsHeader
        filteredCount={sortedTopics.length}
        totalCount={topics.length}
        hasActiveFilters={false}
        onRegenerateTopics={onRegenerateTopics}
        onBackToWizard={onBackToWizard}
      />

      {/* Topics Display */}
      <TopicsGrid
        topics={sortedTopics}
        selectedTopicIds={[]}
        viewMode="grid"
        onTopicSelect={() => {}}
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
