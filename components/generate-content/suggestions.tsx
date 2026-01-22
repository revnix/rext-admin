import type { SEORESULT } from "@/types/generate-content";
import { Zap, Compass, TrendingUp, ArrowRight } from "lucide-react";
import { ChartRadialStacked } from "../ui/content/chart-radial-stacked";
import { MonthlyVolumeCard } from "../ui/content/monthly-volume-card";
import { SearchIntentCard } from "../ui/content/intent-card";
import { Button } from "../ui/button";
import { useMemo } from "react";

export function SuggestionsSection({
  instruction,
  primaryKeyword,
  suggestedKeywords,
  onSelect,
  seoResult,
}: {
  instruction: string;
  primaryKeyword: string;
  suggestedKeywords: string[];
  onSelect: (kw: string) => void;
  seoResult: SEORESULT | null;
}) {
  const difficultyScore = useMemo(() => {
    const value = seoResult?.keyword_difficulty;
    const numberValue = typeof value === "number" ? value : Number(value);

    return Number.isFinite(numberValue) ? Math.round(numberValue) : 0;
  }, [seoResult?.keyword_difficulty]);

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => onSelect(primaryKeyword)}
        className="w-full text-left relative mt-4 cursor-pointer overflow-hidden rounded-xl border border-primary/30 bg-white p-4 group transition-all duration-200 hover:border-primary/60 hover:shadow-sm"
      >
        {/* Accent bar */}
        <span className="absolute left-0 top-0 h-full w-1 bg-primary" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Searched Keyword</p>
            <h1 className="text-2xl md:text-3xl font-semibold leading-snug text-foreground">
              {primaryKeyword}
            </h1>
          </div>
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-primary transition-all duration-200 group-hover:translate-x-1 group-hover:bg-primary group-hover:text-primary-foreground">
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 mt-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-between transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-400">
              Difficulty
            </span>
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <ChartRadialStacked difficultyScore={difficultyScore} />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-4 h-full flex flex-col justify-between transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-400">
                Search Intent
              </span>
              <Compass className="w-4 h-4 text-primary" />
            </div>
            <div className="flex items-center gap-3">
              <SearchIntentCard
                intent={
                  seoResult?.intent as
                    | "informational"
                    | "commercial"
                    | "transactional"
                    | "navigational"
                }
              />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 h-full flex flex-col justify-between transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-400">
                Monthly Volume
              </span>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
            <MonthlyVolumeCard volume={seoResult?.volume} />
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold my-4">{instruction}</h2>

      <div className="flex flex-wrap gap-2">
        {suggestedKeywords.map((kw) => (
          <Button
            key={kw}
            variant="outline"
            onClick={() => onSelect(kw)}
            className="bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-all ease-in-out duration-300"
          >
            <strong>{kw}</strong>
          </Button>
        ))}
      </div>
    </div>
  );
}
