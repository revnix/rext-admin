"use client";

import { BookmarkCheck, CheckSquare, Square } from "lucide-react";
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
        "flex items-center justify-between p-4 bg-muted/30 border rounded-lg",
        className,
      )}
    >
      {/* Selection Controls */}
      <div className="flex items-center gap-4">
        {/* Select All Checkbox */}
        <div className="flex items-center gap-2">
          <Checkbox
            checked={getCheckboxState()}
            onCheckedChange={handleSelectAll}
            aria-label="Select all topics"
          />
          <div className="flex items-center gap-1.5">
            {someSelected ? (
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            ) : allSelected ? (
              <CheckSquare className="h-4 w-4 text-primary" />
            ) : (
              <Square className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">
              {allSelected ? "Deselect All" : "Select All"}
            </span>
          </div>
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
              topics selected
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
            className="gap-1.5"
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
