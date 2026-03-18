import type { BackendSaveTopicRequestList } from "@/types/backend";
import type { GeneratedTopic } from "@/types/topic-builder";

/**
 * Convert a single `GeneratedTopic` into the payload the backend expects when
 * persisting topics. This keeps only the surface level mapping that was
 * previously buried inside the 1k+ line transformer module.
 */
export function transformTopicForBackend(
  topic: GeneratedTopic,
  workspaceId: string,
) {
  return {
    id: topic.id,
    workspace_id: workspaceId,
    topic_name: topic.topic_name || topic.title || "Untitled",
    description: topic.description ?? "",
  } satisfies BackendSaveTopicRequestList["topics"][number];
}

/**
 * Convert an array of `GeneratedTopic` objects into the backend save payload.
 */
export function transformTopicsForBackend(
  topics: GeneratedTopic[],
  workspaceId: string,
): BackendSaveTopicRequestList {
  return {
    topics: topics.map((topic) => transformTopicForBackend(topic, workspaceId)),
  };
}
