import { log } from "@/lib/logger";
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
  return {
    id: topic.id,
    topic_name: topic.topic_name || topic.title || "Untitled Topic",
    description: topic.description || "",
    category: "General",
    created: topic.created_at || new Date().toISOString(),
    ranking: `#${index + 1}`,
  };
}

export function transformTopicsForDisplay(
  topics: GeneratedTopic[],
): TopicData[] {
  if (!Array.isArray(topics)) {
    log.warn("Invalid topics data received:", topics);
    return [];
  }

  return topics.map((topic, index) => transformTopicForDisplay(topic, index));
}
