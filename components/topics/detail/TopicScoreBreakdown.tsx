"use client";

import {
  AlertTriangle,
  BarChart3,
  Building,
  Crosshair,
  Eye,
  Flame,
  Gem,
  Wrench,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getScoreColorClasses,
  scoreToPercentage,
} from "@/lib/topics/scoring-utils";
import type { GeneratedTopic } from "@/types/topic-builder";

interface ScoreItem {
  label: string;
  value: number;
  weight: string;
  tooltip: string;
  icon: React.ReactNode;
}

interface TopicScoreBreakdownProps {
  scores: GeneratedTopic["scores"];
}

/**
 * Displays individual score breakdowns with icons, progress bars, and tooltips
 */
export function TopicScoreBreakdown({ scores }: TopicScoreBreakdownProps) {
  if (!scores) return null;

  const scoreItems: ScoreItem[] = [
    {
      label: "Relevance",
      value: scoreToPercentage(scores.relevance || 0),
      weight: "20%",
      tooltip: "How well the topic matches your specified criteria and goals",
      icon: <Crosshair className="w-3.5 h-3.5" />,
    },
    {
      label: "SEO Potential",
      value: scoreToPercentage(scores.seo_potential || 0),
      weight: "15%",
      tooltip:
        "Likelihood to rank well in search engines and attract organic traffic",
      icon: <BarChart3 className="w-3.5 h-3.5" />,
    },
    {
      label: "Reader Interest",
      value: scoreToPercentage(scores.reader_interest || 0),
      weight: "15%",
      tooltip: "Expected audience engagement and appeal to your target readers",
      icon: <Eye className="w-3.5 h-3.5" />,
    },
    {
      label: "Trend Level",
      value: scoreToPercentage(scores.trend_level || 0),
      weight: "15%",
      tooltip: "How current and trending the topic is in your industry",
      icon: <Flame className="w-3.5 h-3.5" />,
    },
    {
      label: "Uniqueness",
      value: scoreToPercentage(scores.uniqueness || 0),
      weight: "10%",
      tooltip:
        "Originality of the angle and approach compared to existing content",
      icon: <Gem className="w-3.5 h-3.5" />,
    },
    {
      label: "Actionable",
      value: scoreToPercentage(scores.actionable_potential || 0),
      weight: "10%",
      tooltip: "How practical and implementable the content advice will be",
      icon: <Wrench className="w-3.5 h-3.5" />,
    },
    {
      label: "Brand Alignment",
      value: scoreToPercentage(scores.brand_alignment || 0),
      weight: "10%",
      tooltip: "How well the topic fits with your brand values and messaging",
      icon: <Building className="w-3.5 h-3.5" />,
    },
    {
      label: "Controversy",
      value: scoreToPercentage(scores.controversy || 0),
      weight: "5%",
      tooltip:
        "Potential for polarizing opinions (lower is safer for most brands)",
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
    },
  ];

  // Sort by value descending
  const sortedScores = [...scoreItems].sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-3">
      <div className="text-xs font-medium text-muted-foreground">
        Performance Breakdown:
      </div>
      <div className="space-y-3">
        {sortedScores.map((score) => {
          const colors = getScoreColorClasses(score.value);
          return (
            <Tooltip key={score.label}>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-between py-1 cursor-help hover:bg-muted/10 rounded-md px-1 transition-colors">
                  <div className="flex items-center gap-3 pr-4">
                    <div
                      className={`p-1.5 rounded-md shadow-sm ${colors.background} ${colors.text}`}
                    >
                      {score.icon}
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {score.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 bg-muted/100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${colors.progress}`}
                        style={{ width: `${score.value}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-foreground min-w-[2rem] text-right">
                      {score.value}%
                    </span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[280px]">
                <div className="space-y-1">
                  <div className="font-medium">{score.label}</div>
                  <div className="text-xs text-muted-foreground mb-1">
                    {score.tooltip}
                  </div>
                  <div className="text-xs text-primary font-medium">
                    Weight: {score.weight} of overall score
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
