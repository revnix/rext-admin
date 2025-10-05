"use client";

import {
  Calendar as CalendarIcon,
  Check,
  Filter,
  Search,
  SlidersHorizontal,
  Tag,
  X,
} from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toDateString } from "@/lib/knowledge/filtering";
import { cn } from "@/lib/utils";
import type {
  KnowledgeFilterState,
  UnifiedKnowledgeStatus,
} from "@/types/knowledge";
import type { KnowledgeType } from "@/types/workspace";
import { DropdownSort } from "./DropdownSort";
import { KNOWLEDGE_TYPE_LABELS, STATUS_LABELS } from "./types";

interface FilterBarProps {
  // Filter state
  searchQuery: string;
  typeFilters: KnowledgeType[];
  statusFilters: UnifiedKnowledgeStatus[];
  tagFilters: string[];
  dateRange: { from: string | null; to: string | null };
  dateValue: DateRange | undefined;
  minWordCount: number | null;
  maxWordCount: number | null;
  sortBy: KnowledgeFilterState["sortBy"];
  sortOrder: KnowledgeFilterState["sortOrder"];

  // Available options
  availableStatuses: UnifiedKnowledgeStatus[];
  availableTags: string[];
  counts: {
    total: number;
    byType: Record<KnowledgeType, number>;
    byStatus: Record<string, number>;
  };

  // Actions
  onSearchChange: (query: string) => void;
  onToggleTypeFilter: (type: KnowledgeType) => void;
  onToggleStatusFilter: (status: UnifiedKnowledgeStatus) => void;
  onAddTagFilter: (tag: string) => void;
  onRemoveTagFilter: (tag: string) => void;
  onDateChange: (range: DateRange | undefined) => void;
  onClearDates: () => void;
  onWordCountChange: (type: "min" | "max", value: string) => void;
  onClearWordCount: () => void;
  onSortChange: (
    sortBy: KnowledgeFilterState["sortBy"],
    sortOrder: KnowledgeFilterState["sortOrder"],
  ) => void;
  onToggleSortOrder: () => void;
  onResetFilters: () => void;

  // UI state
  activeFilters: boolean;
}

/**
 * Comprehensive filter bar with search, type/status/tag filters,
 * date range, word count range, and sorting controls.
 */
export function FilterBar({
  searchQuery,
  typeFilters,
  statusFilters,
  tagFilters,
  dateRange,
  dateValue,
  minWordCount,
  maxWordCount,
  sortBy,
  sortOrder,
  availableStatuses,
  availableTags,
  counts,
  onSearchChange,
  onToggleTypeFilter,
  onToggleStatusFilter,
  onAddTagFilter,
  onRemoveTagFilter,
  onDateChange,
  onClearDates,
  onWordCountChange,
  onClearWordCount,
  onSortChange,
  onToggleSortOrder,
  onResetFilters,
  activeFilters,
}: FilterBarProps) {
  return (
    <div className="grid gap-3 md:grid-cols-[minmax(0,_1fr)_auto] md:items-center">
      {/* Search input */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search title, content, URL, or tags"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filter controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Type filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Type
              {typeFilters.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {typeFilters.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56" align="end">
            <div className="space-y-3">
              <h4 className="font-medium">Knowledge Types</h4>
              <div className="space-y-2">
                {(Object.keys(KNOWLEDGE_TYPE_LABELS) as KnowledgeType[]).map(
                  (type) => {
                    const checkboxId = `knowledge-type-${type}`;
                    return (
                      <div
                        key={type}
                        className="flex items-center justify-between gap-3 rounded-md border p-2"
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={checkboxId}
                            checked={typeFilters.includes(type)}
                            onCheckedChange={() => onToggleTypeFilter(type)}
                          />
                          <Label
                            htmlFor={checkboxId}
                            className="text-sm font-medium"
                          >
                            {KNOWLEDGE_TYPE_LABELS[type]}
                          </Label>
                        </div>
                        <Badge variant="outline">{counts.byType[type]}</Badge>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Status filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Status
              {statusFilters.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {statusFilters.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            <div className="space-y-3">
              <h4 className="font-medium">Processing Status</h4>
              {availableStatuses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No status information available yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {availableStatuses.map((status) => {
                    const statusId = `knowledge-status-${status}`;
                    return (
                      <div
                        key={status}
                        className="flex items-center justify-between gap-3 rounded-md border p-2"
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={statusId}
                            checked={statusFilters.includes(status)}
                            onCheckedChange={() => onToggleStatusFilter(status)}
                          />
                          <Label
                            htmlFor={statusId}
                            className="text-sm font-medium"
                          >
                            {STATUS_LABELS[status]}
                          </Label>
                        </div>
                        <Badge variant="outline">
                          {counts.byStatus[status] || 0}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Tag filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Tag className="h-4 w-4" />
              Tags
              {tagFilters.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {tagFilters.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            <div className="space-y-3">
              <h4 className="font-medium">Filter by tags</h4>
              {availableTags.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Tags will appear once knowledge items include them.
                </p>
              ) : (
                <Command>
                  <CommandInput placeholder="Search tags" />
                  <CommandList>
                    <CommandEmpty>No tags found.</CommandEmpty>
                    <CommandGroup>
                      {availableTags.map((tag) => {
                        const isActive = tagFilters.includes(tag);
                        return (
                          <CommandItem
                            key={tag}
                            value={tag}
                            onSelect={() =>
                              isActive
                                ? onRemoveTagFilter(tag)
                                : onAddTagFilter(tag)
                            }
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                isActive ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {tag}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Date range filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              Dates
              {(dateRange.from || dateRange.to) && (
                <Badge variant="secondary" className="ml-1">
                  <Check className="h-3 w-3" />
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="end">
            <Calendar
              mode="range"
              selected={dateValue}
              onSelect={onDateChange}
              numberOfMonths={2}
            />
            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {dateRange.from ? toDateString(dateRange.from) : "Start"} →{" "}
                {dateRange.to ? toDateString(dateRange.to) : "End"}
              </div>
              <Button variant="ghost" size="sm" onClick={onClearDates}>
                Clear
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Word count filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Word Count
              {(minWordCount !== null || maxWordCount !== null) && (
                <Badge variant="secondary" className="ml-1">
                  <Check className="h-3 w-3" />
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="end">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Word count range</h4>
                <p className="text-sm text-muted-foreground">
                  Filter by estimated word count (falls back to characters when
                  missing).
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label
                    htmlFor="knowledge-min-words"
                    className="text-xs uppercase tracking-wide"
                  >
                    Minimum
                  </Label>
                  <Input
                    id="knowledge-min-words"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={minWordCount ?? ""}
                    onChange={(event) =>
                      onWordCountChange("min", event.target.value)
                    }
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="knowledge-max-words"
                    className="text-xs uppercase tracking-wide"
                  >
                    Maximum
                  </Label>
                  <Input
                    id="knowledge-max-words"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={maxWordCount ?? ""}
                    onChange={(event) =>
                      onWordCountChange("max", event.target.value)
                    }
                    placeholder="Any"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClearWordCount}
                >
                  Clear
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Sort control */}
        <DropdownSort
          sortBy={sortBy}
          sortOrder={sortOrder}
          onChange={onSortChange}
          onToggleDirection={onToggleSortOrder}
        />

        {/* Reset button */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          disabled={!activeFilters}
          onClick={onResetFilters}
        >
          <X className="h-4 w-4" />
          Reset
        </Button>
      </div>
    </div>
  );
}
