import { z } from "zod";
import { createSuccessResponse, withApiMiddleware } from "@/lib/api-middleware";
import { requireMethod } from "@/lib/api-utils";
import { logger } from "@/lib/logger";

// Schema for delete request validation
const DeleteTopicsRequestSchema = z.object({
  topic_ids: z.array(z.string()).min(1, "At least one topic ID is required"),
});

export const DELETE = withApiMiddleware(
  async (request, context) => {
    requireMethod(request, "DELETE");

    const body = await request.json();
    const { topic_ids } = DeleteTopicsRequestSchema.parse(body);

    const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:2024";
    const API_KEY = process.env.CONTENT_API_KEY;

    if (!API_KEY) {
      throw new Error("CONTENT_API_KEY environment variable is required");
    }

    try {
      // Forward the request to the backend
      const response = await fetch(`${BACKEND_URL}/api/topic/delete-topic`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "content-api-key": API_KEY,
        },
        body: JSON.stringify({ topic_ids }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Backend error: ${response.status}`,
        );
      }

      const result = await response.json();

      return createSuccessResponse(
        {
          deleted_count: result.deleted_count || topic_ids.length,
          topic_ids: result.deleted_topic_ids || topic_ids,
          message:
            result.message || `Deleted ${topic_ids.length} topics successfully`,
        },
        context.requestId,
        {
          operation: "delete_topics",
          backend_request_id: result.request_id,
        },
      );
    } catch (error) {
      const deleteLogger = logger.forComponent("delete-topics-api");
      deleteLogger.error("Failed to delete topics", {
        topic_ids,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },
  {
    enableLogging: true,
    requestIdPrefix: "delete_topics_api",
  },
);
