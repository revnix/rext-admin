import { useMemo } from "react";
import {
  calculateOverallScore,
  getScoreColorClasses,
  getScoreRating,
} from "@/lib/topics/scoring-utils";
import type { GeneratedTopic } from "@/types/topic-builder";

/**
 * Hook for calculating and managing topic scoring
 *
 * @param topic - Generated topic object
 * @returns Scoring information and utilities
 */
export function useTopicScoring(topic: GeneratedTopic | null | undefined) {
  return useMemo(() => {
    if (!topic?.scores) {
      return {
        overallScore: 0,
        rating: "Needs Work" as const,
        colorClasses: getScoreColorClasses(0),
      };
    }

    const overallScore = calculateOverallScore(topic.scores);
    const rating = getScoreRating(overallScore);
    const colorClasses = getScoreColorClasses(overallScore);

    return {
      overallScore,
      rating,
      colorClasses,
    };
  }, [topic]);
}
