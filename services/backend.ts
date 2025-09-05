import {
  calculateRetryDelay,
  classifyError,
  DEFAULT_RETRY_CONFIG,
  generateRequestId,
  sanitizeErrorForLogging,
  shouldRetry,
} from "@/lib/error-utils";
import type {
  BackendConfig,
  BackendError,
  BackendTopicGenerationPayload,
  BackendTopicGenerationResponse,
  GetTopicsResponse,
  SaveTopicRequest,
  SaveTopicResponse,
} from "@/types/backend";
import type {
  GeneratedTopic,
  TopicBuilderFormData,
} from "@/types/topic-builder";

/**
 * Backend service class for handling API communications with comprehensive error handling
 */
export class BackendService {
  private readonly config: BackendConfig;
  private readonly activeRequests = new Map<string, AbortController>();
  private readonly requestDeduplicationMap = new Map<
    string,
    Promise<BackendTopicGenerationResponse>
  >();

  constructor(config?: Partial<BackendConfig>) {
    this.config = {
      baseUrl: process.env.BACKEND_API_URL || "http://127.0.0.1:2024",
      timeout: 30000,
      retry: DEFAULT_RETRY_CONFIG,
      enableDeduplication: true,
      healthCheckEndpoint: "/health",
      enableOfflineDetection: true,
      ...config,
    };
  }

  /**
   * Generate topics using the backend API with retry logic
   */
  async generateTopics(
    formData: TopicBuilderFormData,
  ): Promise<BackendTopicGenerationResponse> {
    this.validateConfig();

    const requestId = generateRequestId();
    const payload = this.transformFormDataToBackendFormat(formData);

    // Request deduplication based on form data
    if (this.config.enableDeduplication) {
      const dedupeKey = this.createDeduplicationKey(payload);
      const existingRequest = this.requestDeduplicationMap.get(dedupeKey);
      if (existingRequest) {
        console.log("Using deduplicated request for:", requestId);
        return existingRequest;
      }

      const requestPromise = this.executeWithRetry(
        "/api/topic/generate-topic",
        payload,
        requestId,
      );

      this.requestDeduplicationMap.set(dedupeKey, requestPromise);

      // Clean up deduplication map after request completes
      requestPromise
        .then(() => {
          this.requestDeduplicationMap.delete(dedupeKey);
        })
        .catch(() => {
          this.requestDeduplicationMap.delete(dedupeKey);
        });

      return requestPromise;
    }

    return this.executeWithRetry(
      "/api/topic/generate-topic",
      payload,
      requestId,
    );
  }

  /**
   * Save topics to the backend API
   */
  async saveTopics(topics: GeneratedTopic[]): Promise<SaveTopicResponse> {
    this.validateConfig();

    const requestId = generateRequestId();
    const payload: SaveTopicRequest = { topics };

    return this.executeWithRetryGeneric(
      "/api/topic/save-topic",
      payload,
      requestId,
      "POST",
    ) as Promise<SaveTopicResponse>;
  }

  /**
   * Get all saved topics from the backend API
   */
  async getTopics(): Promise<GetTopicsResponse> {
    this.validateConfig();

    const requestId = generateRequestId();

    return this.makeGetRequest("/api/topic/get-topics", requestId);
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry(
    endpoint: string,
    payload: BackendTopicGenerationPayload,
    requestId: string,
  ): Promise<BackendTopicGenerationResponse> {
    let lastError: BackendError | null = null;

    for (let attempt = 1; attempt <= this.config.retry.maxAttempts; attempt++) {
      try {
        console.log(
          `[${requestId}] Attempt ${attempt}/${this.config.retry.maxAttempts}`,
        );

        const response = await this.makeRequest(endpoint, payload, requestId);
        const result = await this.validateResponse(response);

        // Success - clean up any stored controllers
        this.activeRequests.delete(requestId);
        return result;
      } catch (error) {
        const classifiedError = classifyError(error, requestId, attempt);
        lastError = classifiedError;

        this.logError(
          `Attempt ${attempt} failed for ${requestId}`,
          classifiedError,
        );

        // Don't retry if error is not retryable or we've reached max attempts
        if (!shouldRetry(classifiedError, attempt, this.config.retry)) {
          break;
        }

        // Wait before retrying (except on last attempt)
        if (attempt < this.config.retry.maxAttempts) {
          const delay = calculateRetryDelay(attempt, this.config.retry);
          console.log(`[${requestId}] Waiting ${delay}ms before retry`);
          await this.delay(delay);
        }
      }
    }

    // Clean up and throw the last error
    this.activeRequests.delete(requestId);
    throw (
      lastError || classifyError(new Error("Unknown retry failure"), requestId)
    );
  }

  /**
   * Make HTTP request to backend with abort support
   */
  private async makeRequest(
    endpoint: string,
    payload: BackendTopicGenerationPayload,
    requestId: string,
  ): Promise<Response> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const controller = new AbortController();

    // Store controller for potential cancellation
    this.activeRequests.set(requestId, controller);

    // Set up timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
      this.activeRequests.delete(requestId);
    }, this.config.timeout);

    try {
      const contentApiKey = process.env.CONTENT_API_KEY;
      if (!contentApiKey) {
        throw new Error("CONTENT_API_KEY environment variable is not set");
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
          "content-api-key": contentApiKey,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      this.activeRequests.delete(requestId);
      throw error;
    }
  }

  /**
   * Transform frontend form data to backend API format
   */
  private transformFormDataToBackendFormat(
    formData: TopicBuilderFormData,
  ): BackendTopicGenerationPayload {
    // Transform to exact Pydantic schema format
    return {
      wizardMode: formData.wizardMode || "industry-first",
      industry: formData.industry_other || formData.industry || "",
      industry_other: formData.industry_other || null,
      industry_specific_focus: formData.focus || null,
      content_type: formData.content_type_other || formData.content_type || "",
      content_type_other: formData.content_type_other || null,
      platform: formData.platform_other || formData.platform || null,
      platform_other: formData.platform_other || null,
      audience:
        Array.isArray(formData.audience) && formData.audience.length > 0
          ? formData.audience.join(", ")
          : "",
      reader_level: formData.reader_level || "",
      audience_size: formData.audience_size || "",
      demographic_age: Array.isArray(formData.demographic_age)
        ? formData.demographic_age.filter(Boolean)
        : formData.demographic_age
          ? [formData.demographic_age]
          : [],
      demographic_location: Array.isArray(formData.demographic_location)
        ? formData.demographic_location.filter(Boolean)
        : formData.demographic_location
          ? [formData.demographic_location]
          : [],
      purpose: Array.isArray(formData.purpose) ? formData.purpose : [],
      purpose_other: formData.purpose_other || null,
      content_goal: Array.isArray(formData.content_goal)
        ? formData.content_goal
        : [],
      tone: Array.isArray(formData.tone) ? formData.tone : [],
      tone_other: formData.tone_other || null,
      keywords: formData.keywords || null,
      notes: formData.notes || null,
      additional_notes: formData.notes || null,
      num_ideas: formData.num_ideas || 5,
      region: formData.region || null,
      language: formData.language || "english",
      content_timing_preference: formData.fresh_vs_evergreen || null,
      content_originality_preference: formData.safe_vs_original || null,
      fresh_vs_evergreen: formData.fresh_vs_evergreen || null,
      safe_vs_original: formData.safe_vs_original || null,
      exclude: formData.exclude || null,
      focus: formData.focus || null,
      subject: formData.subject || null,
      timestamp: new Date().toISOString(),
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
   * Execute request with retry logic for generic payloads
   */
  private async executeWithRetryGeneric<T, R>(
    endpoint: string,
    payload: T,
    requestId: string,
    method: "POST" | "PUT" = "POST",
  ): Promise<R> {
    let lastError: BackendError | null = null;

    for (let attempt = 1; attempt <= this.config.retry.maxAttempts; attempt++) {
      try {
        console.log(
          `[${requestId}] Attempt ${attempt}/${this.config.retry.maxAttempts}`,
        );

        const response = await this.makeGenericRequest(
          endpoint,
          payload,
          requestId,
          method,
        );
        const result = await this.validateGenericResponse<R>(response);

        // Success - clean up any stored controllers
        this.activeRequests.delete(requestId);
        return result;
      } catch (error) {
        const classifiedError = classifyError(error, requestId, attempt);
        lastError = classifiedError;

        this.logError(
          `Attempt ${attempt} failed for ${requestId}`,
          classifiedError,
        );

        // Don't retry if error is not retryable or we've reached max attempts
        if (!shouldRetry(classifiedError, attempt, this.config.retry)) {
          break;
        }

        // Wait before retrying (except on last attempt)
        if (attempt < this.config.retry.maxAttempts) {
          const delay = calculateRetryDelay(attempt, this.config.retry);
          console.log(`[${requestId}] Waiting ${delay}ms before retry`);
          await this.delay(delay);
        }
      }
    }

    // Clean up and throw the last error
    this.activeRequests.delete(requestId);
    throw (
      lastError || classifyError(new Error("Unknown retry failure"), requestId)
    );
  }

  /**
   * Make HTTP request for generic payloads
   */
  private async makeGenericRequest<T>(
    endpoint: string,
    payload: T,
    requestId: string,
    method: "POST" | "PUT" = "POST",
  ): Promise<Response> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const controller = new AbortController();

    // Store controller for potential cancellation
    this.activeRequests.set(requestId, controller);

    // Set up timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
      this.activeRequests.delete(requestId);
    }, this.config.timeout);

    try {
      const contentApiKey = process.env.CONTENT_API_KEY;
      if (!contentApiKey) {
        throw new Error("CONTENT_API_KEY environment variable is not set");
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
          "content-api-key": contentApiKey,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      this.activeRequests.delete(requestId);
      throw error;
    }
  }

  /**
   * Validate generic backend response
   */
  private async validateGenericResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(
        `Backend API error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const result = await response.json();
    return result as T;
  }

  /**
   * Make GET request to backend
   */
  private async makeGetRequest(
    endpoint: string,
    requestId: string,
  ): Promise<GetTopicsResponse> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const controller = new AbortController();

    this.activeRequests.set(requestId, controller);

    const timeoutId = setTimeout(() => {
      controller.abort();
      this.activeRequests.delete(requestId);
    }, this.config.timeout);

    try {
      const contentApiKey = process.env.CONTENT_API_KEY;
      if (!contentApiKey) {
        throw new Error("CONTENT_API_KEY environment variable is not set");
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-Request-ID": requestId,
          "content-api-key": contentApiKey,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(
          `Backend API error: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const result = await response.json();
      this.activeRequests.delete(requestId);

      return {
        topics: result.topics || [],
        total_count: result.total_count || 0,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      this.activeRequests.delete(requestId);
      throw error;
    }
  }

  /**
   * Validate backend configuration
   */
  private validateConfig(): void {
    if (!this.config.baseUrl) {
      throw new Error(
        "Backend API URL is not configured. Please set BACKEND_API_URL environment variable.",
      );
    }

    if (!this.config.baseUrl.startsWith("http")) {
      throw new Error(
        "Invalid BACKEND_API_URL format. Must start with http:// or https://",
      );
    }

    try {
      new URL(this.config.baseUrl);
    } catch {
      throw new Error(
        `Invalid BACKEND_API_URL format: ${this.config.baseUrl}. Must be a valid URL.`,
      );
    }

    if (!process.env.CONTENT_API_KEY) {
      throw new Error(
        "Content API key is not configured. Please set CONTENT_API_KEY environment variable.",
      );
    }
  }

  /**
   * Create a deduplication key for requests
   */
  private createDeduplicationKey(
    payload: BackendTopicGenerationPayload,
  ): string {
    // Create a hash-like key based on important payload fields
    const keyData = {
      industry: payload.industry,
      subject: payload.subject,
      content_type: payload.content_type,
      num_ideas: payload.num_ideas,
      keywords: payload.keywords,
    };
    return btoa(JSON.stringify(keyData)).slice(0, 16);
  }

  /**
   * Promise-based delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Cancel an active request by ID
   */
  public cancelRequest(requestId: string): void {
    const controller = this.activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(requestId);
    }
  }

  /**
   * Cancel all active requests
   */
  public cancelAllRequests(): void {
    for (const [_requestId, controller] of this.activeRequests.entries()) {
      controller.abort();
    }
    this.activeRequests.clear();
    this.requestDeduplicationMap.clear();
  }

  /**
   * Health check to test backend connectivity
   */
  public async healthCheck(): Promise<{ healthy: boolean; latency?: number }> {
    if (!this.config.healthCheckEndpoint) {
      return { healthy: false };
    }

    const startTime = performance.now();
    const requestId = generateRequestId();

    try {
      const response = await this.makeRequest(
        this.config.healthCheckEndpoint,
        {} as BackendTopicGenerationPayload,
        requestId,
      );

      const latency = Math.round(performance.now() - startTime);
      return {
        healthy: response.ok,
        latency,
      };
    } catch {
      return { healthy: false };
    }
  }

  /**
   * Enhanced error logging without exposing sensitive information
   */
  private logError(context: string, error: BackendError | unknown): void {
    if (error && typeof error === "object" && "type" in error) {
      const sanitized = sanitizeErrorForLogging(error as BackendError);
      console.error(`[BackendService] ${context}:`, {
        ...sanitized,
        context: context,
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        url: typeof window !== "undefined" ? window.location.href : undefined,
      });
    } else {
      console.error(`[BackendService] ${context}:`, {
        error: String(error),
        timestamp: new Date().toISOString(),
        context,
      });
    }
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
