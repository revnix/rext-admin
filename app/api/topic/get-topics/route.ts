import type { NextRequest } from "next/server";
import { classifyError, sanitizeErrorForLogging } from "@/lib/error-utils";
import { backendService } from "@/services/backend";
import type { APIErrorResponse, BackendError } from "@/types/backend";

export async function GET(request: NextRequest) {
  try {
    const result = await backendService.getTopics();

    return Response.json({
      topics: result.topics,
      total_count: result.total_count,
    });
  } catch (error) {
    const classifiedError =
      error && typeof error === "object" && "type" in error
        ? (error as BackendError)
        : classifyError(error);

    const sanitizedError = sanitizeErrorForLogging(classifiedError);
    const userAgent =
      request.headers.get("user-agent") || request.headers.get("User-Agent");
    const requestId =
      request.headers.get("x-request-id") ||
      request.headers.get("X-Request-ID");

    console.error("Topic get API error:", {
      ...sanitizedError,
      endpoint: "/api/topic/get-topics",
      userAgent,
      requestId,
    });

    const statusCodeMap: Record<string, number> = {
      validation_error: 400,
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
    const headers: Record<string, string> = {};
    if (classifiedError.type === "rate_limit_error") {
      headers["Retry-After"] = "60";
    }

    const errorResponse: APIErrorResponse = {
      error: classifiedError.message,
      error_code: classifiedError.type,
      details: classifiedError.technicalMessage,
      fallback_available: false,
      retry_after: classifiedError.type === "rate_limit_error" ? 60 : undefined,
      request_id: classifiedError.requestId,
    };

    return Response.json(errorResponse, {
      status: statusCode,
      headers,
    });
  }
}
