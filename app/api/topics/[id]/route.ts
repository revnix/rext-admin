import { type NextRequest, NextResponse } from "next/server";
import { generateRequestId } from "@/lib/response-utils";
import type { BackendErrorCode } from "@/types/consistent-response";

/**
 * GET /api/topics/[id] - Get single topic details from backend
 *
 * Pure consistent response implementation for single topic retrieval
 * Proxies requests to backend GET /api/topic/get-topic/{topic_id}
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Generate request ID for correlation
  const correlationId = generateRequestId("api_topics_get");
  let topicId: string | undefined;

  try {
    const resolvedParams = await params;
    topicId = resolvedParams.id;

    // Validate topic ID parameter
    if (!topicId || typeof topicId !== "string" || !topicId.trim()) {
      const errorResponse = {
        error: "Topic ID is required and cannot be empty",
        error_code: "missing_required_field" as BackendErrorCode,
        details: "The topic ID parameter is required for topic retrieval",
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

    // Call backend API directly
    const backendApiUrl =
      process.env.BACKEND_API_URL || "http://localhost:2024";

    const backendResponse = await fetch(
      `${backendApiUrl}/api/topic/get-topic/${encodeURIComponent(topicId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": correlationId,
          "Content-API-Key": process.env.CONTENT_API_KEY || "supersecretapikey",
        },
      },
    );

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));

      // Handle specific error codes from backend
      let frontendErrorCode: BackendErrorCode = "external_service_error";
      if (backendResponse.status === 404) {
        frontendErrorCode = "resource_not_found";
      } else if (
        backendResponse.status === 401 ||
        backendResponse.status === 403
      ) {
        frontendErrorCode = "authentication_required";
      } else if (backendResponse.status >= 500) {
        frontendErrorCode = "external_service_error";
      }

      const errorResponse = {
        error:
          errorData.error ||
          `Backend API error: ${backendResponse.status} ${backendResponse.statusText}`,
        error_code: frontendErrorCode,
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

    const topicData = await backendResponse.json();

    // Extract data from backend consistent response format
    const backendTopicData = topicData.data || {};

    // Return the topic data in consistent response format
    const response = {
      success: true,
      topic: backendTopicData,
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
    let errorMessage = "An unexpected error occurred while retrieving topic";
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

      console.error("Topic get API error:", {
        error_code: errorCode,
        message: errorMessage,
        endpoint: "/api/topics/[id]",
        topic_id: topicId,
        correlation_id: correlationId,
      });
    } else {
      // Handle unexpected errors
      console.error("Topic get API error (Unexpected):", {
        error: error instanceof Error ? error.message : String(error),
        endpoint: "/api/topics/[id]",
        topic_id: topicId,
        user_agent: request.headers.get("user-agent"),
        correlation_id: correlationId,
      });
    }

    // Create consistent error response
    const errorResponse = {
      error: errorMessage,
      error_code: errorCode,
      details: errorMessage,
      fallback_available: false,
      request_id: errorRequestId,
    };

    return Response.json(errorResponse, {
      status: statusCode,
      headers: {
        "X-Request-ID": errorRequestId,
        "Content-Type": "application/json",
      },
    });
  }
}
