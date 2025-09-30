import type { BackendSaveTopicRequestList } from "@/types/backend";
import type { GeneratedTopic } from "@/types/topic-builder";

/**
 * Convert a single `GeneratedTopic` into the payload the backend expects when
 * persisting topics. This keeps only the surface level mapping that was
 * previously buried inside the 1k+ line transformer module.
 */
export function transformTopicForBackend(topic: GeneratedTopic) {
  return {
    id: topic.id,
    title: topic.title,
    angle: topic.angle,
    description: topic.description ?? topic.title,
    channel_fit: topic.channel_fit ?? [],
    audience_fit: topic.audience_fit ?? [],
    why_it_works: topic.why_it_works ?? "",
    tags: topic.tags ?? [],
    scores: topic.scores,
    suggested_defaults: {
      platform: "Website",
      industry: topic.audience_fit?.[0] || "general",
      audienceType: topic.audience_fit || [],
      readingLevel: ["Intermediate"],
      goals: ["educate-inform"],
      tone: ["professional-formal"],
      region: "International/Global",
      contentLength: { type: "preset", preset: "Medium" },
      primaryKeywords: topic.tags?.slice(0, 5) || [],
      includeTOC: false,
      includeSummary: true,
      includeCTA: true,
      includeKeyTakeaways: true,
    },
    input_params: undefined,
  } satisfies BackendSaveTopicRequestList["topics"][number];
}

/**
 * Convert an array of `GeneratedTopic` objects into the backend save payload.
 */
export function transformTopicsForBackend(
  topics: GeneratedTopic[],
): BackendSaveTopicRequestList {
  return {
    topics: topics.map(transformTopicForBackend),
  };
}
