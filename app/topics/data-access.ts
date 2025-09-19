import { notFound } from "next/navigation";
import { logger } from "@/lib/logger";
import type { GeneratedTopic } from "@/types/topic-builder";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:2024";
const API_KEY = process.env.CONTENT_API_KEY;

if (!API_KEY) {
  throw new Error("CONTENT_API_KEY environment variable is required");
}

// Ensure API_KEY is never undefined for TypeScript
const VALIDATED_API_KEY = API_KEY;

export interface TopicsResponse {
  topics: GeneratedTopic[];
  total_count: number;
  pagination?: {
    page: number;
    page_size: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

/**
 * Server-side data fetcher for topics list
 * Directly calls backend API, eliminating the double-hop pattern
 *
 * @returns Promise<GeneratedTopic[]> List of topics from backend
 */
export async function getTopics(): Promise<GeneratedTopic[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/topic/get-topics`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Content-API-Key": VALIDATED_API_KEY,
      },
      // Next.js 15 fetch caching
      next: { revalidate: 300 }, // 5 minutes
    });

    if (!response.ok) {
      if (response.status === 404) {
        notFound();
      }
      throw new Error(`Failed to fetch topics: ${response.status}`);
    }

    const data = await response.json();

    // Handle backend consistent response format
    const topics = data.data?.topics || data.topics || [];

    logger.info("Successfully fetched topics from backend", {
      count: topics.length,
      cached: response.headers.get("cache-status") === "hit",
    });

    return topics;
  } catch (error) {
    logger.error("Failed to fetch topics from backend", {
      error: error instanceof Error ? error.message : String(error),
      backend_url: BACKEND_URL,
    });
    throw error;
  }
}

/**
 * Server-side data fetcher for a single topic
 * Directly calls backend API, eliminating the double-hop pattern
 *
 * @param id - Topic ID to fetch
 * @returns Promise<GeneratedTopic | null> Single topic or null if not found
 */
export async function getTopic(id: string): Promise<GeneratedTopic | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/topic/get-topic/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Content-API-Key": VALIDATED_API_KEY,
      },
      next: { revalidate: 60 }, // 1 minute for individual topics
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch topic: ${response.status}`);
    }

    const data = await response.json();

    // Handle backend consistent response format
    const topic = data.data?.topic || data.topic || null;

    logger.info("Successfully fetched topic from backend", {
      topic_id: id,
      found: !!topic,
      cached: response.headers.get("cache-status") === "hit",
    });

    return topic;
  } catch (error) {
    logger.error("Failed to fetch topic from backend", {
      topic_id: id,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Server-side data fetcher for topics with pagination support
 *
 * @param page - Page number (1-based)
 * @param pageSize - Number of topics per page
 * @returns Promise<TopicsResponse> Paginated topics response
 */
export async function getTopicsPaginated(
  page: number = 1,
  pageSize: number = 15,
): Promise<TopicsResponse> {
  try {
    const searchParams = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    const response = await fetch(
      `${BACKEND_URL}/api/topic/get-topics?${searchParams}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Content-API-Key": VALIDATED_API_KEY,
        },
        next: { revalidate: 300 }, // 5 minutes
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        return { topics: [], total_count: 0 };
      }
      throw new Error(`Failed to fetch topics: ${response.status}`);
    }

    const data = await response.json();

    // Handle backend consistent response format
    const topics = data.data?.topics || data.topics || [];
    const totalCount =
      data.data?.total_count || data.total_count || topics.length;
    const pagination = data.data?.pagination || data.pagination;

    logger.info("Successfully fetched paginated topics from backend", {
      page,
      page_size: pageSize,
      count: topics.length,
      total_count: totalCount,
      cached: response.headers.get("cache-status") === "hit",
    });

    return {
      topics,
      total_count: totalCount,
      pagination,
    };
  } catch (error) {
    logger.error("Failed to fetch paginated topics from backend", {
      page,
      page_size: pageSize,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
