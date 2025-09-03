import type {
  BackendConfig,
  BackendError,
  BackendTopicGenerationPayload,
  BackendTopicGenerationResponse,
} from "@/types/backend";
import type { TopicBuilderFormData } from "@/types/topic-builder";

/**
 * Backend service class for handling API communications
 */
export class BackendService {
  private readonly config: BackendConfig;

  constructor(config?: Partial<BackendConfig>) {
    this.config = {
      baseUrl: process.env.BACKEND_API_URL || "http://127.0.0.1:2024",
      timeout: 30000,
      retryAttempts: 3,
      ...config,
    };
  }

  /**
   * Generate topics using the backend API
   */
  async generateTopics(
    formData: TopicBuilderFormData,
  ): Promise<BackendTopicGenerationResponse> {
    this.validateConfig();

    try {
      const payload = this.transformFormDataToBackendFormat(formData);
      const response = await this.makeRequest(
        "/api/topic/generate-topic",
        payload,
      );
      return this.validateResponse(response);
    } catch (error) {
      this.logError("Topic generation failed", error);
      throw this.wrapError(error);
    }
  }

  /**
   * Make HTTP request to backend
   */
  private async makeRequest(
    endpoint: string,
    payload: BackendTopicGenerationPayload,
  ): Promise<Response> {
    const url = `${this.config.baseUrl}${endpoint}`;

    console.log("Calling backend API:", url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Transform frontend form data to backend API format
   */
  private transformFormDataToBackendFormat(
    formData: TopicBuilderFormData,
  ): BackendTopicGenerationPayload {
    return {
      industry: formData.industry_other || formData.industry,
      subject: formData.subject,
      content_type: formData.content_type_other || formData.content_type,
      platform: formData.platform_other || formData.platform,
      audience: formData.audience,
      purpose: formData.purpose,
      tone: formData.tone,
      keywords: formData.keywords,
      exclude: formData.exclude,
      num_ideas: formData.num_ideas,
      industry_specific_focus: formData.focus,
      additional_notes: formData.notes,
      content_timing_preference: formData.fresh_vs_evergreen,
      content_originality_preference: formData.safe_vs_original,
      demographic_location: Array.isArray(formData.demographic_location)
        ? [formData.demographic_location].flat()
        : [formData.demographic_location],
      timestamp: new Date().toISOString(),
      wizard_mode: formData.wizardMode,
    };
  }

  /**
   * Validate backend response
   */
  private async validateResponse(
    response: Response,
  ): Promise<BackendTopicGenerationResponse> {
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(
        `Backend API error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const result = await response.json();

    if (!result.topics || !Array.isArray(result.topics)) {
      throw new Error("Invalid response format from backend API");
    }

    console.log(
      `Successfully generated ${result.topics.length} topics in ${result.generation_time_ms || "unknown"}ms`,
    );

    return {
      topics: result.topics,
      request_id: result.request_id || `req_${Date.now()}`,
      model_used: result.model_used,
      generation_time_ms: result.generation_time_ms,
    };
  }

  /**
   * Validate backend configuration
   */
  private validateConfig(): void {
    if (!this.config.baseUrl) {
      throw new Error("Backend API URL is not configured");
    }
  }

  /**
   * Wrap errors with structured error information
   */
  private wrapError(error: unknown): BackendError {
    if (error instanceof Error) {
      if (error.message.includes("Backend API error:")) {
        return {
          type: "server_error",
          message: "Backend service is currently unavailable",
          originalError: error,
        };
      }

      if (error.message.includes("Backend API URL")) {
        return {
          type: "configuration_error",
          message: "Service configuration error",
          originalError: error,
        };
      }

      if (error.message.includes("Invalid response format")) {
        return {
          type: "parsing_error",
          message: "Backend returned invalid data",
          originalError: error,
        };
      }

      if (error.name === "AbortError") {
        return {
          type: "timeout_error",
          message: "Request timed out",
          originalError: error,
        };
      }

      return {
        type: "network_error",
        message: error.message,
        originalError: error,
      };
    }

    return {
      type: "network_error",
      message: "An unknown error occurred",
      originalError: error instanceof Error ? error : new Error(String(error)),
    };
  }

  /**
   * Log errors without exposing sensitive information
   */
  private logError(context: string, error: unknown): void {
    console.error(`[BackendService] ${context}:`, error);
  }
}

/**
 * Default backend service instance
 */
export const backendService = new BackendService();

/**
 * Legacy function for backward compatibility
 * @deprecated Use backendService.generateTopics() instead
 */
export async function generateTopicsWithBackend(
  formData: TopicBuilderFormData,
): Promise<BackendTopicGenerationResponse> {
  return backendService.generateTopics(formData);
}
