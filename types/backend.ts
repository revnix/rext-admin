import type { ZodIssue } from "zod";
import type { SaveTopicItem } from "./api";
import type {
  BackendErrorCode,
  ConsistentApiResponse,
  ConsistentErrorResponse,
  ConsistentSuccessResponse,
  ErrorSeverity,
} from "./consistent-response";
import type { GeneratedTopic } from "./topic-builder";

/**
 * Backend API Type Definitions
 *
 * This module defines interfaces for communication with the backend API,
 * including request/response structures and error handling.
 *
 * @see /types/schemas.ts for validation schemas and field mappings
 * @see /types/topic-builder.ts for frontend data structures
 */

/**
 * Backend API payload structure for topic generation request - matches Pydantic schema exactly
 */
export interface BackendTopicGenerationPayload {
  wizardMode: string;
  industry: string;
  industry_other?: string | null;
  audience: string[];
  purpose: string[];
  purpose_other?: string | null;
  num_topics: number;
  subject?: string | null;
  timestamp: string;
}

/**
 * Backend API response structure for topic generation
 */
export interface BackendTopicGenerationResponse {
  /** Generated topics */
  topics: GeneratedTopic[];
  /** Unique request identifier */
  request_id: string;
  /** Model used for generation */
  model_used?: string;
  /** Generation time in milliseconds */
  generation_time_ms?: number;
}

/**
 * Backend API configuration
 */
export interface BackendConfig {
  /** Base URL for backend API */
  baseUrl: string;
  /** Timeout for requests in milliseconds */
  timeout: number;
  /** Retry configuration */
  retry: RetryConfig;
  /** Enable request deduplication */
  enableDeduplication?: boolean;
  /** Health check endpoint */
  healthCheckEndpoint?: string;
  /** Whether to enable offline detection */
  enableOfflineDetection?: boolean;
}

/**
 * Backend API error types
 */
export type BackendErrorType =
  | "network_error"
  | "timeout_error"
  | "validation_error"
  | "server_error"
  | "configuration_error"
  | "parsing_error"
  | "rate_limit_error"
  | "authentication_error"
  | "cors_error"
  | "abort_error"
  | "unknown_error";

// ErrorSeverity is imported from consistent-response.ts

/**
 * User recovery actions available for different error types
 */
export type ErrorRecoveryAction =
  | "retry"
  | "retry_with_changes"
  | "go_back"
  | "reload_page"
  | "contact_support"
  | "check_connection"
  | "none";

/**
 * Retry strategy configuration
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Initial delay in milliseconds */
  initialDelay: number;
  /** Maximum delay cap in milliseconds */
  maxDelay: number;
  /** Backoff multiplier (exponential backoff) */
  backoffMultiplier: number;
  /** Jitter factor to prevent thundering herd (0-1) */
  jitterFactor: number;
  /** Error types that should trigger retries */
  retryableErrors: BackendErrorType[];
}

/**
 * Backend API error structure
 */
export interface BackendError {
  /** Error type */
  type: BackendErrorType;
  /** User-friendly error message */
  message: string;
  /** Technical error message for logging */
  technicalMessage?: string;
  /** HTTP status code if applicable */
  statusCode?: number;
  /** Error severity level */
  severity: ErrorSeverity;
  /** Available recovery actions */
  recoveryActions: ErrorRecoveryAction[];
  /** Whether this error is retryable */
  isRetryable: boolean;
  /** Retry attempt number (if retrying) */
  retryAttempt?: number;
  /** Request ID for tracking */
  requestId?: string;
  /** Timestamp when error occurred */
  timestamp: string;
  /** Original error object (for logging only) */
  originalError?: Error;
  /** Additional context data */
  context?: Record<string, unknown>;
}

/**
 * Error response from API routes
 */
export interface APIErrorResponse {
  error: string;
  error_code: string;
  details?: string;
  fallback_available?: boolean;
  retry_after?: number;
  request_id?: string;
}

/**
 * Validation error types for backend data processing
 */
export interface ValidationError extends BackendError {
  type: "validation_error";
  validationIssues: ZodIssue[];
  originalData: unknown;
  fieldPath?: string;
  stage: "input" | "transformation" | "output";
}

/**
 * Configuration options for backend validation behavior
 */
export interface BackendValidationConfig {
  /** Skip validation for input data (default: false) */
  skipInputValidation?: boolean;
  /** Skip validation for output data (default: false) */
  skipOutputValidation?: boolean;
  /** Continue processing on validation warnings (default: true) */
  continueOnWarnings?: boolean;
  /** Auto-fix common validation issues (default: false) */
  enableAutoFix?: boolean;
  /** Include validation performance metrics (default: false) */
  includeMetrics?: boolean;
}

/**
 * Request payload for saving generated topics to the backend.
 *
 * NOTE: The backend expects SaveTopicItem format, not GeneratedTopic.
 * Use transformTopicForSaving() from /types/schemas.ts to convert.
 *
 * @example
 * ```typescript
 * import { transformTopicsForSaving } from '/types/schemas';
 *
 * const frontendTopics: GeneratedTopic[] = [...];
 * const saveRequest: SaveTopicRequest = {
 *   topics: transformTopicsForSaving(frontendTopics)
 * };
 * ```
 *
 * @see SaveTopicItem for the expected backend structure
 * @see transformTopicsForSaving in /types/schemas.ts for transformation helper
 */
export interface SaveTopicRequest {
  topics: SaveTopicItem[];
}

/**
 * Payload format for the Python backend SaveTopicRequestList
 *
 * This interface matches the exact format expected by the Python backend's
 * SaveTopicRequestList schema with individual SaveTopicRequest items.
 */
export interface BackendSaveTopicRequestList {
  topics: Array<{
    id: string;
    title: string;
    angle: string;
    description: string; // Required by backend validation
    channel_fit: string[];
    audience_fit: string[];
    why_it_works: string;
    tags: string[];
    scores: {
      relevance: number;
      seo_potential: number;
      trend_level: number;
      uniqueness: number;
      reader_interest: number;
      actionable_potential: number;
      brand_alignment: number;
      controversy: number;
    };
    suggested_defaults: Record<string, unknown>;
    input_params?: Record<string, unknown>;
  }>;
}

/**
 * Response from the backend after attempting to save topics.
 *
 * @property success - Whether the save operation completed successfully
 * @property saved_count - Number of topics that were successfully saved
 * @property message - Human-readable status message from the backend
 */
export interface SaveTopicResponse {
  success: boolean;
  saved_count: number;
  message: string;
}

/**
 * Response containing all saved topics retrieved from the backend.
 *
 * @property topics - Array of all saved topics with complete metadata
 * @property total_count - Total number of topics available in the backend
 *
 * @example
 * ```typescript
 * const response: GetTopicsResponse = {
 *   topics: [{ id: "1", title: "Topic", ... }],
 *   total_count: 1
 * };
 * ```
 */
export interface GetTopicsResponse {
  topics: GeneratedTopic[];
  total_count: number;
}

// ============================================================================
// CONSISTENT RESPONSE FORMAT INTEGRATION
// ============================================================================

/**
 * Backend service responses in consistent format
 */
export type ConsistentBackendTopicGenerationResponse =
  ConsistentApiResponse<BackendTopicGenerationResponse>;
/**
 * Response from backend for topic deletion
 */
export interface BackendDeleteTopicsResponse {
  deleted_count: number;
  failed_deletions?: Array<{
    topic_id: string;
    error: string;
  }>;
  deleted_topic_ids: string[];
}

/**
 * Response from backend for topic saving
 */
export interface BackendSaveTopicsResponse {
  success: boolean;
  saved_count: number;
  message: string;
}

export type ConsistentBackendDeleteTopicsResponse =
  ConsistentApiResponse<BackendDeleteTopicsResponse>;
export type ConsistentBackendSaveTopicsResponse =
  ConsistentApiResponse<BackendSaveTopicsResponse>;
export type ConsistentBackendGetTopicsResponse =
  ConsistentApiResponse<GetTopicsResponse>;

/**
 * Enhanced backend service configuration with consistent response support
 */
export interface EnhancedBackendConfig extends BackendConfig {
  /** Enable consistent response format handling */
  enableConsistentResponse: boolean;
  /** Request correlation configuration */
  requestCorrelation: {
    /** Include request ID in all requests */
    includeRequestId: boolean;
    /** Custom header name for request ID */
    requestIdHeader: string;
    /** Generate request ID if not provided */
    generateRequestId: boolean;
  };
  /** Response metadata handling */
  responseMetadata: {
    /** Extract and store processing time */
    trackProcessingTime: boolean;
    /** Log response metadata */
    logMetadata: boolean;
    /** Include metadata in error logs */
    includeMetadataInErrors: boolean;
  };
}

/**
 * Backend service error context with consistent response information
 */
export interface BackendServiceError extends Error {
  /** Backend error code */
  code: BackendErrorCode;
  /** Error severity */
  severity: ErrorSeverity;
  /** HTTP status code */
  statusCode: number;
  /** Request ID for correlation */
  requestId?: string;
  /** Processing time when error occurred */
  processingTime?: number;
  /** Original backend response */
  originalResponse?: ConsistentErrorResponse;
  /** Additional error context */
  context?: Record<string, any>;
  /** Whether this error is retryable */
  retryable: boolean;
  /** Suggested retry delay in milliseconds */
  retryDelay?: number;
}

/**
 * Backend service response metadata
 */
export interface BackendServiceResponseMetadata {
  /** Request ID for correlation */
  requestId: string;
  /** Response timestamp */
  timestamp: string;
  /** Processing time in milliseconds */
  processingTime?: number;
  /** API version */
  version: string;
  /** Whether response came from cache */
  fromCache?: boolean;
  /** Backend service identifier */
  serviceId?: string;
}

/**
 * Backend service request configuration
 */
export interface BackendServiceRequestConfig {
  /** Custom request ID */
  requestId?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Number of retry attempts */
  retries?: number;
  /** Custom headers */
  headers?: Record<string, string>;
  /** Include request metadata */
  includeMetadata?: boolean;
  /** Enable response validation */
  validateResponse?: boolean;
}

/**
 * Backend service response wrapper with metadata
 */
export interface BackendServiceResponse<T> {
  /** Response data */
  data: T;
  /** Response metadata */
  metadata: BackendServiceResponseMetadata;
  /** Original consistent response */
  originalResponse: ConsistentSuccessResponse<T>;
}

/**
 * Request/Response interceptor for backend service
 */
export interface BackendServiceInterceptor {
  /** Intercept requests before sending */
  onRequest?: (
    config: BackendServiceRequestConfig,
  ) => BackendServiceRequestConfig | Promise<BackendServiceRequestConfig>;
  /** Intercept successful responses */
  onResponse?: <T>(
    response: BackendServiceResponse<T>,
  ) => BackendServiceResponse<T> | Promise<BackendServiceResponse<T>>;
  /** Intercept error responses */
  onError?: (
    error: BackendServiceError,
  ) => BackendServiceError | Promise<BackendServiceError>;
}

/**
 * Backend service analytics data
 */
export interface BackendServiceAnalytics {
  /** Total requests made */
  totalRequests: number;
  /** Successful requests */
  successfulRequests: number;
  /** Failed requests */
  failedRequests: number;
  /** Average processing time */
  averageProcessingTime: number;
  /** Error distribution by code */
  errorDistribution: Record<BackendErrorCode, number>;
  /** Request distribution by endpoint */
  endpointDistribution: Record<string, number>;
  /** Last request timestamp */
  lastRequestTimestamp: string;
}

// ============================================================================
// UTILITY FUNCTIONS FOR BACKEND SERVICE INTEGRATION
// ============================================================================

/**
 * Creates a BackendServiceError from a consistent error response
 * @param response - Consistent error response
 * @returns Structured backend service error
 */
export function createBackendServiceError(
  response: ConsistentErrorResponse,
): BackendServiceError {
  const error = new Error(response.error.message) as BackendServiceError;

  error.name = "BackendServiceError";
  error.code = response.error.code;
  error.severity = response.error.severity;
  error.statusCode = response.error.status_code;
  error.requestId = response.meta.request_id;
  error.processingTime = response.meta.processing_time_ms;
  error.originalResponse = response;
  error.context = response.error.context;
  error.retryable = isRetryableError(response.error);
  error.retryDelay = getSuggestedRetryDelay(response.error);

  return error;
}

/**
 * Helper function to determine if an error is retryable
 */
function isRetryableError(error: {
  code: BackendErrorCode;
  severity: ErrorSeverity;
}): boolean {
  const retryableErrors: BackendErrorCode[] = [
    "service_unavailable",
    "external_service_unavailable",
    "timeout_error",
    "network_error",
    "api_rate_limit_exceeded",
    "database_error",
  ];

  return retryableErrors.includes(error.code) || error.severity === "low";
}

/**
 * Helper function to get suggested retry delay
 */
function getSuggestedRetryDelay(error: { code: BackendErrorCode }): number {
  switch (error.code) {
    case "api_rate_limit_exceeded":
      return 60000; // 1 minute
    case "service_unavailable":
    case "external_service_unavailable":
      return 30000; // 30 seconds
    case "timeout_error":
    case "network_error":
      return 5000; // 5 seconds
    default:
      return 1000; // 1 second
  }
}

/**
 * Wraps backend service response data with metadata
 * @param response - Consistent success response
 * @returns Backend service response with metadata
 */
export function wrapBackendServiceResponse<T>(
  response: ConsistentSuccessResponse<T>,
): BackendServiceResponse<T> {
  return {
    data: response.data,
    metadata: {
      requestId: response.meta.request_id,
      timestamp: response.meta.timestamp,
      processingTime: response.meta.processing_time_ms,
      version: response.meta.version,
    },
    originalResponse: response,
  };
}

/**
 * Validates that a response follows the consistent format
 * @param response - Response to validate
 * @returns Whether response is valid
 */
export function validateConsistentResponse(
  response: any,
): response is ConsistentApiResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    typeof response.success === "boolean" &&
    typeof response.meta === "object" &&
    response.meta !== null &&
    typeof response.meta.request_id === "string" &&
    typeof response.meta.timestamp === "string"
  );
}

/**
 * Extracts error information from any error object
 * @param error - Error object
 * @returns Structured error information
 */
export function extractErrorInfo(error: any): {
  code: BackendErrorCode;
  message: string;
  severity: ErrorSeverity;
  retryable: boolean;
} {
  if (error instanceof Error && "code" in error) {
    const backendError = error as BackendServiceError;
    return {
      code: backendError.code || "unknown_error",
      message: backendError.message,
      severity: backendError.severity || "medium",
      retryable: backendError.retryable || false,
    };
  }

  return {
    code: "unknown_error",
    message: error?.message || "An unknown error occurred",
    severity: "medium",
    retryable: true,
  };
}
