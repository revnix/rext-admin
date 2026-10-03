"use client";

import {
  Calendar,
  ChevronDown,
  Clock,
  FileText,
  Filter,
  Globe,
  Loader2,
  Search,
  Tag,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useGlobalKnowledgeSearchStore } from "@/stores/knowledge";
import type { KnowledgeType } from "@/types/workspace";
import type { Route } from "next";

interface GlobalKnowledgeSearchProps {
  workspaceId: string;
}

// Icon mapping for knowledge types
const getKnowledgeTypeIcon = (type: KnowledgeType) => {
  switch (type) {
    case "web":
      return <Globe className="h-4 w-4 text-foreground" />;
    case "file":
      return <Upload className="h-4 w-4 text-foreground" />;
    case "text":
      return <FileText className="h-4 w-4 text-foreground" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

// Format date for display
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Highlight search terms in content
const highlightSearchTerms = (text: string, searchQuery: string) => {
  if (!searchQuery.trim()) return text;

  const regex = new RegExp(
    `(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  const parts = text.split(regex);

  return parts.map((part) =>
    regex.test(part) ? (
      <mark
        key={`highlight-${part}-${part.slice(0, 10)}`}
        className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded-md"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
};

const SEARCH_SKELETON_KEYS = [
  "search-skeleton-1",
  "search-skeleton-2",
  "search-skeleton-3",
] as const;

// Loading skeleton for search results
function SearchResultsSkeleton() {
  return (
    <div className="space-y-4">
      {SEARCH_SKELETON_KEYS.map((key) => (
        <Card key={key}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-md" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function GlobalKnowledgeSearch({
  workspaceId,
}: GlobalKnowledgeSearchProps) {
  const [searchInput, setSearchInput] = useState("");

  const {
    searchQuery,
    isSearching,
    searchResults,
    totalResults,
    typeFilters,
    dateRange,
    tagFilters,
    searchHistory,
    isAdvancedSearchOpen,
    error,
    setSearchQuery,
    performSearch,
    clearResults,
    setTypeFilters,
    setDateRange,
    setTagFilters,
    toggleAdvancedSearch,
    clearHistory,
  } = useGlobalKnowledgeSearchStore();

  // Sync input with store
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  // Perform search when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch(workspaceId);
    } else {
      clearResults();
    }
  }, [searchQuery, workspaceId, performSearch, clearResults]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchQuery(searchInput.trim());
    }
  };

  const handleTypeFilterChange = (type: KnowledgeType, checked: boolean) => {
    if (checked) {
      setTypeFilters([...typeFilters, type]);
    } else {
      setTypeFilters(typeFilters.filter((t) => t !== type));
    }
  };

  const handleHistorySelect = (query: string) => {
    setSearchInput(query);
    setSearchQuery(query);
  };

  const clearAllFilters = () => {
    setTypeFilters([]);
    setDateRange(null, null);
    setTagFilters([]);
  };

  const hasActiveFilters =
    typeFilters.length > 0 ||
    dateRange.start ||
    dateRange.end ||
    tagFilters.length > 0;

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Knowledge Search</h2>
        <p className="text-muted-foreground">
          Search across all knowledge types in this workspace
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            {/* Main Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search knowledge base..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 text-base"
                disabled={isSearching}
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                disabled={isSearching || !searchInput.trim()}
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={toggleAdvancedSearch}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                <ChevronDown
                  className={`h-4 w-4 ml-2 transition-transform ${isAdvancedSearchOpen ? "rotate-180" : ""}`}
                />
              </Button>

              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear Filters
                </Button>
              )}

              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearResults}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear Search
                </Button>
              )}
            </div>

            {/* Advanced Filters */}
            <Collapsible open={isAdvancedSearchOpen}>
              <CollapsibleContent className="space-y-4 pt-4 border-t">
                {/* Content Type Filters */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Content Types</Label>
                  <div className="flex gap-4">
                    {(["web", "file", "text"] as KnowledgeType[]).map(
                      (type) => (
                        <label
                          key={type}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={typeFilters.includes(type)}
                            onChange={(e) =>
                              handleTypeFilterChange(type, e.target.checked)
                            }
                            className="rounded-md"
                          />
                          <div className="flex items-center gap-1 text-sm">
                            {getKnowledgeTypeIcon(type)}
                            <span className="capitalize">{type} Knowledge</span>
                          </div>
                        </label>
                      ),
                    )}
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date" className="text-sm font-medium">
                      From Date
                    </Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={dateRange.start || ""}
                      onChange={(e) =>
                        setDateRange(e.target.value || null, dateRange.end)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date" className="text-sm font-medium">
                      To Date
                    </Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={dateRange.end || ""}
                      onChange={(e) =>
                        setDateRange(dateRange.start, e.target.value || null)
                      }
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Search History */}
            {searchHistory.length > 0 && !searchQuery && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Recent Searches</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearHistory}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.slice(0, 5).map((query) => (
                    <button
                      key={`history-${query}`}
                      type="button"
                      onClick={() => handleHistorySelect(query)}
                      className="text-xs px-2 py-1 bg-muted rounded-md hover:bg-muted/80 transition-colors"
                    >
                      <Clock className="h-3 w-3 inline mr-1" />
                      {query}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Search Results */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {searchQuery && !error && (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {isSearching
                ? "Searching..."
                : `${totalResults} result${totalResults !== 1 ? "s" : ""}`}
              {searchQuery && (
                <span className="text-muted-foreground font-normal ml-2">
                  for "{searchQuery}"
                </span>
              )}
            </h3>

            {hasActiveFilters && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span>Filters applied</span>
              </div>
            )}
          </div>

          {/* Results List */}
          {isSearching ? (
            <SearchResultsSkeleton />
          ) : searchResults.length > 0 ? (
            <div className="space-y-4">
              {searchResults.map((result) => (
                <Card
                  key={`${result.type}-${result.id}`}
                  className="transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Type Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getKnowledgeTypeIcon(result.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {result.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Score: {result.relevanceScore}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Matched: {result.matchedFields.join(", ")}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="font-medium text-base mb-2 line-clamp-1">
                          {highlightSearchTerms(result.title, searchQuery)}
                        </h4>

                        {/* Content Preview */}
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {highlightSearchTerms(
                            result.contentPreview,
                            searchQuery,
                          )}
                        </p>

                        {/* URL for web results */}
                        {result.type === "web" && result.url && (
                          <div className="mb-2">
                            <a
                              href={result.url as Route}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline line-clamp-1"
                            >
                              {result.url}
                            </a>
                          </div>
                        )}

                        {/* Tags */}
                        {result.tags && result.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {result.tags.slice(0, 3).map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs"
                              >
                                <Tag className="h-2 w-2 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                            {result.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{result.tags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Created {formatDate(result.created_at)}
                          </div>
                          {result.updated_at &&
                            result.updated_at !== result.created_at && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Updated {formatDate(result.updated_at)}
                              </div>
                            )}
                          {result.status && (
                            <Badge variant="outline" className="text-xs">
                              {result.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  No knowledge items match your search query. Try different
                  keywords or adjust your filters.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty State */}
      {!searchQuery && !error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Search Knowledge Base
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
              Enter keywords to search across all your knowledge items including
              web pages, files, and text notes.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Globe className="h-3 w-3 text-foreground" />
                Web Knowledge
              </div>
              <div className="flex items-center gap-1">
                <Upload className="h-3 w-3 text-foreground" />
                File Knowledge
              </div>
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3 text-foreground" />
                Text Knowledge
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
