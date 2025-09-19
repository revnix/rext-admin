import { z } from "zod";
import {
  createSuccessResponse,
  parseJsonBody,
  withApiMiddleware,
} from "@/lib/api-middleware";
import {
  getCurrentTimestamp,
  getOptionalEnv,
  requireMethod,
} from "@/lib/api-utils";

// Request validation schema
const TopicsGenerateRequestSchema = z.object({
  formData: z.object({
    wizardMode: z.string().optional(),
    industry: z.string().min(1, "Industry is required"),
    industry_other: z.string().optional(),
    audience: z.array(z.string()).optional().default([]),
    purpose: z.array(z.string()).optional().default([]),
    purpose_other: z.string().optional(),
    num_topics: z.number().min(1).max(20).optional().default(5),
    subject: z.string().optional(),
  }),
});

type TopicsGenerateFormData = z.infer<
  typeof TopicsGenerateRequestSchema
>["formData"];

// Backend payload transformation
function transformToBackendPayload(formData: TopicsGenerateFormData) {
  return {
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
    timestamp: getCurrentTimestamp(),
  };
}

// Backend API call with enhanced error handling
async function callBackendApi(payload: unknown, requestId: string) {
  const backendApiUrl = getOptionalEnv(
    "BACKEND_API_URL",
    "http://localhost:2024",
  );
  const apiKey = getOptionalEnv("CONTENT_API_KEY", "supersecretapikey");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await fetch(`${backendApiUrl}/api/topic/generate-topic`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": requestId,
        "Content-API-Key": apiKey,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error ||
          `Backend API error: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Backend request timeout");
    }
    throw error;
  }
}

export const POST = withApiMiddleware(
  async (request, context) => {
    requireMethod(request, "POST");

    // Parse and validate request body
    const { formData } = await parseJsonBody(
      request,
      TopicsGenerateRequestSchema,
    );

    // Transform frontend form data to backend API format
    const backendPayload = transformToBackendPayload(formData);

    // Call backend API
    const result = await callBackendApi(backendPayload, context.requestId);

    // Extract data from backend consistent response format
    const backendData = result.data || {};

    // Transform to maintain current frontend API contract
    const frontendResponse = {
      topics: backendData.topics || [],
      request_id: result.meta?.request_id || context.requestId,
      generated_at: getCurrentTimestamp(),
      model_used: backendData.model_used,
      generation_time_ms: backendData.generation_time_ms,
    };

    return createSuccessResponse(frontendResponse, context.requestId);
  },
  {
    enableLogging: true,
    requestIdPrefix: "topics_generate",
    cors: {
      origin: ["http://localhost:3000", "https://wrext-admin.vercel.app"],
      methods: ["POST"],
      headers: ["Content-Type", "X-Request-ID"],
    },
  },
);
