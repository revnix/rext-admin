import type { TopicData } from "@/types/data-table";
import type { GeneratedTopic } from "@/types/topic-builder";

/**
 * Simple topic transformer - replaces the over-engineered 1,055-line adapter
 * Directly maps GeneratedTopic to TopicData without complex validation layers
 */
export function transformTopicForDisplay(
  topic: GeneratedTopic,
  index: number = 0,
): TopicData {
  // Calculate overall score from individual scores
  const calculateOverallScore = (scores: GeneratedTopic["scores"]): number => {
    if (!scores) return 50;
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
      relevance * 0.2 +
      seo_potential * 0.15 +
      trend_level * 0.15 +
      uniqueness * 0.1 +
      reader_interest * 0.15 +
      actionable_potential * 0.1 +
      brand_alignment * 0.1 +
      controversy * 0.05;

    return Math.round(totalScore * 100);
  };

  // Determine priority from scores
  const calculatePriority = (scores: GeneratedTopic["scores"]): string => {
    if (!scores) return "medium";
    const overallScore = calculateOverallScore(scores);
    if (overallScore >= 80) return "high";
    if (overallScore >= 60) return "medium";
    return "low";
  };

  // Get primary category from tags or channel fit
  const getCategory = (): string => {
    if (topic.tags && topic.tags.length > 0) {
      return topic.tags[0].charAt(0).toUpperCase() + topic.tags[0].slice(1);
    }
    if (topic.channel_fit && topic.channel_fit.length > 0) {
      return (
        topic.channel_fit[0].charAt(0).toUpperCase() +
        topic.channel_fit[0].slice(1)
      );
    }
    return "General";
  };

  return {
    id: topic.id,
    name: topic.title,
    description: topic.description || "",
    category: getCategory(),
    status: topic.is_saved ? "saved" : "generated",
    priority: calculatePriority(topic.scores),
    source: "AI Generated",
    tags: topic.tags || [],
    created: topic.created_at || new Date().toISOString(),
    lastModified: new Date().toISOString(),
    assignee: "AI Assistant",
    estimatedEffort: "Medium",
    score: calculateOverallScore(topic.scores),
    ranking: `#${index + 1}`,
    updated: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    author: "AI Assistant",
    contentType: "General",
    // Enhanced fields - directly pass through from API
    audience_fit: topic.audience_fit,
    channel_fit: topic.channel_fit,
    scores: topic.scores,
    angle: topic.angle,
    why_it_works: topic.why_it_works,
  };
}

export function transformTopicsForDisplay(
  topics: GeneratedTopic[],
): TopicData[] {
  if (!Array.isArray(topics)) {
    console.warn("Invalid topics data received:", topics);
    return [];
  }

  return topics.map((topic, index) => transformTopicForDisplay(topic, index));
}
