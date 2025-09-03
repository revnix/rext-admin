import type { NextRequest } from "next/server";
import { backendService } from "@/services/backend";
import type { BackendError } from "@/types/backend";
import type { TopicBuilderFormData } from "@/types/topic-builder";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const formData = body.formData as TopicBuilderFormData;

    if (!formData || !formData.industry) {
      return Response.json(
        {
          error: "Invalid request data",
          error_code: "validation_failed",
          details: "Missing required field: industry",
        },
        { status: 400 },
      );
    }

    const result = await backendService.generateTopics(formData);

    return Response.json({
      topics: result.topics,
      request_id: result.request_id,
      generated_at: new Date().toISOString(),
      model_used: result.model_used,
      generation_time_ms: result.generation_time_ms,
    });
  } catch (error) {
    console.error("Topic generation error:", error);

    const backendError = error as BackendError;

    switch (backendError.type) {
      case "server_error":
        return Response.json(
          {
            error: backendError.message,
            error_code: "backend_unavailable",
            fallback_available: false,
          },
          { status: 503 },
        );

      case "configuration_error":
        return Response.json(
          {
            error: backendError.message,
            error_code: "configuration_error",
            fallback_available: false,
          },
          { status: 500 },
        );

      case "parsing_error":
        return Response.json(
          {
            error: backendError.message,
            error_code: "invalid_response",
            fallback_available: false,
          },
          { status: 502 },
        );

      case "timeout_error":
        return Response.json(
          {
            error: "Request timed out",
            error_code: "timeout_error",
            fallback_available: false,
          },
          { status: 504 },
        );

      default:
        return Response.json(
          {
            error: "Failed to generate topics",
            error_code: "generation_failed",
            fallback_available: false,
          },
          { status: 500 },
        );
    }
  }
}
