"use client";

import { Check, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { KnowledgeFilterState } from "@/types/knowledge";

interface DropdownSortProps {
  sortBy: KnowledgeFilterState["sortBy"];
  sortOrder: KnowledgeFilterState["sortOrder"];
  onChange: (
    sortBy: KnowledgeFilterState["sortBy"],
    sortOrder: KnowledgeFilterState["sortOrder"],
  ) => void;
  onToggleDirection: () => void;
}

/**
 * Sort dropdown for selecting sort field and direction.
 * Displays available sort options and current selection.
 */
export function DropdownSort({
  sortBy,
  sortOrder,
  onChange,
  onToggleDirection,
}: DropdownSortProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4 rotate-90" />
          Sort
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48" align="end">
        <div className="space-y-3">
          <div>
            <h4 className="font-medium">Sort order</h4>
            <p className="text-xs text-muted-foreground">
              Choose the attribute to sort by and toggle direction.
            </p>
          </div>
          <div className="space-y-2">
            {(
              [
                { value: "created_at", label: "Created date" },
                { value: "updated_at", label: "Updated date" },
                { value: "title", label: "Title" },
                { value: "type", label: "Knowledge type" },
                { value: "status", label: "Status" },
                { value: "word_count", label: "Word count" },
              ] as Array<{
                value: KnowledgeFilterState["sortBy"];
                label: string;
              }>
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "flex w-full items-center justify-between rounded-md border p-2 text-sm",
                  sortBy === option.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:bg-muted",
                )}
                onClick={() => onChange(option.value, sortOrder)}
              >
                <span>{option.label}</span>
                {sortBy === option.value && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
          <Separator />
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleDirection}
            className="w-full"
          >
            {sortOrder === "asc" ? "Ascending" : "Descending"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
