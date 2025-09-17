/**
 * Response Utilities for Consistent API Integration
 *
 * This module provides utility functions for working with the new consistent
 * response format from the backend, including unwrapping, validation, and
 * error handling helpers.
 *
 * @see /types/consistent-response.ts for type definitions
 * @see /types/backend.ts for backend service integration
 */

import {
  type BackendServiceError,
  type BackendServiceResponse,
  type BackendServiceResponseMetadata,
  createBackendServiceError,
  extractErrorInfo,
  validateConsistentResponse,
  wrapBackendServiceResponse,
} from "@/types/backend";
import {
  type BackendErrorCode,
  type ConsistentApiResponse,
  type ConsistentErrorResponse,
  type ConsistentSuccessResponse,
  type ErrorInfo,
  type ErrorSeverity,
  extractProcessingTime,
  extractRequestId,
  extractTimestamp,
  getSuggestedRetryDelay,
  isConsistentResponse,
  isErrorResponse,
  isRetryableError,
  isSuccessResponse,
  mapErrorCodeToCategory,
  type ResponseMeta,
  unwrapResponseData,
  unwrapResponseDataWithFallback,
} from "@/types/consistent-response";

// ============================================================================
// RESPONSE PROCESSING UTILITIES
// ============================================================================

/**
 * Processes a consistent API response and returns either the data or throws an error
 * @param response - Consistent API response
 * @returns Unwrapped data
 * @throws BackendServiceError if response is an error
 */
export function processConsistentResponse<T>(
  response: ConsistentApiResponse<T>,
): T {
  if (isSuccessResponse(response)) {
    return response.data;
  }

  throw createBackendServiceError(response);
}

/**
 * Safely processes a consistent API response with error handling
 * @param response - Consistent API response
 * @param fallback - Fallback value if response is an error
 * @returns Data or fallback value
 */
export function safeProcessConsistentResponse<T>(
  response: ConsistentApiResponse<T>,
  fallback: T,
): T {
  try {
    return processConsistentResponse(response);
  } catch {
    return fallback;
  }
}

/**
 * Processes a consistent API response and returns a result object
 * @param response - Consistent API response
 * @returns Result object with success/error information
 */
export function processConsistentResponseToResult<T>(
  response: ConsistentApiResponse<T>,
): {
  success: boolean;
  data?: T;
  error?: BackendServiceError;
  metadata: ResponseMeta;
} {
  if (isSuccessResponse(response)) {
    return {
      success: true,
      data: response.data,
      metadata: response.meta,
    };
  }

  return {
    success: false,
    error: createBackendServiceError(response),
    metadata: response.meta,
  };
}

// ============================================================================
// REQUEST ID UTILITIES
// ============================================================================

/**
 * Generates a unique request ID for correlation
 * @param prefix - Optional prefix for the request ID
 * @returns Generated request ID
 */
export function generateRequestId(prefix: string = "req"): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Validates a request ID format
 * @param requestId - Request ID to validate
 * @returns Whether the request ID is valid
 */
export function isValidRequestId(requestId: string): boolean {
  return typeof requestId === "string" && requestId.length > 0;
}

/**
 * Extracts correlation information from a consistent response
 * @param response - Consistent API response
 * @returns Correlation information
 */
export function extractCorrelationInfo<T>(response: ConsistentApiResponse<T>): {
  requestId: string;
  timestamp: string;
  processingTime?: number;
} {
  return {
    requestId: extractRequestId(response),
    timestamp: extractTimestamp(response),
    processingTime: extractProcessingTime(response) || undefined,
  };
}

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Creates a user-friendly error message from a backend error
 * @param error - Backend service error
 * @returns User-friendly error message
 */
export function createUserFriendlyErrorMessage(
  error: BackendServiceError,
): string {
  const errorInfo = mapErrorCodeToCategory(error.code);

  switch (errorInfo) {
    case "validation":
      return "Please check your input and try again.";
    case "authentication":
      return "Please log in to continue.";
    case "authorization":
      return "You don't have permission to perform this action.";
    case "resource":
      return "The requested resource could not be found.";
    case "business_rule":
      return "This action is not allowed by business rules.";
    case "external_service":
      return "External service is temporarily unavailable. Please try again later.";
    case "network":
      return "Network error. Please check your connection and try again.";
    case "system":
      return "System error. Please try again later.";
    default:
      return "An unexpected error occurred. Please try again.";
  }
}

/**
 * Determines the appropriate action for an error
 * @param error - Backend service error
 * @returns Suggested action
 */
export function getErrorAction(error: BackendServiceError): {
  action:
    | "retry"
    | "login"
    | "contact_support"
    | "check_input"
    | "wait"
    | "reload";
  delay?: number;
  message: string;
} {
  const category = mapErrorCodeToCategory(error.code);

  switch (category) {
    case "authentication":
      return {
        action: "login",
        message: "Please log in again to continue.",
      };

    case "validation":
      return {
        action: "check_input",
        message: "Please review and correct your input.",
      };

    case "network":
    case "external_service":
      return {
        action: "retry",
        delay: error.retryDelay,
        message: `Please try again${error.retryDelay ? ` in ${Math.ceil(error.retryDelay / 1000)} seconds` : ""}.`,
      };

    case "system":
      if (error.severity === "critical") {
        return {
          action: "contact_support",
          message: "Please contact support for assistance.",
        };
      }
      return {
        action: "retry",
        delay: error.retryDelay,
        message: "Please try again in a moment.",
      };

    case "authorization":
      return {
        action: "contact_support",
        message: "Please contact your administrator for access.",
      };

    default:
      return {
        action: "retry",
        message: "Please try again.",
      };
  }
}

/**
 * Formats an error for logging purposes
 * @param error - Backend service error
 * @param includeStack - Whether to include stack trace
 * @returns Formatted error information
 */
export function formatErrorForLogging(
  error: BackendServiceError,
  includeStack: boolean = false,
): {
  level: "error" | "warn" | "info";
  message: string;
  metadata: Record<string, any>;
} {
  const level =
    error.severity === "critical"
      ? "error"
      : error.severity === "high"
        ? "error"
        : error.severity === "medium"
          ? "warn"
          : "info";

  const metadata: Record<string, any> = {
    error_code: error.code,
    severity: error.severity,
    status_code: error.statusCode,
    request_id: error.requestId,
    processing_time: error.processingTime,
    retryable: error.retryable,
    retry_delay: error.retryDelay,
    category: mapErrorCodeToCategory(error.code),
  };

  if (error.context) {
    metadata.context = error.context;
  }

  if (includeStack && error.stack) {
    metadata.stack = error.stack;
  }

  return {
    level,
    message: `Backend API Error: ${error.message}`,
    metadata,
  };
}

// ============================================================================
// RESPONSE TRANSFORMATION UTILITIES
// ============================================================================

/**
 * Transforms a consistent response to legacy format for backward compatibility
 * @param response - Consistent API response
 * @param transformer - Custom transformation function
 * @returns Legacy format response
 */
export function transformToLegacyFormat<T, L>(
  response: ConsistentApiResponse<T>,
  transformer: (data: T) => L,
): L | { error: string; error_code: string; request_id?: string } {
  if (isSuccessResponse(response)) {
    return transformer(response.data);
  }

  return {
    error: response.error.message,
    error_code: response.error.code,
    request_id: response.meta.request_id,
  };
}

/**
 * Transforms legacy response to consistent format
 * @param legacyResponse - Legacy response format
 * @param transformer - Custom transformation function
 * @returns Consistent API response
 */
export function transformFromLegacyFormat<T, L>(
  legacyResponse:
    | L
    | { error: string; error_code?: string; request_id?: string },
  transformer: (legacy: L) => T,
): ConsistentApiResponse<T> {
  if (
    typeof legacyResponse === "object" &&
    legacyResponse !== null &&
    "error" in legacyResponse
  ) {
    const errorResponse = legacyResponse as {
      error: string;
      error_code?: string;
      request_id?: string;
    };

    return {
      success: false,
      data: null,
      error: {
        code: (errorResponse.error_code as BackendErrorCode) || "unknown_error",
        message: errorResponse.error,
        severity: "medium",
        status_code: 500,
      },
      meta: {
        request_id: errorResponse.request_id || generateRequestId(),
        timestamp: new Date().toISOString(),
        version: "1.0",
      },
    };
  }

  return {
    success: true,
    data: transformer(legacyResponse as L),
    error: null,
    meta: {
      request_id: generateRequestId(),
      timestamp: new Date().toISOString(),
      version: "1.0",
    },
  };
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validates response structure and throws detailed error if invalid
 * @param response - Response to validate
 * @param expectedFields - Expected fields in the data
 * @throws Error if validation fails
 */
export function validateResponseStructure<T>(
  response: any,
  expectedFields?: (keyof T)[],
): asserts response is ConsistentApiResponse<T> {
  if (!isConsistentResponse(response)) {
    throw new Error("Response does not follow consistent format");
  }

  if (isSuccessResponse(response) && expectedFields) {
    const missingFields = expectedFields.filter(
      (field) => !(field in response.data),
    );
    if (missingFields.length > 0) {
      throw new Error(
        `Response missing expected fields: ${missingFields.join(", ")}`,
      );
    }
  }
}

/**
 * Validates and processes a response with custom validation
 * @param response - Response to validate and process
 * @param validator - Custom validation function
 * @returns Processed data
 */
export function validateAndProcessResponse<T, R>(
  response: ConsistentApiResponse<T>,
  validator: (data: T) => R,
): R {
  const data = processConsistentResponse(response);
  return validator(data);
}

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

/**
 * Tracks response performance metrics
 * @param response - Consistent API response
 * @returns Performance metrics
 */
export function trackResponseMetrics<T>(response: ConsistentApiResponse<T>): {
  requestId: string;
  processingTime?: number;
  timestamp: string;
  isError: boolean;
  errorCode?: BackendErrorCode;
} {
  return {
    requestId: extractRequestId(response),
    processingTime: extractProcessingTime(response) || undefined,
    timestamp: extractTimestamp(response),
    isError: isErrorResponse(response),
    errorCode: isErrorResponse(response) ? response.error.code : undefined,
  };
}

/**
 * Creates performance summary for multiple responses
 * @param responses - Array of consistent API responses
 * @returns Performance summary
 */
export function createPerformanceSummary(
  responses: ConsistentApiResponse<any>[],
): {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageProcessingTime: number;
  errorDistribution: Record<string, number>;
} {
  const metrics = responses.map(trackResponseMetrics);

  const successfulRequests = metrics.filter((m) => !m.isError).length;
  const failedRequests = metrics.filter((m) => m.isError).length;

  const processingTimes = metrics
    .map((m) => m.processingTime)
    .filter((time): time is number => typeof time === "number");

  const averageProcessingTime =
    processingTimes.length > 0
      ? processingTimes.reduce((sum, time) => sum + time, 0) /
        processingTimes.length
      : 0;

  const errorDistribution = metrics
    .filter((m) => m.isError && m.errorCode)
    .reduce(
      (dist, m) => {
        const code = m.errorCode!;
        dist[code] = (dist[code] || 0) + 1;
        return dist;
      },
      {} as Record<string, number>,
    );

  return {
    totalRequests: responses.length,
    successfulRequests,
    failedRequests,
    averageProcessingTime,
    errorDistribution,
  };
}
