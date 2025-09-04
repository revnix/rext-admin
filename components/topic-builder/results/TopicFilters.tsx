"use client";

import { Filter, LayoutGrid, LayoutList, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export type ViewMode = "grid" | "list";
export type SortOption = "relevance" | "freshness" | "novelty" | "overall";

interface TopicFiltersProps {
  // Sorting
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;

  // View mode
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;

  // Tag filtering
  availableTags: string[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;

  // Audience filtering
  availableAudiences?: string[];
  selectedAudiences?: string[];
  onAudiencesChange?: (audiences: string[]) => void;

  // Score filtering
  minScore?: number;
  onMinScoreChange?: (score: number) => void;

  // Filter state
  hasActiveFilters: boolean;
  onClearFilters: () => void;

  className?: string;
}

export function TopicFilters({
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  availableTags,
  selectedTags,
  onTagsChange,
  availableAudiences = [],
  selectedAudiences = [],
  onAudiencesChange,
  minScore = 0,
  onMinScoreChange,
  hasActiveFilters,
  onClearFilters,
  className,
}: TopicFiltersProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const tagOptions = availableTags.map((tag) => ({
    label: tag,
    value: tag,
  }));

  const audienceOptions = availableAudiences.map((audience) => ({
    label: audience,
    value: audience,
  }));

  const handleTagChange = (values: string[]) => {
    onTagsChange(values);
  };

  const handleAudienceChange = (values: string[]) => {
    onAudiencesChange?.(values);
  };

  const activeFilterCount =
    selectedTags.length + selectedAudiences.length + (minScore > 0 ? 1 : 0);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Controls Row */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Sort and View Controls */}
        <div className="flex items-center gap-3">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Sort:
            </span>
            <Select
              value={sortBy}
              onValueChange={(value) => onSortChange(value as SortOption)}
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
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("grid")}
              className="h-8 px-3 rounded-r-none border-0"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("list")}
              className="h-8 px-3 rounded-l-none border-0"
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Right: Filter Controls */}
        <div className="flex items-center gap-2">
          {/* Active Filters Indicator */}
          {hasActiveFilters && (
            <>
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""}{" "}
                active
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Filter Popover */}
          <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={hasActiveFilters ? "default" : "outline"}
                size="sm"
                className="gap-1.5"
              >
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 text-xs h-5 px-1.5"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filter Topics</h4>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onClearFilters();
                        setIsFiltersOpen(false);
                      }}
                      className="h-8 px-2 text-muted-foreground"
                    >
                      Clear All
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Tag Filters */}
                {availableTags.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Tags</div>
                    <MultiSelect
                      options={tagOptions}
                      selected={selectedTags}
                      onChange={handleTagChange}
                      placeholder="Select tags to filter by..."
                    />
                  </div>
                )}

                {/* Audience Filters */}
                {availableAudiences.length > 0 && onAudiencesChange && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Audience</div>
                    <MultiSelect
                      options={audienceOptions}
                      selected={selectedAudiences}
                      onChange={handleAudienceChange}
                      placeholder="Select audiences to filter by..."
                    />
                  </div>
                )}

                {/* Score Filter */}
                {onMinScoreChange && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="score-slider"
                        className="text-sm font-medium"
                      >
                        Minimum{" "}
                        {sortBy === "overall"
                          ? "Overall"
                          : sortBy.charAt(0).toUpperCase() +
                            sortBy.slice(1)}{" "}
                        Score
                      </label>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(minScore * 100)}%
                      </span>
                    </div>
                    <div className="px-2">
                      <input
                        id="score-slider"
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={minScore}
                        onChange={(e) =>
                          onMinScoreChange(parseFloat(e.target.value))
                        }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Advanced Filter Controls - Collapsible */}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-start p-0 h-auto">
            <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <Filter className="h-4 w-4" />
              Advanced Filters
            </div>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
            {/* Quick Tag Filters */}
            {availableTags.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Quick Tag Filters</div>
                <div className="flex flex-wrap gap-1">
                  {availableTags.slice(0, 8).map((tag) => (
                    <Badge
                      key={tag}
                      variant={
                        selectedTags.includes(tag) ? "default" : "outline"
                      }
                      className="cursor-pointer hover:bg-accent text-xs"
                      onClick={() => {
                        if (selectedTags.includes(tag)) {
                          onTagsChange(selectedTags.filter((t) => t !== tag));
                        } else {
                          onTagsChange([...selectedTags, tag]);
                        }
                      }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Score Breakdown */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Score Filters</div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">
                    Relevance
                  </div>
                  <div className="h-2 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${minScore * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">
                    Freshness
                  </div>
                  <div className="h-2 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${minScore * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">
                    Novelty
                  </div>
                  <div className="h-2 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-purple-500 transition-all duration-300"
                      style={{ width: `${minScore * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
