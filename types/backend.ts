import type { ZodIssue } from "zod";
import type { SaveTopicItem } from "./api";
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
  content_type: string;
  content_type_other?: string | null;
  platform?: string | null;
  platform_other?: string | null;
  audience: string[];
  purpose: string[];
  purpose_other?: string | null;
  tone: string[];
  tone_other?: string | null;
  notes?: string | null;
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

/**
 * Error severity levels for user messaging
 */
export type ErrorSeverity = "low" | "medium" | "high" | "critical";

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
