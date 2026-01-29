/**
 * Consistent Response Type Definitions
 *
 * This module defines TypeScript interfaces for the new consistent response format
 * from the Rext backend API. These types ensure type safety and provide utilities
 * for working with the standardized response structure.
 *
 * @see Backend Response Schema: src/api/schemas/response_schemas.py
 * @see Frontend API Types: /types/api.ts
 * @see Backend Integration: /types/backend.ts
 */

// ============================================================================
// CORE CONSISTENT RESPONSE TYPES
// ============================================================================

/**
 * Response metadata included in all API responses
 */
export interface ResponseMeta {
  /** Unique request identifier for correlation and debugging */
  request_id: string;
  /** Response timestamp in ISO 8601 format */
  timestamp: string;
  /** Processing time in milliseconds (optional) */
  processing_time_ms?: number;
  /** API version */
  version: string;
}

/**
 * Error severity levels matching backend classification
 */
export type ErrorSeverity = "low" | "medium" | "high" | "critical";

/**
 * Backend error codes - comprehensive enum matching backend ErrorCode
 */
export type BackendErrorCode =
  // Validation Errors
  | "validation_failed"
  | "missing_field"
  | "invalid_format"
  | "invalid_value"
  | "field_too_long"
  | "field_too_short"
  | "invalid_email_format"
  | "invalid_phone_format"
  | "invalid_url_format"
  | "invalid_date_format"
  | "duplicate_value"
  | "value_out_of_range"
  | "invalid_file_type"
  | "file_too_large"
  | "missing_required_field"

  // Authentication & Authorization Errors
  | "unauthorized"
  | "forbidden"
  | "token_expired"
  | "token_invalid"
  | "insufficient_permissions"
  | "account_locked"
  | "account_suspended"
  | "authentication_required"
  | "invalid_credentials"
  | "session_expired"

  // Resource Errors
  | "resource_not_found"
  | "duplicate_resource"
  | "resource_conflict"
  | "resource_locked"
  | "resource_unavailable"
  | "resource_limit_exceeded"

  // Business Logic Errors
  | "business_rule_violation"
  | "operation_not_allowed"
  | "workflow_violation"
  | "dependency_violation"
  | "state_transition_error"

  // External Service Errors
  | "external_service_error"
  | "external_service_unavailable"
  | "api_rate_limit_exceeded"
  | "resouce_limit_exceeded"
  | "third_party_service_error"

  // System Errors
  | "internal_server_error"
  | "service_unavailable"
  | "database_error"
  | "configuration_error"
  | "timeout_error"
  | "network_error"
  | "storage_error"
  | "memory_error"
  | "unknown_error"
  | "invalid_response_format";

/**
 * Detailed error information for specific fields (validation errors)
 */
export interface ErrorDetail {
  /** Field name that caused the error (optional) */
  field?: string;
  /** Human-readable error message */
  message: string;
  /** Specific error code for this detail */
  code: string;
  /** The invalid value that caused the error (optional, filtered for security) */
  value?: unknown;
}

/**
 * Comprehensive error information structure
 */
export interface ErrorInfo {
  /** Backend error code for programmatic handling */
  code: BackendErrorCode;
  /** Human-readable error message */
  message: string;
  /** Error severity level */
  severity: ErrorSeverity;
  /** HTTP status code */
  status_code: number;
  /** Detailed error information (e.g., validation errors) */
  details?: ErrorDetail[];
  /** Additional context for debugging (filtered in production) */
  context?: Record<string, unknown>;
}

/**
 * Standardized success response wrapper
 */
export interface ConsistentSuccessResponse<T = unknown> {
  /** Always true for success responses */
  success: true;
  /** Response data of generic type T */
  data: T;
  /** Always null for success responses */
  error: null;
  /** Response metadata */
  meta: ResponseMeta;
}

/**
 * Standardized error response wrapper
 */
export interface ConsistentErrorResponse {
  /** Always false for error responses */
  success: false;
  /** Always null for error responses */
  data: null;
  /** Error information */
  error: ErrorInfo;
  /** Response metadata */
  meta: ResponseMeta;
}

/**
 * Union type for all consistent API responses
 */
export type ConsistentApiResponse<T = unknown> =
  | ConsistentSuccessResponse<T>
  | ConsistentErrorResponse;

// ============================================================================
// TYPE GUARDS AND UTILITIES
// ============================================================================

/**
 * Type guard to check if a response is a success response
 */
export function isSuccessResponse<T>(
  response: ConsistentApiResponse<T>,
): response is ConsistentSuccessResponse<T> {
  return response.success === true;
}

/**
 * Type guard to check if a response is an error response
 */
export function isErrorResponse<T>(
  response: ConsistentApiResponse<T>,
): response is ConsistentErrorResponse {
  return response.success === false;
}

/**
 * Type guard to check if an object follows the consistent response format
 */
export function isConsistentResponse(
  obj: unknown,
): obj is ConsistentApiResponse {
  if (
    typeof obj !== "object" ||
    obj === null ||
    !("success" in obj) ||
    typeof (obj as { success: unknown }).success !== "boolean" ||
    !("meta" in obj)
  ) {
    return false;
  }

  const meta = (obj as { meta: unknown }).meta;
  if (typeof meta !== "object" || meta === null) {
    return false;
  }

  const metaRecord = meta as Record<string, unknown>;
  return (
    typeof metaRecord.request_id === "string" &&
    typeof metaRecord.timestamp === "string"
  );
}

/**
 * Type guard to check if an error is a validation error with field details
 */
export function isValidationError(error: ErrorInfo): boolean {
  return error.code === "validation_failed" && Array.isArray(error.details);
}

/**
 * Type guard to check if an error is a business rule violation
 */
export function isBusinessRuleError(error: ErrorInfo): boolean {
  return error.code === "business_rule_violation";
}

/**
 * Type guard to check if an error is a resource-related error
 */
export function isResourceError(error: ErrorInfo): boolean {
  return (
    error.code.includes("resource_") || error.code === "duplicate_resource"
  );
}

/**
 * Type guard to check if an error is an authentication/authorization error
 */
export function isAuthError(error: ErrorInfo): boolean {
  return (
    error.code === "unauthorized" ||
    error.code === "forbidden" ||
    error.code === "token_expired" ||
    error.code === "token_invalid" ||
    error.code === "authentication_required" ||
    error.code === "insufficient_permissions"
  );
}

// ============================================================================
// RESPONSE UNWRAPPING UTILITIES
// ============================================================================

/**
 * Safely unwraps data from a consistent success response
 * @param response - The consistent API response
 * @returns The unwrapped data or throws an error
 */
export function unwrapResponseData<T>(response: ConsistentApiResponse<T>): T {
  if (isSuccessResponse(response)) {
    return response.data;
  }

  throw new Error(
    `API Error [${response.error.code}]: ${response.error.message}`,
  );
}

/**
 * Safely unwraps data with a fallback value
 * @param response - The consistent API response
 * @param fallback - Fallback value if response is an error
 * @returns The unwrapped data or fallback value
 */
export function unwrapResponseDataWithFallback<T>(
  response: ConsistentApiResponse<T>,
  fallback: T,
): T {
  return isSuccessResponse(response) ? response.data : fallback;
}

/**
 * Extracts request ID from any consistent response
 * @param response - The consistent API response
 * @returns The request ID for correlation
 */
export function extractRequestId<T>(
  response: ConsistentApiResponse<T>,
): string {
  return response.meta.request_id;
}

/**
 * Extracts processing time from response metadata
 * @param response - The consistent API response
 * @returns Processing time in milliseconds or null if not available
 */
export function extractProcessingTime<T>(
  response: ConsistentApiResponse<T>,
): number | null {
  return response.meta.processing_time_ms ?? null;
}

/**
 * Extracts timestamp from response metadata
 * @param response - The consistent API response
 * @returns ISO 8601 timestamp string
 */
export function extractTimestamp<T>(
  response: ConsistentApiResponse<T>,
): string {
  return response.meta.timestamp;
}

// ============================================================================
// ERROR MAPPING UTILITIES
// ============================================================================

/**
 * Maps backend error codes to frontend error categories for compatibility
 */
export type FrontendErrorCategory =
  | "validation"
  | "authentication"
  | "authorization"
  | "resource"
  | "business_rule"
  | "external_service"
  | "system"
  | "network"
  | "unknown";

/**
 * Maps a backend error code to a frontend error category
 * @param errorCode - Backend error code
 * @returns Frontend error category
 */
export function mapErrorCodeToCategory(
  errorCode: BackendErrorCode,
): FrontendErrorCategory {
  // Validation errors
  if (
    errorCode.includes("validation") ||
    errorCode.includes("invalid") ||
    errorCode.includes("missing") ||
    errorCode.includes("duplicate_value") ||
    errorCode.includes("out_of_range") ||
    errorCode.includes("too_long") ||
    errorCode.includes("too_short") ||
    errorCode.includes("format")
  ) {
    return "validation";
  }

  // Authentication errors
  if (
    errorCode.includes("token") ||
    errorCode.includes("credentials") ||
    errorCode === "authentication_required"
  ) {
    return "authentication";
  }

  // Authorization errors
  if (
    errorCode === "unauthorized" ||
    errorCode === "forbidden" ||
    errorCode.includes("permissions") ||
    errorCode.includes("account_")
  ) {
    return "authorization";
  }

  // Resource errors
  if (errorCode.includes("resource_") || errorCode === "duplicate_resource") {
    return "resource";
  }

  // Business rule errors
  if (
    errorCode.includes("business_rule") ||
    errorCode.includes("workflow") ||
    errorCode.includes("operation_not_allowed") ||
    errorCode.includes("dependency")
  ) {
    return "business_rule";
  }

  // External service errors
  if (
    errorCode.includes("external_service") ||
    errorCode.includes("third_party") ||
    errorCode.includes("api_rate_limit")
  ) {
    return "external_service";
  }

  // Network errors
  if (errorCode.includes("network") || errorCode.includes("timeout")) {
    return "network";
  }

  // System errors
  if (
    errorCode.includes("server_error") ||
    errorCode.includes("service_unavailable") ||
    errorCode.includes("database") ||
    errorCode.includes("configuration") ||
    errorCode.includes("storage") ||
    errorCode.includes("memory")
  ) {
    return "system";
  }

  return "unknown";
}

/**
 * Determines if an error is retryable based on its code and severity
 * @param error - Error information
 * @returns Whether the error suggests a retry might succeed
 */
export function isRetryableError(error: ErrorInfo): boolean {
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
 * Gets suggested retry delay in milliseconds based on error type
 * @param error - Error information
 * @returns Suggested delay in milliseconds
 */
export function getSuggestedRetryDelay(error: ErrorInfo): number {
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

// ============================================================================
// LEGACY COMPATIBILITY TYPES
// ============================================================================

/**
 * Adapter type for converting consistent responses to legacy format
 * Used during migration period to maintain backward compatibility
 */
type LegacyErrorShape = {
  error: string;
  error_code?: BackendErrorCode;
  details?: ErrorDetail[];
  request_id?: string;
  timestamp?: string;
  processing_time_ms?: number;
};

export interface LegacyResponseAdapter<T, L = unknown> {
  /** Convert consistent response to legacy format */
  toLegacy(response: ConsistentApiResponse<T>): L | LegacyErrorShape;
  /** Convert legacy response to consistent format */
  fromLegacy(legacyResponse: L | LegacyErrorShape): ConsistentApiResponse<T>;
}

/**
 * Creates a legacy adapter for gradual migration
 * @param dataMapper - Function to map between data formats
 * @returns Legacy response adapter
 */
export function createLegacyAdapter<T, L>(dataMapper: {
  toLegacy: (data: T) => L;
  fromLegacy: (legacy: L) => T;
}): LegacyResponseAdapter<T, L> {
  return {
    toLegacy(response: ConsistentApiResponse<T>) {
      if (isSuccessResponse(response)) {
        return {
          ...dataMapper.toLegacy(response.data),
          request_id: response.meta.request_id,
          timestamp: response.meta.timestamp,
          processing_time_ms: response.meta.processing_time_ms,
        };
      }

      return {
        error: response.error.message,
        error_code: response.error.code,
        details: response.error.details,
        request_id: response.meta.request_id,
      };
    },

    fromLegacy(legacyResponse: L | LegacyErrorShape): ConsistentApiResponse<T> {
      if (
        typeof legacyResponse === "object" &&
        legacyResponse !== null &&
        "error" in legacyResponse
      ) {
        const legacyError = legacyResponse as LegacyErrorShape;
        return {
          success: false,
          data: null,
          error: {
            code: legacyError.error_code || "unknown_error",
            message: legacyError.error,
            severity: "medium",
            status_code: 500,
            details: legacyError.details,
          },
          meta: {
            request_id: legacyError.request_id || "unknown",
            timestamp: new Date().toISOString(),
            version: "1.0",
          },
        };
      }

      const legacySuccess = legacyResponse as L & {
        request_id?: string;
        timestamp?: string;
        processing_time_ms?: number;
      };

      return {
        success: true,
        data: dataMapper.fromLegacy(legacySuccess),
        error: null,
        meta: {
          request_id: legacySuccess.request_id || "unknown",
          timestamp: legacySuccess.timestamp || new Date().toISOString(),
          processing_time_ms: legacySuccess.processing_time_ms,
          version: "1.0",
        },
      };
    },
  };
}
