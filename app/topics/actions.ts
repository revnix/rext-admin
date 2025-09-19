"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:2024";
const API_KEY = process.env.CONTENT_API_KEY;

if (!API_KEY) {
  throw new Error("CONTENT_API_KEY environment variable is required");
}

// Ensure API_KEY is never undefined for TypeScript
const VALIDATED_API_KEY = API_KEY;

export async function deleteTopic(formData: FormData) {
  const topicId = formData.get("topicId") as string;

  if (!topicId) {
    throw new Error("Topic ID is required");
  }

  try {
    logger.info("Deleting topic via server action", { topicId });

    const response = await fetch(`${BACKEND_URL}/api/topic/delete`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Content-API-Key": VALIDATED_API_KEY,
      },
      body: JSON.stringify({ topic_ids: [topicId] }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error("Failed to delete topic", {
        topicId,
        status: response.status,
        error: errorData.error || `HTTP ${response.status}`,
      });
      throw new Error(`Failed to delete topic: ${response.status}`);
    }

    const result = await response.json();

    logger.info("Successfully deleted topic", {
      topicId,
      deleted_count: result.deleted_count || 1,
    });

    // Revalidate the topics page to reflect the deletion
    revalidatePath("/topics");

    return {
      success: true,
      deleted_count: result.deleted_count || 1,
    };
  } catch (error) {
    logger.error("Server action delete topic failed", {
      topicId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function deleteTopics(formData: FormData) {
  const topicIdsJson = formData.get("topicIds") as string;

  if (!topicIdsJson) {
    throw new Error("Topic IDs are required");
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
      count: topicIds.length,
    });

    const response = await fetch(`${BACKEND_URL}/api/topic/delete`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Content-API-Key": VALIDATED_API_KEY,
      },
      body: JSON.stringify({ topic_ids: topicIds }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error("Failed to delete topics", {
        topicIds,
        status: response.status,
        error: errorData.error || `HTTP ${response.status}`,
      });
      throw new Error(`Failed to delete topics: ${response.status}`);
    }

    const result = await response.json();

    logger.info("Successfully deleted topics", {
      topicIds,
      deleted_count: result.deleted_count || topicIds.length,
    });

    // Revalidate the topics page to reflect the deletions
    revalidatePath("/topics");

    return {
      success: true,
      deleted_count: result.deleted_count || topicIds.length,
    };
  } catch (error) {
    logger.error("Server action delete topics failed", {
      topicIds,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
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

export async function saveTopic(formData: FormData) {
  const topicDataJson = formData.get("topicData") as string;

  if (!topicDataJson) {
    throw new Error("Topic data is required");
  }

  let topicData: SaveTopicData;
  try {
    topicData = JSON.parse(topicDataJson);
  } catch {
    throw new Error("Invalid topic data format");
  }

  if (!topicData.title) {
    throw new Error("Topic title is required");
  }

  try {
    logger.info("Saving topic via server action", {
      title: topicData.title,
    });

    const response = await fetch(`${BACKEND_URL}/api/topic/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-API-Key": VALIDATED_API_KEY,
      },
      body: JSON.stringify(topicData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error("Failed to save topic", {
        title: topicData.title,
        status: response.status,
        error: errorData.error || `HTTP ${response.status}`,
      });
      throw new Error(`Failed to save topic: ${response.status}`);
    }

    const result = await response.json();

    logger.info("Successfully saved topic", {
      title: topicData.title,
      saved_count: result.saved_count || 1,
    });

    // Revalidate the topics page to show the new topic
    revalidatePath("/topics");

    // Redirect to topics list after successful save
    redirect("/topics");
  } catch (error) {
    // Don't redirect on error, let the client handle it
    logger.error("Server action save topic failed", {
      title: topicData.title,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
