"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";
import { BackendService } from "@/services/backend";
import type { GeneratedTopic } from "@/types/topic-builder";

/**
 * Delete a single topic using BackendService
 *
 * @param formData - FormData containing topicId and workspaceId
 * @returns Promise resolving to delete operation results
 * @throws {Error} When topic ID or workspace ID is missing, or deletion fails
 *
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.set("topicId", "topic_123");
 * formData.set("workspaceId", "workspace_abc");
 * const result = await deleteTopic(formData);
 * ```
 */
export async function deleteTopic(formData: FormData) {
  const topicId = formData.get("topicId") as string;
  const workspaceId = formData.get("workspaceId") as string;

  if (!topicId) {
    throw new Error("Topic ID is required");
  }

  if (!workspaceId) {
    throw new Error("Workspace ID is required");
  }

  try {
    logger.info("Deleting topic via server action", { topicId, workspaceId });

    const backendService = new BackendService();
    const result = await backendService.deleteTopics([topicId], workspaceId);

    logger.info("Successfully deleted topic", {
      topicId,
      workspaceId,
      deleted_count: result.deleted_count,
    });

    // Revalidate the topics page to reflect the deletion
    revalidatePath("/topics");

    return {
      success: true,
      deleted_count: result.deleted_count,
    };
  } catch (error) {
    logger.error("Server action delete topic failed", {
      topicId,
      workspaceId,
      error: error instanceof Error ? error.message : String(error),
    });
    
    // Extract better error message for the client
    let errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check if error is about content association
    if (errorMessage && errorMessage.toLowerCase().includes("content")) {
      errorMessage = "Cannot delete this topic because it has associated content. Please delete or reassign the content first.";
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Delete multiple topics using BackendService
 *
 * @param formData - FormData containing topicIds (JSON array) and workspaceId
 * @returns Promise resolving to delete operation results
 * @throws {Error} When topic IDs or workspace ID is missing, or deletion fails
 *
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.set("topicIds", JSON.stringify(["topic_1", "topic_2"]));
 * formData.set("workspaceId", "workspace_abc");
 * const result = await deleteTopics(formData);
 * ```
 */
export async function deleteTopics(formData: FormData) {
  const topicIdsJson = formData.get("topicIds") as string;
  const workspaceId = formData.get("workspaceId") as string;

  if (!topicIdsJson) {
    throw new Error("Topic IDs are required");
  }

  if (!workspaceId) {
    throw new Error("Workspace ID is required");
  }

  let topicIds: string[];
  try {
    topicIds = JSON.parse(topicIdsJson);
  } catch {
    throw new Error("Invalid topic IDs format");
  }

  if (!Array.isArray(topicIds) || topicIds.length === 0) {
    throw new Error("At least one topic ID is required");
  }

  try {
    logger.info("Deleting multiple topics via server action", {
      topicIds,
      workspaceId,
      count: topicIds.length,
    });

    const backendService = new BackendService();
    const result = await backendService.deleteTopics(topicIds, workspaceId);

    logger.info("Successfully deleted topics", {
      topicIds,
      workspaceId,
      deleted_count: result.deleted_count,
    });

    // Revalidate the topics page to reflect the deletions
    revalidatePath("/topics");

    return {
      success: true,
      deleted_count: result.deleted_count,
    };
  } catch (error) {
    logger.error("Server action delete topics failed", {
      topicIds,
      workspaceId,
      error: error instanceof Error ? error.message : String(error),
    });
    
    // Extract better error message for the client
    let errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check if error is about content association
    if (errorMessage && errorMessage.toLowerCase().includes("content")) {
      const topicCount = topicIds.length;
      errorMessage = topicCount === 1 
        ? "Cannot delete this topic because it has associated content. Please delete or reassign the content first."
        : "One or more of these topics have associated content. Please delete or reassign the content first.";
    }
    
    throw new Error(errorMessage);
  }
}

export interface SaveTopicData {
  title: string;
  description?: string;
  angle?: string;
  tags?: string[];
  audience_fit?: string[];
  channel_fit?: string[];
  scores?: Record<string, number>;
  why_it_works?: string;
}

export interface UpdateTopicData {
  topic_id: string;
  title?: string;
  angle?: string;
  description?: string;
  channel_fit?: string[];
  audience_fit?: string[];
  why_it_works?: string;
  tags?: string[];
  approved?: boolean;
}

/**
 * Update a topic using BackendService
 *
 * @param formData - FormData containing updateData (JSON object) and workspaceId
 * @returns Promise resolving to update operation results
 * @throws {Error} When update data, topic ID, or workspace ID is missing, or update fails
 *
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.set("updateData", JSON.stringify({ topic_id: "123", approved: true }));
 * formData.set("workspaceId", "workspace_abc");
 * const result = await updateTopic(formData);
 * ```
 */
export async function updateTopic(formData: FormData) {
  const updateDataJson = formData.get("updateData") as string;
  const workspaceId = formData.get("workspaceId") as string;

  if (!updateDataJson) {
    throw new Error("Update data is required");
  }

  if (!workspaceId) {
    throw new Error("Workspace ID is required");
  }

  let updateData: UpdateTopicData;
  try {
    updateData = JSON.parse(updateDataJson);
  } catch {
    throw new Error("Invalid update data format");
  }

  if (!updateData.topic_id) {
    throw new Error("Topic ID is required");
  }

  try {
    logger.info("Updating topic via server action", {
      topicId: updateData.topic_id,
      workspaceId,
      fields: Object.keys(updateData).filter(
        (key) =>
          key !== "topic_id" &&
          updateData[key as keyof UpdateTopicData] !== undefined,
      ),
    });

    const backendService = new BackendService();

    // Extract topic_id and pass remaining fields as update data
    const { topic_id, ...fieldsToUpdate } = updateData;
    const result = await backendService.updateTopic(
      topic_id,
      fieldsToUpdate,
      workspaceId,
    );

    logger.info("Successfully updated topic", {
      topicId: topic_id,
      workspaceId,
      updated_count: result.updated_count,
      updated_fields: result.updated_fields,
    });

    // Revalidate the topics page to reflect the changes
    revalidatePath("/topics");

    return {
      success: true,
      updated_count: result.updated_count,
      updated_fields: result.updated_fields,
    };
  } catch (error) {
    logger.error("Server action update topic failed", {
      topicId: updateData.topic_id,
      workspaceId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Approve a topic - convenience wrapper around updateTopic
 *
 * @param formData - FormData containing topicId and workspaceId
 * @returns Promise resolving to update operation results
 * @throws {Error} When topic ID or workspace ID is missing, or approval fails
 *
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.set("topicId", "topic_123");
 * formData.set("workspaceId", "workspace_abc");
 * const result = await approveTopic(formData);
 * ```
 */
export async function approveTopic(formData: FormData) {
  const topicId = formData.get("topicId") as string;
  const workspaceId = formData.get("workspaceId") as string;

  if (!topicId) {
    throw new Error("Topic ID is required");
  }

  if (!workspaceId) {
    throw new Error("Workspace ID is required");
  }

  // Create a new FormData with the update structure
  const updateFormData = new FormData();
  updateFormData.set(
    "updateData",
    JSON.stringify({
      topic_id: topicId,
      approved: true,
    }),
  );
  updateFormData.set("workspaceId", workspaceId);

  return await updateTopic(updateFormData);
}

/**
 * Save generated topics using BackendService
 *
 * @param formData - FormData containing topicsData (JSON array) and workspaceId
 * @returns Promise that redirects to topics page on success
 * @throws {Error} When topics data or workspace ID is missing, or save fails
 *
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.set("topicsData", JSON.stringify([{ id: "1", title: "Topic", ... }]));
 * formData.set("workspaceId", "workspace_abc");
 * await saveTopic(formData); // Redirects on success
 * ```
 */
export async function saveTopic(formData: FormData) {
  const topicsDataJson = formData.get("topicsData") as string;
  const workspaceId = formData.get("workspaceId") as string;

  if (!topicsDataJson) {
    throw new Error("Topics data is required");
  }

  if (!workspaceId) {
    throw new Error("Workspace ID is required");
  }

  let topicsData: GeneratedTopic[];
  try {
    topicsData = JSON.parse(topicsDataJson);
  } catch {
    throw new Error("Invalid topics data format");
  }

  if (!Array.isArray(topicsData) || topicsData.length === 0) {
    throw new Error("At least one topic is required");
  }

  try {
    logger.info("Saving topics via server action", {
      workspaceId,
      count: topicsData.length,
      firstTitle: topicsData[0]?.title,
    });

    const backendService = new BackendService();
    const result = await backendService.saveTopics(topicsData, workspaceId);

    logger.info("Successfully saved topics", {
      workspaceId,
      saved_count: result.saved_count,
    });

    // Revalidate the topics page to show the new topics
    revalidatePath("/topics");

    // Redirect to topics list after successful save
    redirect("/topics");
  } catch (error) {
    // Don't redirect on error, let the client handle it
    logger.error("Server action save topics failed", {
      workspaceId,
      count: topicsData.length,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
