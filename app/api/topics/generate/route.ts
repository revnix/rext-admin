import { type NextRequest, NextResponse } from "next/server";
import { generateRequestId, isBackendServiceError } from "@/lib/response-utils";
import type { BackendErrorCode } from "@/types/consistent-response";
import type { TopicBuilderFormData } from "@/types/topic-builder";

export async function POST(request: NextRequest) {
  // Generate request ID for correlation
  const correlationId = generateRequestId("api_topics_generate");

  try {
    const body = await request.json();
    const formData = body.formData as TopicBuilderFormData;

    if (!formData || !formData.industry || !formData.industry.trim()) {
      // Return consistent error format mapped to frontend expectations
      const errorResponse = {
        error: "Invalid request data",
        error_code: "validation_failed" as BackendErrorCode,
        details: "Missing required field: industry",
        request_id: correlationId,
      };

      return Response.json(errorResponse, {
        status: 400,
        headers: {
          "X-Request-ID": correlationId,
          "Content-Type": "application/json",
        },
      });
    }

    // Transform frontend form data to backend API format
    const backendPayload = {
      wizardMode: formData.wizardMode || "industry-first",
      industry: formData.industry_other || formData.industry || "",
      industry_other: formData.industry_other || null,
      audience:
        Array.isArray(formData.audience) && formData.audience.length > 0
          ? formData.audience
          : [],
      purpose: Array.isArray(formData.purpose) ? formData.purpose : [],
      purpose_other: formData.purpose_other || null,
      num_topics: formData.num_topics || 5,
      subject: formData.subject || null,
      timestamp: new Date().toISOString(),
    };

    // Call actual backend API directly
    const backendApiUrl =
      process.env.BACKEND_API_URL || "http://localhost:2024";

    const backendResponse = await fetch(
      `${backendApiUrl}/api/topic/generate-topic`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": correlationId,
          "Content-API-Key": process.env.CONTENT_API_KEY || "supersecretapikey",
        },
        body: JSON.stringify(backendPayload),
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

    const result = await backendResponse.json();

    // Extract data from backend consistent response format
    const backendData = result.data || {};

    // Transform to maintain current frontend API contract
    const frontendResponse = {
      topics: backendData.topics || [],
      request_id: result.meta?.request_id || correlationId,
      generated_at: new Date().toISOString(),
      model_used: backendData.model_used,
      generation_time_ms: backendData.generation_time_ms,
    };

    return Response.json(frontendResponse, {
      headers: {
        "X-Request-ID": result.meta?.request_id || correlationId,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Enhanced error handling with consistent response format support
    let errorCode: BackendErrorCode = "unknown_error";
    let errorMessage = "An unexpected error occurred";
    let statusCode = 500;
    let errorRequestId = correlationId;

    // Check if it's a BackendServiceError from the new consistent response system
    if (isBackendServiceError(error)) {
      errorCode = error.code;
      errorMessage = error.message;
      statusCode = error.statusCode || 500;
      errorRequestId = error.requestId || correlationId;

      console.error("Topics generation API error:", {
        error_code: errorCode,
        message: errorMessage,
        endpoint: "/api/topics/generate",
        correlation_id: correlationId,
      });
    } else if (error instanceof Error) {
      errorMessage = error.message;

      console.error("Topics generation API error (Unexpected):", {
        error: error.message,
        endpoint: "/api/topics/generate",
        correlation_id: correlationId,
      });
    } else {
      // Handle non-Error throwables
      console.error("Topics generation API error (Unexpected):", {
        error: String(error),
        endpoint: "/api/topics/generate",
        correlation_id: correlationId,
      });
    }

    // Return error response

    // Determine if fallback behavior is available
    const fallbackAvailable = false; // Currently no offline fallback for topics generation

    // Prepare response headers
    const headers: Record<string, string> = {
      "X-Request-ID": errorRequestId,
      "Content-Type": "application/json",
    };

    // Add retry-after header for rate limit errors
    if (errorCode === "api_rate_limit_exceeded") {
      headers["Retry-After"] = "60"; // Suggest waiting 60 seconds
    }

    // Create error response that maintains frontend compatibility
    const errorResponse = {
      error: errorMessage,
      error_code: errorCode,
      details: errorMessage,
      fallback_available: fallbackAvailable,
      retry_after: errorCode === "api_rate_limit_exceeded" ? 60 : undefined,
      request_id: errorRequestId,
    };

    return Response.json(errorResponse, {
      status: statusCode,
      headers,
    });
  }
}
