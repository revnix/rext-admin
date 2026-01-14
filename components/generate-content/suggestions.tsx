import { Zap, Compass, TrendingUp } from "lucide-react";
import { ChartRadialStacked } from "../ui/content/chart-radial-stacked";
import { MonthlyVolumeCard } from "../ui/content/monthly-volume-card";
import { SearchIntentCard } from "../ui/content/intent-card";
import { motion } from "framer-motion";

export function SuggestionsSection({
  instruction,
  primaryKeyword,
  suggestedKeywords,
  onSelect,
}: {
  instruction: string;
  primaryKeyword: string;
  suggestedKeywords: string[];
  onSelect: (kw: string) => void;
}) {
  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => onSelect(primaryKeyword)}
        className="w-full text-left relative mt-4 cursor-pointer overflow-hidden rounded-xl border border-primary/30 bg-white p-4"
      >
        {/* Accent bar */}
        <span className="absolute left-0 top-0 h-full w-1 bg-primary" />
        <p>Searched Keyword</p>
        <h1 className="text-2xl md:text-3xl font-semibold leading-snug ">
          {primaryKeyword}
        </h1>
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
            <ChartRadialStacked difficultyScore={54} />
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
              <SearchIntentCard intent="informational" />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 h-full flex flex-col justify-between transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-400">
                Monthly Volume
              </span>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
            <MonthlyVolumeCard volume="0" />
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold my-4">{instruction}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suggestedKeywords.map((keyword, index) => {
          const icons = [Zap, Compass, TrendingUp, Zap, Compass];
          const iconColors = [
            "bg-blue-50 text-blue-600",
            "bg-purple-50 text-purple-600",
            "bg-green-50 text-green-600",
            "bg-orange-50 text-orange-600",
            "bg-pink-50 text-pink-600",
          ];
          const Icon = icons[index % icons.length];
          const iconColorClass = iconColors[index % iconColors.length];

          return (
            <motion.button
              key={keyword}
              type="button"
              onClick={() => onSelect(keyword)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-primary/30"
            >
              {/* Icon Badge */}
              <div
                className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${iconColorClass} mb-4`}
              >
                <Icon className="h-6 w-6" />
              </div>

              {/* Decorative Background Icon */}
              <div className="absolute right-4 top-4 opacity-5 pointer-events-none">
                <Icon className="h-24 w-24" />
              </div>

              {/* Keyword Title */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2 leading-tight">
                {keyword}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-500 mb-4">
                Generate content optimized for this keyword
              </p>

              {/* Action Link */}
              <div className="flex items-center text-blue-600 font-medium text-sm mt-auto group-hover:gap-2 transition-all duration-300">
                <span>Select keyword</span>
                <TrendingUp className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
