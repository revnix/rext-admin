import { type NextRequest, NextResponse } from "next/server";
import { classifyError, sanitizeErrorForLogging } from "@/lib/error-utils";
import type { APIErrorResponse, BackendError } from "@/types/backend";

/**
 * DELETE /api/topics/delete - Delete topics from backend
 *
 * This API route acts as a proxy to the backend service, handling authentication
 * server-side to keep the CONTENT_API_KEY secure.
 *
 * Expected request body:
 * { "topic_ids": ["topic_id_1", "topic_id_2", ...] }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request structure
    if (!body.topic_ids || !Array.isArray(body.topic_ids)) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          error_code: "validation_failed",
          details:
            "Request must contain 'topic_ids' array with topic IDs to delete",
        },
        { status: 400 },
      );
    }

    if (body.topic_ids.length === 0) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          error_code: "validation_failed",
          details: "topic_ids array cannot be empty",
        },
        { status: 400 },
      );
    }

    // Validate each topic_id is a string
    for (let i = 0; i < body.topic_ids.length; i++) {
      const topicId = body.topic_ids[i];
      if (!topicId || typeof topicId !== "string") {
        return NextResponse.json(
          {
            error: "Invalid request data",
            error_code: "validation_failed",
            details: `Invalid topic ID at index ${i}. All topic IDs must be non-empty strings.`,
          },
          { status: 400 },
        );
      }
    }

    const contentApiKey = process.env.CONTENT_API_KEY;
    const backendUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:2024";

    if (!contentApiKey) {
      console.error("CONTENT_API_KEY environment variable is not set");
      return NextResponse.json(
        {
          error: "Server configuration error",
          error_code: "configuration_error",
          details: "API key not configured",
        },
        { status: 500 },
      );
    }

    if (!backendUrl) {
      console.error("BACKEND_API_URL environment variable is not set");
      return NextResponse.json(
        {
          error: "Server configuration error",
          error_code: "configuration_error",
          details: "Backend URL not configured",
        },
        { status: 500 },
      );
    }

    // Use the same backend URL pattern as other working endpoints
    const deleteEndpoint = `${backendUrl}/api/topic/delete-topic`;

    console.log(
      "Deleting topics from backend:",
      deleteEndpoint,
      "Topic IDs:",
      body.topic_ids,
      "Backend URL:",
      backendUrl,
    );

    let response = await fetch(deleteEndpoint, {
      method: "DELETE", // Try DELETE method first
      headers: {
        "Content-Type": "application/json",
        "content-api-key": contentApiKey,
        "X-Request-ID": `req_${Date.now()}`,
      },
      body: JSON.stringify({
        topic_ids: body.topic_ids,
      }),
    });

    // If DELETE method returns 404, try POST method as fallback
    if (!response.ok && response.status === 404) {
      console.log("DELETE method failed with 404, trying POST method...");
      response = await fetch(deleteEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "content-api-key": contentApiKey,
          "X-Request-ID": `req_${Date.now()}`,
        },
        body: JSON.stringify({
          topic_ids: body.topic_ids,
        }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(
        "Backend API error:",
        response.status,
        response.statusText,
        errorText,
      );

      return NextResponse.json(
        {
          error: `Backend API error: ${response.status} ${response.statusText}`,
          error_code: "backend_error",
          details: errorText,
        },
        { status: response.status },
      );
    }

    const data = await response.json();

    console.log("Successfully deleted topics:", {
      requested_ids: body.topic_ids,
      response: data,
    });

    return NextResponse.json({
      success: true,
      message:
        data.message ||
        `Successfully deleted ${body.topic_ids.length} topic(s)`,
      deleted_count: body.topic_ids.length,
      topic_ids: body.topic_ids,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Classify and log error safely
    const isBackendError =
      error &&
      typeof error === "object" &&
      "type" in error &&
      "message" in error;

    const classifiedError: BackendError = isBackendError
      ? (error as BackendError)
      : classifyError(error);

    // Log error for debugging without sensitive data
    const sanitizedError = sanitizeErrorForLogging(classifiedError);
    const userAgent =
      request.headers.get("user-agent") || request.headers.get("User-Agent");
    const requestId =
      request.headers.get("x-request-id") ||
      request.headers.get("X-Request-ID");

    console.error("Topics delete API error:", {
      ...sanitizedError,
      endpoint: "/api/topics/delete",
      userAgent,
      requestId,
    });

    // Map error types to HTTP status codes
    const statusCodeMap: Record<string, number> = {
      validation_error: 422,
      authentication_error: 401,
      rate_limit_error: 429,
      server_error: 503,
      configuration_error: 500,
      parsing_error: 502,
      timeout_error: 504,
      network_error: 503,
      cors_error: 500,
      abort_error: 499,
      unknown_error: 500,
    };

    const statusCode = statusCodeMap[classifiedError.type] || 500;

    // Add retry-after header for rate limit errors
    const headers: Record<string, string> = {};
    if (classifiedError.type === "rate_limit_error") {
      headers["Retry-After"] = "60"; // Suggest waiting 60 seconds
    }

    const errorResponse: APIErrorResponse = {
      error: classifiedError.message,
      error_code: classifiedError.type,
      details: classifiedError.technicalMessage,
      fallback_available: false,
      retry_after: classifiedError.type === "rate_limit_error" ? 60 : undefined,
      request_id: classifiedError.requestId,
    };

    return NextResponse.json(errorResponse, {
      status: statusCode,
      headers,
    });
  }
}
