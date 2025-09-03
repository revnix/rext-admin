"use client";

import { BookmarkCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { GeneratedTopic } from "@/types/topic-builder";

interface BulkActionsProps {
  topics: GeneratedTopic[];
  selectedTopicIds: string[];
  onSelectAll: (selected: boolean) => void;
  onBulkSave: (topicIds: string[]) => void;
  className?: string;
}

export function BulkActions({
  topics,
  selectedTopicIds,
  onSelectAll,
  onBulkSave,
  className,
}: BulkActionsProps) {
  const [isBulkSaving, setIsBulkSaving] = useState(false);

  const totalTopics = topics.length;
  const selectedCount = selectedTopicIds.length;
  const allSelected = selectedCount === totalTopics;
  const someSelected = selectedCount > 0 && selectedCount < totalTopics;

  const handleSelectAll = () => {
    onSelectAll(!allSelected);
  };

  const handleBulkSave = async () => {
    if (selectedCount === 0) return;

    setIsBulkSaving(true);
    try {
      await onBulkSave(selectedTopicIds);
    } catch (error) {
      console.error("Bulk save failed:", error);
    } finally {
      setIsBulkSaving(false);
    }
  };

  const getCheckboxState = () => {
    if (allSelected) return true;
    if (someSelected) return "indeterminate";
    return false;
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 bg-muted/20 border rounded-lg backdrop-blur-sm",
        className,
      )}
    >
      {/* Selection Controls */}
      <div className="flex items-center gap-4">
        {/* Select All Checkbox - Single checkbox only */}
        <div className="flex items-center gap-3">
          <Checkbox
            checked={getCheckboxState()}
            onCheckedChange={handleSelectAll}
            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            aria-label="Select all topics"
          />
          <span className="text-sm font-medium">
            {allSelected ? "Deselect All" : "Select All"}
          </span>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Selection Counter */}
        <div className="text-sm text-muted-foreground">
          {selectedCount > 0 ? (
            <span>
              <span className="font-medium text-foreground">
                {selectedCount}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">{totalTopics}</span>{" "}
              topic{totalTopics !== 1 ? "s" : ""} selected
            </span>
          ) : (
            <span>No topics selected</span>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="flex items-center gap-2">
        {selectedCount > 0 && (
          <Button
            onClick={handleBulkSave}
            disabled={isBulkSaving || selectedCount === 0}
            size="sm"
            className="gap-1.5 shadow-sm"
          >
            <BookmarkCheck className="h-4 w-4" />
            {isBulkSaving
              ? `Saving ${selectedCount}...`
              : `Save Selected (${selectedCount})`}
          </Button>
        )}
      </div>
    </div>
  );
}
