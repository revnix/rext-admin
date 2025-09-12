import {
  calculateRetryDelay,
  classifyError,
  DEFAULT_RETRY_CONFIG,
  generateRequestId,
  sanitizeErrorForLogging,
  shouldRetry,
} from "@/lib/error-utils";
import { transformTopicsForSavingEnhanced } from "@/lib/transformation-utils";
import type {
  BackendConfig,
  BackendError,
  BackendErrorType,
  BackendTopicGenerationPayload,
  BackendTopicGenerationResponse,
  BackendValidationConfig,
  ErrorRecoveryAction,
  ErrorSeverity,
  GetTopicsResponse,
  SaveTopicRequest,
  SaveTopicResponse,
  ValidationError,
} from "@/types/backend";
import {
  BackendTopicGenerationResponseSchema,
  createUserFriendlyErrors,
  extractValidationErrors,
  GeneratedTopicSchema,
  GetTopicsResponseSchema,
} from "@/types/schemas";
import type {
  GeneratedTopic,
  TopicBuilderFormData,
} from "@/types/topic-builder";

/**
 * Backend service class for handling API communications with comprehensive error handling
 */
export class BackendService {
  private readonly config: BackendConfig;
  private readonly validationConfig: BackendValidationConfig;
  private readonly activeRequests = new Map<string, AbortController>();
  private readonly requestDeduplicationMap = new Map<
    string,
    Promise<BackendTopicGenerationResponse>
  >();

  /**
   * Create a new BackendService instance with optional configuration overrides.
   *
   * @param config - Optional partial configuration to override defaults
   *
   * @example
   * ```typescript
   * const customService = new BackendService({
   *   timeout: 60000,
   *   retry: { maxAttempts: 5 }
   * });
   * ```
   */
  constructor(
    config?: Partial<BackendConfig>,
    validationConfig?: BackendValidationConfig,
  ) {
    this.config = {
      baseUrl: process.env.BACKEND_API_URL || "http://127.0.0.1:2024",
      timeout: 30000,
      retry: DEFAULT_RETRY_CONFIG,
      enableDeduplication: true,
      healthCheckEndpoint: "/health",
      enableOfflineDetection: true,
      ...config,
    };

    this.validationConfig = {
      skipInputValidation: false,
      skipOutputValidation: false,
      continueOnWarnings: true,
      enableAutoFix: false,
      includeMetrics: false,
      ...validationConfig,
    };
  }

  /**
   * Generate topics using the backend AI API with comprehensive retry logic and deduplication.
   *
   * @param formData - Complete topic builder form data containing all user preferences
   * @returns Promise resolving to generated topics with metadata
   * @throws {BackendError} When topic generation fails after all retry attempts
   *
   * @example
   * ```typescript
   * const formData: TopicBuilderFormData = {
   *   industry: "technology",
   *   num_topics: 5,
   *   // ... other required fields
   * };
   * const result = await backendService.generateTopics(formData);
   * console.log(`Generated ${result.topics.length} topics`);
   * ```
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
   * Save generated topics to the backend API with comprehensive error handling and retry logic.
   *
   * @param topics - Array of generated topics to save to the backend
   * @returns Promise resolving to save operation results including success status and count
   * @throws {BackendError} When the save operation fails after all retry attempts
   *
   * @example
   * ```typescript
   * const topics: GeneratedTopic[] = [
   *   { id: "1", title: "AI in Healthcare", angle: "Future prospects", ... }
   * ];
   * const result = await backendService.saveTopics(topics);
   * console.log(`Saved ${result.saved_count} topics successfully`);
   * ```
   */
  async saveTopics(topics: GeneratedTopic[]): Promise<SaveTopicResponse> {
    this.validateConfig();

    const requestId = generateRequestId();

    // Transform GeneratedTopic[] to SaveTopicItem[] using enhanced transformation utilities
    const transformationResult = await transformTopicsForSavingEnhanced(
      topics,
      {
        autoFix: true,
        continueOnError: false, // Fail fast if any topic has issues
        includeMetrics: false, // Don't need metrics for this operation
      },
    );

    if (!transformationResult.success) {
      const error = classifyError(
        new Error(
          `Topic transformation failed: ${transformationResult.errors[0]?.error.message || "Unknown transformation error"}`,
        ),
        requestId,
      );
      error.type = "validation_error";
      throw error;
    }

    const payload: SaveTopicRequest = { topics: transformationResult.data };

    return this.executeWithRetryGeneric(
      "/api/topic/save-topic",
      payload,
      requestId,
      "POST",
    ) as Promise<SaveTopicResponse>;
  }

  /**
   * Delete topics from the backend API via Next.js API route
   *
   * @param topicIds - Array of topic IDs to delete from the backend
   * @returns Promise resolving to delete operation results including success status and count
   * @throws {BackendError} When the delete operation fails after all retry attempts
   *
   * @example
   * ```typescript
   * const topicIds = ["topic_1", "topic_2"];
   * const result = await backendService.deleteTopics(topicIds);
   * console.log(`Deleted ${result.deleted_count} topics successfully`);
   * ```
   */
  async deleteTopics(topicIds: string[]): Promise<{
    success: boolean;
    deleted_count: number;
    message: string;
    topic_ids: string[];
  }> {
    if (!topicIds || topicIds.length === 0) {
      throw new Error("No topic IDs provided for deletion");
    }

    const requestId = generateRequestId();

    try {
      const response = await fetch("/api/topics/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
        },
        body: JSON.stringify({ topic_ids: topicIds }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          errorData.error ||
            `API error: ${response.status} ${response.statusText}`,
        );
      }

      const result = await response.json();

      console.log(
        `✅ Successfully deleted ${result.deleted_count || topicIds.length} topics via Next.js API`,
      );

      return {
        success: result.success || true,
        deleted_count: result.deleted_count || topicIds.length,
        message:
          result.message || `Deleted ${topicIds.length} topics successfully`,
        topic_ids: result.topic_ids || topicIds,
      };
    } catch (error) {
      const classifiedError = classifyError(error, requestId);
      this.logError(`Failed to delete topics via Next.js API`, classifiedError);
      throw classifiedError;
    }
  }

  /**
   * Retrieve all saved topics from the Next.js API route (which proxies to backend)
   *
   * @returns Promise resolving to all saved topics and total count
   * @throws {BackendError} When the retrieval operation fails after all retry attempts
   *
   * @example
   * ```typescript
   * const response = await backendService.getTopics();
   * console.log(`Found ${response.total_count} saved topics`);
   * response.topics.forEach(topic => console.log(topic.title));
   * ```
   */
  async getTopics(): Promise<GetTopicsResponse> {
    const requestId = generateRequestId();

    try {
      const response = await fetch("/api/topics", {
        method: "GET",
        headers: {
          "X-Request-ID": requestId,
        },
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          errorData.error ||
            `API error: ${response.status} ${response.statusText}`,
        );
      }

      const result = await response.json();

      if (this.validationConfig.skipOutputValidation) {
        console.log(
          "⚠️  Skipping output validation for getTopics (disabled in config)",
        );
        return {
          topics: result.topics || [],
          total_count: (result.topics || []).length,
        };
      }

      // Validate response structure with Zod
      const validationResult = GetTopicsResponseSchema.safeParse(result);

      if (!validationResult.success) {
        const validationError: ValidationError = {
          type: "validation_error",
          message: "Get topics response validation failed",
          statusCode: 422,
          severity: "high",
          recoveryActions: [
            "retry_with_changes",
            "contact_support",
            "reload_page",
          ],
          isRetryable: false,
          requestId,
          timestamp: new Date().toISOString(),
          validationIssues: validationResult.error.issues,
          originalData: result,
          stage: "output",
          context: {
            endpoint: "get_topics",
            expectedSchema: "GetTopicsResponse",
          },
        };

        console.error("🔴 Get topics response validation failed:", {
          requestId,
          issues: extractValidationErrors(validationResult.error),
          friendlyErrors: createUserFriendlyErrors(
            extractValidationErrors(validationResult.error),
          ),
        });

        throw validationError;
      }

      const dataWithTotals = validationResult.data as {
        total_count?: number;
        topics: Array<unknown>;
      };
      const validatedResponse = {
        ...validationResult.data,
        total_count: dataWithTotals.total_count ?? dataWithTotals.topics.length,
        request_id: requestId,
      };

      console.log(
        `✅ Successfully validated and fetched ${validatedResponse.topics.length} topics via Next.js API`,
      );

      return validatedResponse;
    } catch (error) {
      const classifiedError = classifyError(error, requestId);
      this.logError(`Failed to fetch topics via Next.js API`, classifiedError);
      throw classifiedError;
    }
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
        const result = await this.validateResponse(response, requestId);

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
    // Transform to exact Pydantic schema format with backward compatibility
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
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Validate backend response with comprehensive Zod schema validation
   */
  private async validateResponse(
    response: Response,
    requestId: string,
  ): Promise<BackendTopicGenerationResponse> {
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");

      // Classify error type based on HTTP status code
      let errorType: BackendErrorType = "server_error";
      let severity: ErrorSeverity = "high";
      let recoveryActions: ErrorRecoveryAction[] = ["check_connection"];
      let isRetryable = false;

      if (response.status >= 500) {
        errorType = "server_error";
        severity = "critical";
        recoveryActions = ["retry", "check_connection"];
        isRetryable = true;
      } else if (response.status === 429) {
        errorType = "rate_limit_error";
        severity = "medium";
        recoveryActions = ["retry"];
        isRetryable = true;
      } else if (response.status === 401 || response.status === 403) {
        errorType = "authentication_error";
        severity = "medium";
        recoveryActions = ["reload_page", "contact_support"];
        isRetryable = false;
      } else if (response.status === 422) {
        errorType = "validation_error";
        severity = "low";
        recoveryActions = ["go_back", "retry_with_changes"];
        isRetryable = false;
      } else if (response.status >= 400) {
        errorType = "validation_error";
        severity = "low";
        recoveryActions = ["go_back", "retry_with_changes"];
        isRetryable = false;
      }

      const backendError: BackendError = {
        type: errorType,
        message: `Backend API error: ${response.status} ${response.statusText}`,
        statusCode: response.status,
        severity,
        recoveryActions,
        isRetryable,
        requestId,
        timestamp: new Date().toISOString(),
        originalError: new Error(errorText),
        context: { responseStatus: response.status, responseText: errorText },
      };
      throw backendError;
    }

    const result = await response.json();

    if (this.validationConfig.skipOutputValidation) {
      console.log("⚠️  Skipping output validation (disabled in config)");
      return result as BackendTopicGenerationResponse;
    }

    // Add missing IDs to topics before validation (backend may not include IDs)
    if (result.topics && Array.isArray(result.topics)) {
      result.topics = result.topics.map(
        (topic: Record<string, unknown> & { id?: string }, index: number) => ({
          ...topic,
          id: topic.id || `topic_${Date.now()}_${index}`,
        }),
      );
    }

    // Validate response structure with Zod
    const validationResult =
      BackendTopicGenerationResponseSchema.safeParse(result);

    if (!validationResult.success) {
      const validationError: ValidationError = {
        type: "validation_error",
        message: "Backend response validation failed",
        statusCode: 422,
        severity: "high",
        recoveryActions: [
          "check_connection",
          "retry_with_changes",
          "contact_support",
        ],
        isRetryable: false,
        requestId,
        timestamp: new Date().toISOString(),
        validationIssues: validationResult.error.issues,
        originalData: result,
        stage: "output",
        context: {
          endpoint: "generate_topics",
          expectedSchema: "BackendTopicGenerationResponse",
        },
      };

      // Log detailed validation errors
      console.error("🔴 Backend response validation failed:", {
        requestId,
        issues: extractValidationErrors(validationResult.error),
        friendlyErrors: createUserFriendlyErrors(
          extractValidationErrors(validationResult.error),
        ),
      });

      throw validationError;
    }

    const dataTotals = validationResult.data as {
      total_count?: number;
      topics: Array<unknown>;
    };
    const validatedResponse = {
      ...validationResult.data,
      total_count: dataTotals.total_count ?? dataTotals.topics.length,
      request_id: requestId,
    };

    // Additional validation for individual topics
    const invalidTopics: string[] = [];
    for (let i = 0; i < validatedResponse.topics.length; i++) {
      const topic = validatedResponse.topics[i];
      const topicValidation = GeneratedTopicSchema.safeParse(topic);
      if (!topicValidation.success) {
        invalidTopics.push(
          `Topic ${i + 1}: ${topicValidation.error.issues[0]?.message || "Invalid structure"}`,
        );
      }
    }

    if (invalidTopics.length > 0) {
      console.warn(
        "⚠️  Some topics failed individual validation:",
        invalidTopics,
      );

      if (!this.validationConfig.continueOnWarnings) {
        const validationError: ValidationError = {
          type: "validation_error",
          message: `Individual topic validation failed: ${invalidTopics.join(", ")}`,
          statusCode: 422,
          severity: "medium",
          recoveryActions: ["retry_with_changes", "contact_support"],
          isRetryable: false,
          requestId,
          timestamp: new Date().toISOString(),
          validationIssues: [],
          originalData: validatedResponse.topics,
          stage: "output",
          context: { invalidTopics },
        };
        throw validationError;
      }
    }

    console.log(
      `✅ Successfully validated ${validatedResponse.topics.length} topics (${invalidTopics.length} warnings) in ${validatedResponse.generation_time_ms || "unknown"}ms`,
    );

    return validatedResponse;
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
   * Validate generic backend response and transform external API format
   */
  private async validateGenericResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(
        `Backend API error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const result = await response.json();

    // Transform external API response format to internal SaveTopicResponse format
    if (
      result &&
      typeof result === "object" &&
      "status" in result &&
      "message" in result
    ) {
      const isSuccess = result.status === "success";

      // Extract saved count from message like "2 topics saved successfully."
      let savedCount = 0;
      if (isSuccess && result.message && typeof result.message === "string") {
        const match = result.message.match(/(\d+)\s+topics?\s+saved/i);
        if (match) {
          savedCount = parseInt(match[1], 10);
        }
      }

      // Transform to internal format
      const transformedResult = {
        success: isSuccess,
        saved_count: savedCount,
        message:
          result.message ||
          (isSuccess ? "Topics saved successfully" : "Failed to save topics"),
      };

      console.log("Transformed external API response:", {
        original: result,
        transformed: transformedResult,
      });

      return transformedResult as T;
    }

    return result as T;
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
      num_topics: payload.num_topics,
      purpose: payload.purpose,
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
