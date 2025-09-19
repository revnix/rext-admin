import { type NextRequest, NextResponse } from "next/server";
import { generateRequestId, isBackendServiceError } from "@/lib/response-utils";
import type { BackendErrorCode } from "@/types/consistent-response";

/**
 * GET /api/topics - Fetch all topics from backend
 *
 * Pure consistent response implementation - no legacy compatibility
 * Uses the new backend consistent response format throughout
 */
export async function GET(request: NextRequest) {
  // Generate request ID for correlation
  const correlationId = generateRequestId("api_topics_get");

  try {
    // Call actual backend API directly
    const backendApiUrl =
      process.env.BACKEND_API_URL || "http://localhost:2024";

    const backendResponse = await fetch(
      `${backendApiUrl}/api/topic/get-topics`,
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

    const topicsData = await backendResponse.json();

    // Extract data from backend consistent response format
    const backendData = topicsData.data || {};

    // Create frontend response maintaining the expected API contract
    const response = {
      topics: backendData.topics || [],
      total_count: backendData.total_count || 0,

      // Add pagination metadata if available
      ...(backendData.pagination && {
        pagination: backendData.pagination,
      }),

      // Metadata
      fetched_at: new Date().toISOString(),
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
    let errorMessage = "An unexpected error occurred while fetching topics";
    let statusCode = 500;
    let errorRequestId = correlationId;

    // Handle various error types
    if (isBackendServiceError(error)) {
      errorCode = error.code;
      errorMessage = error.message;
      statusCode = error.statusCode || 500;
      errorRequestId = error.requestId || correlationId;

      console.error("Topics get API error:", {
        error_code: errorCode,
        message: errorMessage,
        endpoint: "/api/topics",
        correlation_id: correlationId,
      });
    } else if (error instanceof Error) {
      errorMessage = error.message;

      console.error("Topics get API error (Unexpected):", {
        error: error.message,
        endpoint: "/api/topics",
        user_agent: request.headers.get("user-agent"),
        correlation_id: correlationId,
      });
    } else {
      // Handle non-Error throwables
      console.error("Topics get API error (Unexpected):", {
        error: String(error),
        endpoint: "/api/topics",
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

    // Create consistent error response with fallback data
    const errorResponse = {
      error: errorMessage,
      error_code: errorCode,
      details: errorMessage,
      topics: [], // Provide empty array as fallback
      total_count: 0, // Provide 0 as fallback
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
