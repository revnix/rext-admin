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
import { log } from "@/lib/logger";
import { workspaceRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useCurrentWorkspace } from "@/stores/workspace";
import type { GeneratedTopic } from "@/types/topic-builder";
import { EmptyStates } from "./EmptyStates";
import { TopicsHeader } from "./TopicsHeader";
import { TopicsTable } from "./TopicsTable";
import type { Route } from "next";

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
  onTopicSave: (
    topicId: string,
  ) => Promise<{ success: boolean; message?: string }>;
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
  bulkSaveResult?: { successIds: string[]; failedIds: string[] } | null;
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
  isBulkSaving,
  bulkSaveResult,
  className,
}: TopicsListProps) {
  const [selectedTopicForDrawer, setSelectedTopicForDrawer] =
    useState<GeneratedTopic | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [savingTopicIds, setSavingTopicIds] = useState<string[]>([]);

  const router = useRouter();
  const currentWorkspace = useCurrentWorkspace();

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

  // Sort topics by creation date (newest first) - newly generated appear on top
  const sortedTopics = useMemo(() => {
    return [...topics].sort((a, b) => {
      // First, prioritize newly added topics (they appear at the top)
      const aIsNew = newlyAddedTopicIds.includes(a.id);
      const bIsNew = newlyAddedTopicIds.includes(b.id);

      if (aIsNew && !bIsNew) return -1;
      if (!aIsNew && bIsNew) return 1;

      // Then sort by creation date (newest first)
      const aDate = a.created_at
        ? new Date(a.created_at).getTime()
        : Date.now();
      const bDate = b.created_at
        ? new Date(b.created_at).getTime()
        : Date.now();

      return bDate - aDate;
    });
  }, [topics, newlyAddedTopicIds]);

  const handleTopicSave = useCallback(
    async (
      topicId: string,
    ): Promise<{ success: boolean; message?: string }> => {
      setSavingTopicIds((prev) => [...prev, topicId]);
      try {
        const result = await onTopicSave(topicId);
        return result; // Return result for error handling in topics table
      } catch (error) {
        log.error(`Failed to save topic ${topicId}:`, error);
        throw error; // rethrow so handleOptimisticSave catches it
      } finally {
        setSavingTopicIds((prev) => prev.filter((id) => id !== topicId));
      }
    },
    [onTopicSave],
  );

  const handleNavigateToContent = useCallback(
    (topicId: string) => {
      try {
        const workspaceSlug = currentWorkspace?.slug;
        if (!workspaceSlug) {
          throw new Error("No workspace selected");
        }
        router.push(
          `${workspaceRoutes.contentCreate(workspaceSlug)}?topicId=${topicId}` as Route,
        );
        toast.success("Navigating to content creation...");
      } catch (error) {
        log.error(
          `Failed to navigate to content creation for topic ${topicId}:`,
          error,
        );
        toast.error("Failed to navigate to content creation");
      }
    },
    [router, currentWorkspace],
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

  // Deduplicate and only count unsaved topics for header/actions
  const uniqueSelectedTopicIds = Array.from(new Set(selectedTopicIds));
  const selectedTopics = sortedTopics.filter((topic) =>
    uniqueSelectedTopicIds.includes(topic.id),
  );
  const selectedUniqueUnsavedTopics = selectedTopics.filter(
    (topic) => !topic.is_saved && !topic._optimisticSaved,
  );

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
        selectedTopicIds={uniqueSelectedTopicIds}
        selectedTopics={selectedTopics}
        selectedUniqueUnsavedTopics={selectedUniqueUnsavedTopics}
        isBulkSaving={isBulkSaving}
        onBulkSave={(topicIds: string[]) => {
          // Only save unique, unsaved topics
          const topicIdsToSave = Array.from(
            new Set(
              topicIds.filter((id) => {
                const t = sortedTopics.find((ti) => ti.id === id);
                return t && !t.is_saved && !t._optimisticSaved;
              }),
            ),
          );

          _onBulkSave(topicIdsToSave);
          // Optionally clear selection after save
        }}
        onClearSelection={() => setSelectedTopicIds([])}
      />

      {/* Topics Display */}
      <TopicsTable
        topics={sortedTopics}
        selectedTopicIds={uniqueSelectedTopicIds}
        newlyAddedTopicIds={newlyAddedTopicIds}
        onTopicSelect={handleTopicSelect}
        onTopicSave={handleTopicSave}
        onNavigateToContent={handleNavigateToContent}
        onViewDetails={handleViewDetails}
        onCopyTopic={handleCopyTopic}
        savingTopicIds={savingTopicIds}
        isBulkSaving={isBulkSaving}
        bulkSaveResult={bulkSaveResult}
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
