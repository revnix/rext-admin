import { type NextRequest, NextResponse } from "next/server";
import { generateRequestId } from "@/lib/response-utils";
import type { BackendErrorCode } from "@/types/consistent-response";

/**
 * DELETE /api/topics/delete - Delete topics from backend
 *
 * Pure consistent response implementation - no legacy compatibility
 * Uses the new backend consistent response format throughout
 *
 * Expected request body:
 * { "topic_ids": ["topic_id_1", "topic_id_2", ...] }
 */
export async function DELETE(request: NextRequest) {
  // Generate request ID for correlation
  const correlationId = generateRequestId("api_topics_delete");

  try {
    const body = await request.json();

    // Validate request structure
    if (!body.topic_ids || !Array.isArray(body.topic_ids)) {
      const errorResponse = {
        error: "Please provide an array of topic IDs to delete",
        error_code: "validation_failed" as BackendErrorCode,
        details:
          "Request must contain 'topic_ids' array with topic IDs to delete",
        request_id: correlationId,
      };

      return NextResponse.json(errorResponse, {
        status: 422,
        headers: {
          "X-Request-ID": correlationId,
          "Content-Type": "application/json",
        },
      });
    }

    // Validate topic IDs
    if (body.topic_ids.length === 0) {
      const errorResponse = {
        error: "At least one topic ID is required for deletion",
        error_code: "validation_failed" as BackendErrorCode,
        details: "The 'topic_ids' array cannot be empty",
        request_id: correlationId,
      };

      return NextResponse.json(errorResponse, {
        status: 422,
        headers: {
          "X-Request-ID": correlationId,
          "Content-Type": "application/json",
        },
      });
    }

    // Validate each topic ID
    for (let i = 0; i < body.topic_ids.length; i++) {
      const topicId = body.topic_ids[i];
      if (!topicId || typeof topicId !== "string" || !topicId.trim()) {
        const errorResponse = {
          error: `Invalid topic ID at position ${i + 1}`,
          error_code: "invalid_value" as BackendErrorCode,
          details: `Topic ID at index ${i} must be a non-empty string`,
          request_id: correlationId,
        };

        return NextResponse.json(errorResponse, {
          status: 422,
          headers: {
            "X-Request-ID": correlationId,
            "Content-Type": "application/json",
          },
        });
      }
    }

    // Call actual backend API directly
    const backendApiUrl =
      process.env.BACKEND_API_URL || "http://localhost:2024";

    const backendResponse = await fetch(
      `${backendApiUrl}/api/topic/delete-topic`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": correlationId,
          "Content-API-Key": process.env.CONTENT_API_KEY || "supersecretapikey",
        },
        body: JSON.stringify({ topic_ids: body.topic_ids }),
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

    const deleteData = await backendResponse.json();

    // Extract data from backend consistent response format
    const backendData = deleteData.data || {};

    // Create frontend response maintaining the expected API contract
    const response = {
      success: true,
      total_requested: body.topic_ids.length,
      deleted_count: backendData.deleted_count || 0,
      failed_count: backendData.failed_deletions?.length || 0,
      deleted_topic_ids: backendData.deleted_topic_ids || [],
      failed_deletions: backendData.failed_deletions || [],

      // Metadata
      deleted_at: new Date().toISOString(),
      request_id: correlationId,
      processing_time_ms: undefined,
    };

    return NextResponse.json(response, {
      headers: {
        "X-Request-ID": correlationId,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Enhanced error handling for consistent response format
    let errorCode: BackendErrorCode = "unknown_error";
    let errorMessage = "An unexpected error occurred while deleting topics";
    let statusCode = 500;
    let errorRequestId = correlationId;

    // Handle various error types
    if (error instanceof Error && "code" in error) {
      const backendError = error as any;
      errorCode = backendError.code;
      errorMessage = backendError.message;
      statusCode = backendError.statusCode || 500;
      errorRequestId = backendError.requestId || correlationId;

      console.error("Topics delete API error:", {
        error_code: errorCode,
        message: errorMessage,
        endpoint: "/api/topics/delete",
        correlation_id: correlationId,
      });
    } else {
      // Handle unexpected errors
      console.error("Topics delete API error (Unexpected):", {
        error: error instanceof Error ? error.message : String(error),
        endpoint: "/api/topics/delete",
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
      details: "An error occurred while deleting topics",
      fallback_available: false,
      retry_after: errorCode === "api_rate_limit_exceeded" ? 60 : undefined,
      request_id: errorRequestId,
    };

    return NextResponse.json(errorResponse, {
      status: statusCode,
      headers,
    });
  }
}
