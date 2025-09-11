"use client";

import { ArrowLeft, FileText } from "lucide-react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import type { EmptyStatesProps } from "@/types/topic-builder-results";

export const EmptyStates = memo(function EmptyStates({
  variant,
  totalTopics: _totalTopics = 0,
  onBackToWizard,
  onClearFilters,
}: EmptyStatesProps) {
  if (variant === "no-topics") {
    return (
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
    );
  }

  if (variant === "no-matches") {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">
          No Topics Match Your Filters
        </h3>
        <p className="text-muted-foreground mb-4">
          Try adjusting your filter criteria to see more topics.
        </p>
        {onClearFilters && (
          <Button onClick={onClearFilters} variant="outline">
            Clear All Filters
          </Button>
        )}
      </div>
    );
  }

  return null;
});
