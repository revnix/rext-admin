"use client";

import { useState } from "react";
import { Search, ChevronRight, ChevronLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    <div className="max-w-4xl mx-auto w-full px-4 py-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold font-serif">Keyword Library</h1>
          <p className="text-muted-foreground">
            Select a keyword to generate content topics.
          </p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search saved keywords..."
            className="pl-10 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-1">
        {filteredKeywords.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedId(item.id)}
            className={cn(
              "group relative p-4 rounded-xl border-2 transition-all cursor-pointer bg-white hover:border-primary/50 text-left",
              selectedId === item.id
                ? "border-primary ring-1 ring-primary shadow-sm"
                : "border-slate-100 shadow-sm",
            )}
          >
            <div className="flex justify-between items-start mb-2">
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs font-normal",
                  item.difficulty === "High"
                    ? "bg-red-50 text-red-600"
                    : item.difficulty === "Medium"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-green-50 text-green-600",
                )}
              >
                {item.difficulty}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {item.lastUpdated}
              </span>
            </div>
            <h3 className="font-medium text-slate-900 mb-1 group-hover:text-primary transition-colors">
              {item.keyword}
            </h3>
            <p className="text-xs text-muted-foreground">Vol: {item.volume}</p>
          </button>
        ))}
      </div>

      {filteredKeywords.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-xl bg-slate-50">
          <p className="text-muted-foreground">No keywords found.</p>
        </div>
      )}

      <div className="flex justify-end sticky bottom-6">
        <Button
          size="lg"
          disabled={!selectedId}
          onClick={handleContinue}
          className="shadow-lg"
        >
          Continue to Topics
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
