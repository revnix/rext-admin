import type { GeneratedTopic } from "@/types/topic-builder";

/**
 * Score weights used for calculating overall topic quality score
 * These weights should match the values used in simple-topic-transformer.ts
 */
export const SCORE_WEIGHTS = {
  relevance: 0.2,
  seo_potential: 0.15,
  trend_level: 0.15,
  uniqueness: 0.1,
  reader_interest: 0.15,
  actionable_potential: 0.1,
  brand_alignment: 0.1,
  controversy: 0.05, // Note: inverted (lower controversy = higher score)
} as const;

/**
 * Score thresholds for quality ratings
 */
export const SCORE_THRESHOLDS = {
  excellent: 80,
  good: 60,
  fair: 40,
} as const;

/**
 * Calculate overall quality score using weighted formula
 * Note: controversy is inverted (lower controversy = higher score)
 *
 * @param scores - Topic scores object
 * @returns Overall score as percentage (0-100)
 */
export function calculateOverallScore(
  scores: GeneratedTopic["scores"],
): number {
  if (!scores) return 0;

  const {
    relevance = 0,
    seo_potential = 0,
    trend_level = 0,
    uniqueness = 0,
    reader_interest = 0,
    actionable_potential = 0,
    brand_alignment = 0,
    controversy = 0,
  } = scores;

  // Weighted average of all score components
  const totalScore =
    relevance * SCORE_WEIGHTS.relevance +
    seo_potential * SCORE_WEIGHTS.seo_potential +
    trend_level * SCORE_WEIGHTS.trend_level +
    uniqueness * SCORE_WEIGHTS.uniqueness +
    reader_interest * SCORE_WEIGHTS.reader_interest +
    actionable_potential * SCORE_WEIGHTS.actionable_potential +
    brand_alignment * SCORE_WEIGHTS.brand_alignment +
    (1 - controversy) * SCORE_WEIGHTS.controversy;

  return Math.round(totalScore * 100);
}

/**
 * Get quality rating label based on score
 *
 * @param score - Overall score (0-100)
 * @returns Quality rating label
 */
export function getScoreRating(
  score: number,
): "Excellent" | "Good" | "Fair" | "Needs Work" {
  if (score >= SCORE_THRESHOLDS.excellent) return "Excellent";
  if (score >= SCORE_THRESHOLDS.good) return "Good";
  if (score >= SCORE_THRESHOLDS.fair) return "Fair";
  return "Needs Work";
}

/**
 * Get color classes for score display based on value
 *
 * @param score - Score value (0-100)
 * @returns Tailwind CSS classes for background and text colors
 */
export function getScoreColorClasses(score: number): {
  badge: string;
  background: string;
  text: string;
  progress: string;
} {
  if (score >= SCORE_THRESHOLDS.excellent) {
    return {
      badge: "bg-success-50 text-success-700",
      background: "bg-success-50",
      text: "text-success-600",
      progress: "bg-success-600",
    };
  }
  if (score >= SCORE_THRESHOLDS.good) {
    return {
      badge: "bg-info-50 text-info-700",
      background: "bg-info-50",
      text: "text-info-600",
      progress: "bg-info-600",
    };
  }
  if (score >= SCORE_THRESHOLDS.fair) {
    return {
      badge: "bg-warning-50 text-warning-700",
      background: "bg-warning-50",
      text: "text-warning-600",
      progress: "bg-warning-600",
    };
  }
  return {
    badge: "bg-danger-50 text-danger-700",
    background: "bg-danger-50",
    text: "text-danger-600",
    progress: "bg-danger-600",
  };
}

/**
 * Convert individual score (0-1) to percentage
 *
 * @param score - Score value (0-1)
 * @returns Percentage (0-100)
 */
export function scoreToPercentage(score: number): number {
  return Math.round(score * 100);
}
