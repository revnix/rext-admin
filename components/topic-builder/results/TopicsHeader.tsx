"use client";

import {
  ChevronDown,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
} from "lucide-react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import type { TopicsHeaderProps } from "@/types/topic-builder-results";

export const TopicsHeader = memo(function TopicsHeader({
  filteredCount,
  totalCount,
  hasActiveFilters,
  isGeneratingMore = false,
  onRegenerateTopics,
  onBackToWizard,
  selectedTopicIds = [],
  selectedTopics = [],
  isBulkSaving = false,
  onBulkSave,
  onClearSelection: _onClearSelection,
}: TopicsHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Generated Topics
          </h2>
          <p className="text-muted-foreground">
            {filteredCount} of {totalCount} topic{totalCount !== 1 ? "s" : ""}{" "}
            {hasActiveFilters ? "match your filters" : "ready for your content"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="gap-1.5"
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
              <DropdownMenuContent align="end">
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

          {/* Save Selected Topics Button - Show when topics are selected */}
          {selectedTopicIds.length > 0 && onBulkSave && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onBulkSave(selectedTopicIds);
              }}
              disabled={(() => {
                const unsaved = selectedTopics.filter(
                  (topic) => !topic.is_saved && !topic._optimisticSaved,
                );
                return (
                  isBulkSaving ||
                  selectedTopicIds.length === 0 ||
                  unsaved.length === 0
                );
              })()}
              className="gap-1.5"
            >
              {isBulkSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {(() => {
                if (isBulkSaving) return "Saving...";

                const unsaved = selectedTopics.filter(
                  (topic) => !topic.is_saved && !topic._optimisticSaved,
                );

                if (unsaved.length === 0 && selectedTopics.length > 0) {
                  return "Already Saved";
                }

                if (unsaved.length === selectedTopics.length) {
                  return `Save ${selectedTopicIds.length} Topic${selectedTopicIds.length !== 1 ? "s" : ""}`;
                }

                return `Save ${unsaved.length} Topic${unsaved.length !== 1 ? "s" : ""}`;
              })()}
            </Button>
          )}

          <Button
            onClick={onBackToWizard}
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            <RotateCcw className="h-4 w-4" />
            Start Over
          </Button>
        </div>
      </div>

      <Separator />
    </div>
  );
});
