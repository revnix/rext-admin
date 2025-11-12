"use client";

import { TrendingUp } from "lucide-react";
import { DetailCard } from "@/components/ui/detail-card";
import { SectionHeader } from "@/components/ui/section-header";
import type { GeneratedTopic } from "@/types/topic-builder";
import { QualityScoreDashboard } from "./QualityScoreDashboard";
import { TopicScoreBreakdown } from "./TopicScoreBreakdown";

interface OverallScoreCardProps {
  topic: GeneratedTopic;
  overallScore: number;
  rating: string;
  colorClasses: {
    badge: string;
    background: string;
    text: string;
    progress: string;
  };
}

/**
 * Complete overall score card combining dashboard and breakdown
 */
export function OverallScoreCard({
  topic,
  overallScore,
  rating,
  colorClasses,
}: OverallScoreCardProps) {
  return (
    <DetailCard variant="default" className="relative">
      <div className="flex items-start justify-between">
        <SectionHeader
          title="Overall Quality Score"
          icon={<TrendingUp className="w-5 h-5" />}
          variant="spacious"
          className="mb-0 pb-2"
        />
      </div>
      <div
        className={`px-2 py-1 rounded-full text-xs font-medium w-max mx-auto ${colorClasses.badge}`}
      >
        {rating}
      </div>

      {/* Main Score Display - Dashboard Style */}
      <QualityScoreDashboard score={overallScore} />

      {/* Complete Score Breakdown */}
      <TopicScoreBreakdown scores={topic.scores} />

      {/* Explanatory Note */}
      <div className="mt-4 pt-3 border-t border-muted/20">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          These scores are based on your selections and preferences from when
          this topic was originally generated in the Topic Builder wizard.
        </p>
      </div>
    </DetailCard>
  );
}
