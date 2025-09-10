import type { NextRequest } from "next/server";
import { classifyError, sanitizeErrorForLogging } from "@/lib/error-utils";
import { backendService } from "@/services/backend";
import type { APIErrorResponse, BackendError } from "@/types/backend";

/**
 * POST /api/topics/save - Save single or multiple topics to the backend
 *
 * This API route acts as a proxy to the backend service, handling authentication
 * server-side to keep the CONTENT_API_KEY secure.
 *
 * Supports both single topic and bulk save operations:
 * - Single: { topic: { title, description, ... } }
 * - Multiple: { topics: [{ title, description, ... }, ...] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Determine if this is a single or multiple save operation
    const isBulkSave = body.topics && Array.isArray(body.topics);
    const isSingleSave = body.topic && typeof body.topic === "object";

    if (!isBulkSave && !isSingleSave) {
      return Response.json(
        {
          error: "Invalid request data",
          error_code: "validation_failed",
          details:
            "Request must contain either 'topic' (single save) or 'topics' array (bulk save)",
        },
        { status: 400 },
      );
    }

    if (isBulkSave) {
      // Bulk save operation
      const topics = body.topics;

      // Validate each topic
      for (let i = 0; i < topics.length; i++) {
        const topic = topics[i];
        if (!topic.title) {
          return Response.json(
            {
              error: "Invalid request data",
              error_code: "validation_failed",
              details: `Topic at index ${i} is missing required field: title is required`,
            },
            { status: 400 },
          );
        }
      }

      // Save all topics (assuming backend service supports bulk save)
      const results: Array<{
        index: number;
        success: boolean;
        topic: unknown;
        message: string;
      }> = [];
      const errors: Array<{
        index: number;
        success: boolean;
        error: string;
        topic: unknown;
      }> = [];

      // Use bulk save method for better performance
      try {
        const result = await backendService.saveTopics(topics);

        // Process the bulk result
        if (result.saved_count > 0) {
          topics.forEach((topic: unknown, i: number) => {
            results.push({
              index: i,
              success: true,
              topic: topic, // Backend doesn't return individual saved topics
              message: "Saved successfully",
            });
          });
        }
      } catch (error) {
        // If bulk save fails, mark all as failed
        topics.forEach((topic: unknown, i: number) => {
          errors.push({
            index: i,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            topic: topic,
          });
        });
      }

      return Response.json({
        success: errors.length === 0,
        bulk_save: true,
        total_attempted: topics.length,
        successful_saves: results.length,
        failed_saves: errors.length,
        results: results,
        errors: errors.length > 0 ? errors : undefined,
        saved_at: new Date().toISOString(),
      });
    } else {
      // Single save operation
      const topic = body.topic;

      if (!topic.title) {
        return Response.json(
          {
            error: "Invalid request data",
            error_code: "validation_failed",
            details: "Missing required field: topic.title is required",
          },
          { status: 400 },
        );
      }

      const result = await backendService.saveTopics([topic]);

      return Response.json({
        success: true,
        bulk_save: false,
        topic: topic, // Backend doesn't return individual saved topics
        message:
          result.saved_count > 0
            ? "Topic saved successfully"
            : "Failed to save topic",
        saved_at: new Date().toISOString(),
      });
    }
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

    console.error("Topics save API error:", {
      ...sanitizedError,
      endpoint: "/api/topics/save",
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

    return Response.json(errorResponse, {
      status: statusCode,
      headers,
    });
  }
}
