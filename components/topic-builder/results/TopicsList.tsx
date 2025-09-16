"use client";

import { ChevronDown, Loader2, Plus, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { lazy, memo, Suspense, useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  isGeneratingMore?: boolean;
  newlyAddedTopicIds?: string[];
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
  onGenerateNew?: (count: number) => void;
  isBulkSaving?: boolean;
  className?: string;
}

export const TopicsList = memo(function TopicsList({
  topics,
  isGeneratingMore = false,
  newlyAddedTopicIds = [],
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
  isBulkSaving = false,
  className,
}: TopicsListProps) {
  const [selectedTopicForDrawer, setSelectedTopicForDrawer] =
    useState<GeneratedTopic | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);

  const router = useRouter();

  // Handler for topic selection
  const handleTopicSelect = useCallback(
    (topicId: string, isSelected: boolean) => {
      setSelectedTopicIds((prev) => {
        if (isSelected) {
          return [...prev, topicId];
        } else {
          return prev.filter((id) => id !== topicId);
        }
      });
    },
    [],
  );

  // Sort topics by overall score (highest first) - no filters
  const sortedTopics = useMemo(() => {
    return [...topics].sort((a, b) => {
      const aOverall =
        (a.scores.relevance + a.scores.trend_level + a.scores.uniqueness) / 3;
      const bOverall =
        (b.scores.relevance + b.scores.trend_level + b.scores.uniqueness) / 3;
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
        isGeneratingMore={isGeneratingMore}
        onRegenerateTopics={onRegenerateTopics}
        onBackToWizard={onBackToWizard}
        selectedTopicIds={selectedTopicIds}
        selectedTopics={sortedTopics.filter((topic) =>
          selectedTopicIds.includes(topic.id),
        )}
        isBulkSaving={isBulkSaving}
        onBulkSave={(topicIds: string[]) => {
          const selectedTopics = sortedTopics.filter((topic) =>
            topicIds.includes(topic.id),
          );
          const unsaved = selectedTopics.filter(
            (topic) => !topic.is_saved && !topic._optimisticSaved,
          );

          console.log("Bulk saving topics:", {
            requested: topicIds,
            totalSelected: selectedTopics.length,
            unsaved: unsaved.length,
          });

          _onBulkSave(topicIds);

          if (unsaved.length > 0) {
            toast.success(
              `Saving ${unsaved.length} topic${unsaved.length !== 1 ? "s" : ""} to your library`,
            );
          }

          // Clear selection after save
          setSelectedTopicIds([]);
        }}
        onClearSelection={() => setSelectedTopicIds([])}
      />

      {/* Topics Display */}
      <TopicsGrid
        topics={sortedTopics}
        selectedTopicIds={selectedTopicIds}
        viewMode="grid"
        newlyAddedTopicIds={newlyAddedTopicIds}
        onTopicSelect={handleTopicSelect}
        onTopicSave={handleTopicSave}
        onNavigateToContent={handleNavigateToContent}
        onViewDetails={handleViewDetails}
        onCopyTopic={handleCopyTopic}
      />

      {/* Footer Actions */}
      <div className="pt-6 border-t">
        <div className="flex items-center justify-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                className="gap-2"
                disabled={isGeneratingMore}
              >
                {isGeneratingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {isGeneratingMore ? "Generating..." : "Generate More"}
                {!isGeneratingMore && <ChevronDown className="h-3 w-3" />}
              </Button>
            </DropdownMenuTrigger>
            {!isGeneratingMore && (
              <DropdownMenuContent align="center">
                <DropdownMenuItem onClick={() => onRegenerateTopics(5)}>
                  Generate 5 more topics
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRegenerateTopics(10)}>
                  Generate 10 more topics
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRegenerateTopics(15)}>
                  Generate 15 more topics
                </DropdownMenuItem>
              </DropdownMenuContent>
            )}
          </DropdownMenu>
          <Button onClick={onBackToWizard} variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Start Over
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
