import { type NextRequest, NextResponse } from "next/server";
import { generateRequestId } from "@/lib/response-utils";
import type { BackendErrorCode } from "@/types/consistent-response";
import { transformTopicsForSaving } from "@/types/schemas";

/**
 * POST /api/topics/save - Save single or multiple topics to the backend
 *
 * Pure consistent response implementation - no legacy compatibility
 * Uses the new backend consistent response format throughout
 *
 * Request formats:
 * - Single: { topic: { title, description, ... } }
 * - Multiple: { topics: [{ title, description, ... }, ...] }
 */
export async function POST(request: NextRequest) {
  // Generate request ID for correlation
  const correlationId = generateRequestId("api_topics_save");

  try {
    const body = await request.json();

    // Determine if this is a single or multiple save operation
    const isBulkSave = body.topics && Array.isArray(body.topics);
    const isSingleSave = body.topic && typeof body.topic === "object";

    if (!isBulkSave && !isSingleSave) {
      // Return consistent error format
      const errorResponse = {
        error:
          "Please provide either 'topic' for single save or 'topics' array for bulk save",
        error_code: "validation_failed" as BackendErrorCode,
        details:
          "Request must contain either 'topic' (single save) or 'topics' array (bulk save)",
        request_id: correlationId,
      };

      return Response.json(errorResponse, {
        status: 422,
        headers: {
          "X-Request-ID": correlationId,
          "Content-Type": "application/json",
        },
      });
    }

    // Convert to consistent array format for backend
    const topics = isBulkSave ? body.topics : [body.topic];

    // Validate each topic structure
    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      if (
        !topic.title ||
        typeof topic.title !== "string" ||
        !topic.title.trim()
      ) {
        const errorResponse = {
          error: isSingleSave
            ? "Topic title is required and cannot be empty"
            : `Topic at position ${i + 1} is missing a valid title`,
          error_code: "missing_required_field" as BackendErrorCode,
          details: isSingleSave
            ? "The 'title' field is required for topic save"
            : `Topic at index ${i} is missing required field: title`,
          request_id: correlationId,
        };

        return Response.json(errorResponse, {
          status: 422,
          headers: {
            "X-Request-ID": correlationId,
            "Content-Type": "application/json",
          },
        });
      }
    }

    // Transform topics for backend format
    const backendTopics = transformTopicsForSaving(topics);

    // Call actual backend API directly
    const backendApiUrl =
      process.env.BACKEND_API_URL || "http://localhost:2024";

    const backendResponse = await fetch(
      `${backendApiUrl}/api/topic/save-topic`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": correlationId,
          "Content-API-Key": process.env.CONTENT_API_KEY || "supersecretapikey",
        },
        body: JSON.stringify({ topics: backendTopics }),
      },
    );

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      const errorResponse = {
        error:
          errorData.error ||
          `Backend API error: ${backendResponse.status} ${backendResponse.statusText}`,
        error_code: "external_service_error" as BackendErrorCode,
        details: errorData.details || `HTTP ${backendResponse.status}`,
        request_id: correlationId,
      };

      return NextResponse.json(errorResponse, {
        status: backendResponse.status,
        headers: {
          "X-Request-ID": correlationId,
          "Content-Type": "application/json",
        },
      });
    }

    const saveData = await backendResponse.json();

    // Extract data from backend consistent response format
    const backendData = saveData.data || {};

    // Create frontend response maintaining the expected API contract
    const response = {
      success: true,
      bulk_save: isBulkSave,
      single_save: isSingleSave,
      total_attempted: topics.length,
      successful_saves: backendData.saved_count || topics.length,
      failed_saves: backendData.failed_topics?.length || 0,
      saved_topic_ids: backendData.saved_topic_ids || [],
      failed_topics: backendData.failed_topics || [],

      // Include single save compatibility fields
      ...(isSingleSave && {
        topic: topics[0],
        message: "Topic saved successfully",
        saved_count: 1,
      }),

      // Metadata
      saved_at: new Date().toISOString(),
      request_id: correlationId,
      processing_time_ms: undefined,
    };

    return Response.json(response, {
      headers: {
        "X-Request-ID": correlationId,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Enhanced error handling for consistent response format
    let errorCode: BackendErrorCode = "unknown_error";
    let errorMessage = "An unexpected error occurred while saving topics";
    let statusCode = 500;
    let errorRequestId = correlationId;

    // Handle various error types
    if (error instanceof Error && "code" in error) {
      const backendError = error as Error & {
        code: BackendErrorCode;
        statusCode?: number;
        requestId?: string;
      };
      errorCode = backendError.code;
      errorMessage = backendError.message;
      statusCode = backendError.statusCode || 500;
      errorRequestId = backendError.requestId || correlationId;

      console.error("Topics save API error:", {
        error_code: errorCode,
        message: errorMessage,
        endpoint: "/api/topics/save",
        correlation_id: correlationId,
      });
    } else {
      // Handle unexpected errors
      console.error("Topics save API error (Unexpected):", {
        error: error instanceof Error ? error.message : String(error),
        endpoint: "/api/topics/save",
        user_agent: request.headers.get("user-agent"),
        correlation_id: correlationId,
      });
    }

    // Return error response

    // Prepare response headers
    const headers: Record<string, string> = {
      "X-Request-ID": errorRequestId,
      "Content-Type": "application/json",
    };

    // Add retry-after header for rate limit errors
    if (errorCode === "api_rate_limit_exceeded") {
      headers["Retry-After"] = "60";
    }

    // Create consistent error response
    const errorResponse = {
      error: errorMessage,
      error_code: errorCode,
      details: errorMessage,
      fallback_available: false,
      retry_after: errorCode === "api_rate_limit_exceeded" ? 60 : undefined,
      request_id: errorRequestId,
    };

    return Response.json(errorResponse, {
      status: statusCode,
      headers,
    });
  }
}
