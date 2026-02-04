"use client";

import { useState } from "react";
import { Search, ChevronRight, ChevronLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Mock Data
const MOCK_KEYWORDS = [
  {
    id: "1",
    keyword: "SaaS Marketing Strategy",
    difficulty: "High",
    volume: "12.5k",
    lastUpdated: "2 days ago",
  },
  {
    id: "2",
    keyword: "Best AI Writing Tools 2024",
    difficulty: "Medium",
    volume: "8.2k",
    lastUpdated: "5 hours ago",
  },
  {
    id: "3",
    keyword: "How to Scale Content Production",
    difficulty: "Low",
    volume: "1.5k",
    lastUpdated: "1 week ago",
  },
  {
    id: "4",
    keyword: "Email Marketing Automation",
    difficulty: "High",
    volume: "45k",
    lastUpdated: "3 days ago",
  },
  {
    id: "5",
    keyword: "Lead Generation Tactics",
    difficulty: "Medium",
    volume: "5.6k",
    lastUpdated: "1 day ago",
  },
  {
    id: "6",
    keyword: "Content Distribution Channels",
    difficulty: "Low",
    volume: "2.1k",
    lastUpdated: "4 days ago",
  },
  {
    id: "7",
    keyword: "SEO Best Practices",
    difficulty: "Hard",
    volume: "90k",
    lastUpdated: "2 weeks ago",
  },
  {
    id: "8",
    keyword: "Social Media Trends",
    difficulty: "Medium",
    volume: "33k",
    lastUpdated: "1 month ago",
  },
];

interface LibraryViewProps {
  onSelectKeyword: (keyword: string) => void;
  onBack: () => void;
}

export function LibraryView({ onSelectKeyword, onBack }: LibraryViewProps) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredKeywords = MOCK_KEYWORDS.filter((k) =>
    k.keyword.toLowerCase().includes(search.toLowerCase()),
  );

  const handleContinue = () => {
    const selected = MOCK_KEYWORDS.find((k) => k.id === selectedId);
    if (selected) {
      onSelectKeyword(selected.keyword);
    }
  };

  return (
    <div className="w-full h-full animate-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Keyword Library
        </h1>
        <p className="text-muted-foreground">
          Select a keyword to generate content topics.
        </p>
      </div>

      <div className="flex gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
          <Input
            placeholder="Search saved keywords..."
            className="pl-10 bg-white text-foreground shadow-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredKeywords.map((item) => (
          <Card
            key={item.id}
            onClick={() => setSelectedId(item.id)}
            className={cn(
              "cursor-pointer transition-all duration-200 border-2 hover:border-primary/50",
              selectedId === item.id
                ? "border-primary bg-primary/5"
                : "border-border/50 bg-card",
            )}
          >
            <div className="p-5 space-y-3">
              <div className="flex justify-between items-start">
                <Badge
                  variant="secondary"
                  className={cn(
                    "font-medium",
                    item.difficulty === "High"
                      ? "bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-200"
                      : item.difficulty === "Medium"
                        ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-200"
                        : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-200",
                  )}
                >
                  {item.difficulty}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {item.lastUpdated}
                </span>
              </div>

              <div>
                <h3
                  className={cn(
                    "font-bold text-lg leading-tight mb-1 transition-colors",
                    selectedId === item.id
                      ? "text-primary"
                      : "text-card-foreground",
                  )}
                >
                  {item.keyword}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Vol: {item.volume}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredKeywords.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-muted rounded-xl bg-muted/30">
          <p className="text-muted-foreground font-medium">
            No keywords found.
          </p>
          <p className="text-sm text-muted-foreground/80 mt-1">
            Try searching for something else.
          </p>
        </div>
      )}

      <div className="flex justify-start sticky bottom-6 mt-8">
        <Button
          size="lg"
          disabled={!selectedId}
          onClick={handleContinue}
          className="transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Continue to Topics
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
