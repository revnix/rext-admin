"use client";

import { ArrowLeft, RotateCcw, Sparkles } from "lucide-react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { TopicsHeaderProps } from "@/types/topic-builder-results";

export const TopicsHeader = memo(function TopicsHeader({
  filteredCount,
  totalCount,
  hasActiveFilters,
  onRegenerateTopics,
  onBackToWizard,
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
    </div>
  );
});
