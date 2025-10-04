import {
  classifyError,
  DEFAULT_RETRY_CONFIG,
  generateRequestId,
  sanitizeErrorForLogging,
} from "@/lib/error-utils";
import { logger } from "@/lib/logger";
import { InputSanitizer } from "@/lib/sanitization";
import { generateSessionId } from "@/lib/session-storage";
import { transformTopicsForBackend } from "@/lib/transformation-utils";
import type {
  BackendConfig,
  BackendError,
  BackendErrorType,
  BackendServiceAnalytics,
  BackendServiceInterceptor,
  BackendTopicGenerationPayload,
  BackendTopicGenerationResponse,
  BackendValidationConfig,
  ErrorRecoveryAction,
  SaveTopicResponse,
  ValidationError,
} from "@/types/backend";
import type {
  BackendErrorCode,
  ErrorSeverity,
} from "@/types/consistent-response";
import {
  BackendTopicGenerationResponseSchema,
  createUserFriendlyErrors,
  extractValidationErrors,
  GeneratedTopicSchema,
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
  private readonly log = logger.forComponent("BackendService");
  private readonly validationConfig: BackendValidationConfig;
  private readonly activeRequests = new Map<string, AbortController>();
  private readonly requestDeduplicationMap = new Map<
    string,
    Promise<BackendTopicGenerationResponse>
  >();
  private readonly interceptors: BackendServiceInterceptor[] = [];
  private readonly analytics: BackendServiceAnalytics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageProcessingTime: 0,
    errorDistribution: {} as Record<BackendErrorCode, number>,
    endpointDistribution: {} as Record<string, number>,
    lastRequestTimestamp: new Date().toISOString(),
  };

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
      baseUrl:
        process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://127.0.0.1:2024",
      timeout: 120000, // 2 minutes for AI operations like topic generation
      retry: { ...DEFAULT_RETRY_CONFIG, maxAttempts: 1 }, // No retries
      enableDeduplication: true,
      healthCheckEndpoint: "/health",
      enableOfflineDetection: true,
      ...config,
    };

    this.validationConfig = {
      skipInputValidation: false,
      skipOutputValidation: false, // Enable validation safety net
      continueOnWarnings: true,
      enableAutoFix: false,
      includeMetrics: false,
      ...validationConfig,
    };
  }

  // ============================================================================
  // CONSISTENT RESPONSE HANDLING METHODS
  // ============================================================================

  /**
   * Adds an interceptor for request/response processing
   * @param interceptor - Interceptor configuration
   */
  addInterceptor(interceptor: BackendServiceInterceptor): void {
    this.interceptors.push(interceptor);
  }

  /**
   * Gets current analytics data
   * @returns Backend service analytics
   */
  getAnalytics(): BackendServiceAnalytics {
    return { ...this.analytics };
  }

  /**
   * Resets analytics data
   */
  resetAnalytics(): void {
    this.analytics.totalRequests = 0;
    this.analytics.successfulRequests = 0;
    this.analytics.failedRequests = 0;
    this.analytics.averageProcessingTime = 0;
    this.analytics.errorDistribution = {} as Record<BackendErrorCode, number>;
    this.analytics.endpointDistribution = {} as Record<string, number>;
    this.analytics.lastRequestTimestamp = new Date().toISOString();
  }

  /**
   * Generate topics using the backend AI API with direct communication.
   *
   * @param formData - Complete topic builder form data containing all user preferences
   * @returns Promise resolving to generated topics with metadata
   * @throws {BackendError} When topic generation fails
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
        this.log.debug("Using deduplicated request", { requestId });
        return existingRequest;
      }

      const requestPromise = this.executeSingleRequest(
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

    return this.executeSingleRequest(
      "/api/topic/generate-topic",
      payload,
      requestId,
    );
  }

  /**
   * Save generated topics to the backend API with direct communication.
   *
   * @param topics - Array of generated topics to save to the backend
   * @returns Promise resolving to save operation results including success status and count
   * @throws {BackendError} When the save operation fails
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
  async saveTopics(
    topics: GeneratedTopic[],
    workspaceId: string,
  ): Promise<SaveTopicResponse> {
    this.validateConfig();

    const requestId = generateRequestId();

    // Transform GeneratedTopic[] to backend SaveTopicRequest format and add workspace_id
    const payload = transformTopicsForBackend(topics, workspaceId);

    return this.executeSingleGenericRequest(
      "/api/topic/save-topic",
      payload,
      requestId,
      "POST",
    ) as Promise<SaveTopicResponse>;
  }

  /**
   * Delete topics from the backend API with direct communication.
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
  async deleteTopics(
    topicIds: string[],
    workspaceId: string,
  ): Promise<{
    success: boolean;
    deleted_count: number;
    message: string;
    topic_ids: string[];
  }> {
    this.validateConfig();

    if (!topicIds || topicIds.length === 0) {
      throw new Error("No topic IDs provided for deletion");
    }

    const requestId = generateRequestId();
    const payload = { topic_ids: topicIds };

    return this.executeSingleGenericRequest(
      `/api/topic/delete-topic?workspace_id=${encodeURIComponent(workspaceId)}`,
      payload,
      requestId,
      "DELETE",
    ) as Promise<{
      success: boolean;
      deleted_count: number;
      message: string;
      topic_ids: string[];
    }>;
  }

  /**
   * Get all topics from the backend API.
   *
   * @returns Promise<GeneratedTopic[]> - Array of topics from backend
   */
  async getTopics(workspaceId: string): Promise<GeneratedTopic[]> {
    this.validateConfig();

    const requestId = generateRequestId();

    const response = await fetch(
      `${this.config.baseUrl}/api/topic/get-topics?workspace_id=${encodeURIComponent(workspaceId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
          "content-api-key": process.env.NEXT_PUBLIC_CONTENT_API_KEY || "",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch topics: ${response.status}`);
    }

    const data = await response.json();
    return data.data?.topics || [];
  }

  /**
   * Get a single topic by ID from the backend API.
   *
   * @param topicId - ID of the topic to retrieve
   * @param workspaceId - ID of the workspace the topic belongs to
   * @returns Promise<GeneratedTopic | null> - Topic data or null if not found
   */
  async getTopic(
    topicId: string,
    workspaceId: string,
  ): Promise<GeneratedTopic | null> {
    this.validateConfig();

    const requestId = generateRequestId();

    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/topic/get-topic/${topicId}?workspace_id=${encodeURIComponent(workspaceId)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Request-ID": requestId,
            "content-api-key": process.env.NEXT_PUBLIC_CONTENT_API_KEY || "",
          },
        },
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch topic: ${response.status}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      // Return null for 404 errors (topic not found)
      if (error instanceof Error && error.message.includes("404")) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Execute request without retry logic
   */
  private async executeSingleRequest(
    endpoint: string,
    payload: BackendTopicGenerationPayload,
    requestId: string,
  ): Promise<BackendTopicGenerationResponse> {
    try {
      this.log.debug("Single request", {
        requestId,
        endpoint,
      });

      const response = await this.makeRequest(endpoint, payload, requestId);
      const result = await this.validateResponse(response, requestId);

      // Success - clean up any stored controllers
      this.activeRequests.delete(requestId);
      return result;
    } catch (error) {
      const classifiedError = classifyError(error, requestId, 1);
      this.logError(`Request failed for ${requestId}`, classifiedError);

      // Clean up and throw the error
      this.activeRequests.delete(requestId);
      throw classifiedError;
    }
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
    this.log.debug("Setting up request timeout", {
      requestId,
      endpoint,
      timeout_ms: this.config.timeout,
      timeout_minutes: Math.round((this.config.timeout / 60000) * 10) / 10,
    });

    const timeoutId = setTimeout(() => {
      this.log.warn("Request timed out", {
        requestId,
        endpoint,
        timeout_ms: this.config.timeout,
      });
      controller.abort();
      this.activeRequests.delete(requestId);
    }, this.config.timeout);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
          "content-api-key": process.env.NEXT_PUBLIC_CONTENT_API_KEY || "",
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
   * Transform frontend form data to backend API format with input validation and sanitization
   */
  private transformFormDataToBackendFormat(
    formData: TopicBuilderFormData,
  ): BackendTopicGenerationPayload {
    // Input validation and sanitization
    const sanitizedFormData = this.validateAndSanitizeFormData(formData);

    // Transform to exact Pydantic schema format with backward compatibility
    return {
      wizardMode: sanitizedFormData.wizardMode || "industry-first",
      industry:
        sanitizedFormData.industry_other || sanitizedFormData.industry || "",
      industry_other: sanitizedFormData.industry_other || null,
      audience:
        Array.isArray(sanitizedFormData.audience) &&
        sanitizedFormData.audience.length > 0
          ? sanitizedFormData.audience
          : [],
      purpose: Array.isArray(sanitizedFormData.purpose)
        ? sanitizedFormData.purpose
        : [],
      purpose_other: sanitizedFormData.purpose_other || null,
      num_topics: sanitizedFormData.num_topics || 5,
      subject: sanitizedFormData.subject || null,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Validate and sanitize form data to prevent XSS and other security issues
   */
  private validateAndSanitizeFormData(
    formData: TopicBuilderFormData,
  ): TopicBuilderFormData {
    if (!this.validationConfig.skipInputValidation) {
      const sanitized: TopicBuilderFormData = {
        ...formData,
        // Sanitize text fields
        industry: formData.industry
          ? (InputSanitizer.sanitizeText(
              formData.industry,
            ) as typeof formData.industry)
          : formData.industry,
        industry_other: formData.industry_other
          ? InputSanitizer.sanitizeText(formData.industry_other)
          : formData.industry_other,
        subject: formData.subject
          ? InputSanitizer.sanitizeText(formData.subject)
          : formData.subject,
        purpose_other: formData.purpose_other
          ? InputSanitizer.sanitizeText(formData.purpose_other)
          : formData.purpose_other,

        // Sanitize arrays
        audience: Array.isArray(formData.audience)
          ? (formData.audience.map((item) =>
              InputSanitizer.sanitizeText(item),
            ) as typeof formData.audience)
          : formData.audience,
        purpose: Array.isArray(formData.purpose)
          ? (formData.purpose.map((item) =>
              InputSanitizer.sanitizeText(item),
            ) as typeof formData.purpose)
          : formData.purpose,

        // Validate numeric fields
        num_topics: this.validateNumericField(formData.num_topics, 1, 20, 5),
      };

      // Check for XSS attempts in any text field
      const textFields = [
        sanitized.industry,
        sanitized.industry_other,
        sanitized.subject,
        sanitized.purpose_other,
        ...(sanitized.audience || []),
        ...(sanitized.purpose || []),
      ].filter(Boolean);

      for (const field of textFields) {
        if (typeof field === "string" && InputSanitizer.containsXSS(field)) {
          this.log.warn("XSS attempt detected in form data", {
            field_content: InputSanitizer.sanitizeForLog(field),
          });
          throw new Error(
            "Invalid input detected. Please check your form data.",
          );
        }
      }

      return sanitized;
    }

    return formData;
  }

  /**
   * Validate numeric fields with min/max constraints
   */
  private validateNumericField(
    value: unknown,
    min: number,
    max: number,
    defaultValue: number,
  ): number {
    if (
      typeof value === "number" &&
      !Number.isNaN(value) &&
      value >= min &&
      value <= max
    ) {
      return Math.floor(value); // Ensure integer
    }
    return defaultValue;
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

    // Handle new consistent response format
    let actualData = result;
    if (result.success === false && result.error) {
      // New format error: { success: false, error: { message: "...", code: "..." }, meta: {...} }
      const backendError: BackendError = {
        type: "server_error",
        message: result.error.message || "Backend API error",
        statusCode: response.status,
        severity: "high",
        recoveryActions: ["retry", "check_connection"],
        isRetryable: true,
        requestId,
        timestamp: new Date().toISOString(),
        originalError: new Error(result.error.message || "Unknown error"),
        context: {
          errorCode: result.error.code,
          errorDetails: result.error.details,
        },
      };
      throw backendError;
    } else if (result.success && result.data) {
      // New format: { success: true, data: { topics: [...] }, meta: {...} }
      actualData = {
        topics: result.data.topics || [],
        total_count:
          result.data.total_generated || result.data.topics?.length || 0,
        generation_time_ms: result.meta?.processing_time_ms,
        model_used: result.data.model_used,
        request_id: result.meta?.request_id || requestId,
      };
    } else if (result.topics) {
      // Legacy format: { topics: [...] }
      actualData = result;
    }

    if (this.validationConfig.skipOutputValidation) {
      this.log.warn("Skipping output validation (disabled in config)", {
        requestId,
      });
      return actualData as BackendTopicGenerationResponse;
    }

    // Add missing IDs to topics before validation (backend may not include IDs)
    if (actualData.topics && Array.isArray(actualData.topics)) {
      actualData.topics = actualData.topics.map(
        (topic: Record<string, unknown> & { id?: string }, _index: number) => ({
          ...topic,
          id: topic.id || generateSessionId(),
        }),
      );
    }

    // Validate response structure with Zod
    const validationResult =
      BackendTopicGenerationResponseSchema.safeParse(actualData);

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
        originalData: actualData,
        stage: "output",
        context: {
          endpoint: "generate_topics",
          expectedSchema: "BackendTopicGenerationResponse",
        },
      };

      // Log detailed validation errors
      this.log.error("Backend response validation failed", {
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
      this.log.warn("Some topics failed individual validation", {
        requestId,
        invalid_topics: invalidTopics,
        count: invalidTopics.length,
      });

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

    this.log.info("Successfully validated topics", {
      requestId,
      topics_count: validatedResponse.topics.length,
      warnings_count: invalidTopics.length,
      generation_time_ms: validatedResponse.generation_time_ms || null,
    });

    return validatedResponse;
  }

  /**
   * Execute request without retry logic for generic payloads
   */
  private async executeSingleGenericRequest<T, R>(
    endpoint: string,
    payload: T,
    requestId: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "POST",
  ): Promise<R> {
    try {
      this.log.debug("Single generic request", {
        requestId,
        endpoint,
      });

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
      const classifiedError = classifyError(error, requestId, 1);
      this.logError(`Generic request failed for ${requestId}`, classifiedError);

      // Clean up and throw the error
      this.activeRequests.delete(requestId);
      throw classifiedError;
    }
  }

  /**
   * Make HTTP request for generic payloads
   */
  private async makeGenericRequest<T>(
    endpoint: string,
    payload: T,
    requestId: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "POST",
  ): Promise<Response> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const controller = new AbortController();

    // Store controller for potential cancellation
    this.activeRequests.set(requestId, controller);

    // Set up timeout
    this.log.debug("Setting up request timeout", {
      requestId,
      endpoint,
      timeout_ms: this.config.timeout,
      timeout_minutes: Math.round((this.config.timeout / 60000) * 10) / 10,
    });

    const timeoutId = setTimeout(() => {
      this.log.warn("Request timed out", {
        requestId,
        endpoint,
        timeout_ms: this.config.timeout,
      });
      controller.abort();
      this.activeRequests.delete(requestId);
    }, this.config.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
          "content-api-key": process.env.NEXT_PUBLIC_CONTENT_API_KEY || "",
        },
        ...(method !== "GET" && { body: JSON.stringify(payload) }),
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

      // Try to parse error text as JSON to get structured error
      let errorData: unknown = null;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        // If not JSON, use the text as-is
      }

      // Create a structured error with status code
      interface ErrorData {
        error?: { message?: string };
        message?: string;
      }
      const parsedError = errorData as ErrorData;
      const error = new Error(
        parsedError?.error?.message ||
          parsedError?.message ||
          `Backend API error: ${response.status} ${response.statusText}`,
      ) as Error & { statusCode?: number; context?: unknown };

      error.statusCode = response.status;
      error.context = errorData;

      throw error;
    }

    const result = await response.json();

    // Handle new consistent format with error responses: { success: false, error: {...}, meta: {...} }
    if (
      result &&
      typeof result === "object" &&
      "success" in result &&
      result.success === false &&
      "error" in result
    ) {
      // This is an error response in the new format
      const errorInfo = result.error || {};

      // Create a structured error with the proper status code
      const error = new Error(
        errorInfo.message || "Failed to save topics",
      ) as Error & { statusCode?: number; context?: unknown };

      error.statusCode = errorInfo.status_code || response.status;
      error.context = {
        ...errorInfo.context,
        errorCode: errorInfo.code,
        errorMessage: errorInfo.message,
        severity: errorInfo.severity,
      };

      throw error;
    }

    // Transform external API response format to internal SaveTopicResponse format

    // Handle new consistent format: { success: true, data: {...}, meta: {...} }
    if (
      result &&
      typeof result === "object" &&
      "success" in result &&
      "data" in result
    ) {
      const isSuccess = result.success === true;
      const data = result.data || {};

      // Transform to internal format
      const transformedResult = {
        success: isSuccess,
        saved_count: data.saved_count || 0,
        message:
          data.message ||
          (isSuccess ? "Topics saved successfully" : "Failed to save topics"),
        saved_topic_ids: data.saved_topic_ids || [],
        total_requested: data.total_requested || 0,
        // Ensure all fields are available for proper response handling
        successful_saves: data.saved_count || 0,
        failed_saves: Math.max(
          0,
          (data.total_requested || 0) - (data.saved_count || 0),
        ),
        request_id: data.request_id || "unknown",
      };

      this.log.debug("Transformed new API response format", {
        original: result,
        transformed: transformedResult,
      });

      return transformedResult as T;
    }

    // Handle legacy format: { status: "success", message: "..." }
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

      this.log.debug("Transformed legacy API response", {
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

    // API key authentication is handled by backend or auth middleware
    // No client-side API key validation needed
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
      this.log.error(context, {
        ...sanitized,
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        url: typeof window !== "undefined" ? window.location.href : undefined,
      });
    } else {
      this.log.error(context, {
        error: String(error),
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
