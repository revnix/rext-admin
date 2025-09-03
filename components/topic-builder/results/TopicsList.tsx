"use client";

import {
  ArrowLeft,
  FileText,
  Grid3X3,
  List,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { GeneratedTopic } from "@/types/topic-builder";
import { BulkActions } from "./BulkActions";
import { TopicCard } from "./TopicCard";

interface TopicsListProps {
  topics: GeneratedTopic[];
  onTopicSave: (topicId: string) => void;
  onBulkSave: (topicIds: string[]) => void;
  onBackToWizard: () => void;
  onRegenerateTopics: () => void;
  className?: string;
}

type SortOption = "relevance" | "freshness" | "novelty" | "overall";
type ViewMode = "grid" | "list";

export function TopicsList({
  topics,
  onTopicSave,
  onBulkSave,
  onBackToWizard,
  onRegenerateTopics,
  className,
}: TopicsListProps) {
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Sort topics based on selected criteria
  const sortedTopics = [...topics].sort((a, b) => {
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

  const handleTopicSelect = useCallback(
    (topicId: string, selected: boolean) => {
      setSelectedTopicIds((prev) =>
        selected ? [...prev, topicId] : prev.filter((id) => id !== topicId),
      );
    },
    [],
  );

  const handleSelectAll = useCallback(
    (selected: boolean) => {
      setSelectedTopicIds(selected ? topics.map((topic) => topic.id) : []);
    },
    [topics],
  );

  const handleTopicSave = useCallback(
    async (topicId: string) => {
      try {
        await onTopicSave(topicId);
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
      try {
        await onBulkSave(topicIds);
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

  // Empty state
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
              {topics.length} personalized topic{topics.length !== 1 ? "s" : ""}{" "}
              ready for your content
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

        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Sort Controls */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Sort by:
              </span>
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as SortOption)}
              >
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="freshness">Freshness</SelectItem>
                  <SelectItem value="novelty">Novelty</SelectItem>
                  <SelectItem value="overall">Overall Score</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-8 w-8 p-0"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        <BulkActions
          topics={topics}
          selectedTopicIds={selectedTopicIds}
          onSelectAll={handleSelectAll}
          onBulkSave={handleBulkSave}
        />
      </div>

      {/* Topics Grid */}
      <div
        className={cn(
          "gap-4",
          viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            : "space-y-4",
        )}
      >
        {sortedTopics.map((topic) => (
          <TopicCard
            key={topic.id}
            topic={topic}
            isSelected={selectedTopicIds.includes(topic.id)}
            onSelect={handleTopicSelect}
            onSave={handleTopicSave}
            className={cn(viewMode === "list" && "max-w-none")}
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
