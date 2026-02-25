import type {
  BackendError,
  BackendErrorType,
  ErrorRecoveryAction,
  RetryConfig,
} from "@/types/backend";
import type { ErrorSeverity } from "@/types/consistent-response";
import { ApiError } from "@/lib/api-client/core";
import { safeJsonParse } from "./utils";
import { sanitizeObject } from "@/lib/sensitive-fields";

/**
 * Default retry configuration for backend requests
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitterFactor: 0.1,
  retryableErrors: [
    "network_error",
    "timeout_error",
    "server_error",
    "rate_limit_error",
    "abort_error",
  ],
};

/**
 * Error classification mappings
 */
const ERROR_MAPPINGS: Record<
  BackendErrorType,
  {
    severity: ErrorSeverity;
    userMessage: string;
    recoveryActions: ErrorRecoveryAction[];
  }
> = {
  network_error: {
    severity: "high",
    userMessage:
      "Unable to connect to our servers. Please check your internet connection and try again.",
    recoveryActions: ["retry", "check_connection", "reload_page"],
  },
  timeout_error: {
    severity: "medium",
    userMessage:
      "The request is taking longer than expected. Please try again.",
    recoveryActions: ["retry", "go_back"],
  },
  server_error: {
    severity: "high",
    userMessage:
      "Our servers are experiencing issues. Please try again in a few minutes.",
    recoveryActions: ["retry", "contact_support"],
  },
  configuration_error: {
    severity: "critical",
    userMessage:
      "There's a configuration issue. Please contact support if this persists.",
    recoveryActions: ["contact_support", "reload_page"],
  },
  parsing_error: {
    severity: "medium",
    userMessage:
      "We received an unexpected response. Please try generating topics again.",
    recoveryActions: ["retry", "go_back"],
  },
  validation_error: {
    severity: "low",
    userMessage: "Please check your inputs and try again.",
    recoveryActions: ["go_back", "retry_with_changes"],
  },
  rate_limit_error: {
    severity: "medium",
    userMessage:
      "You're making requests too quickly. Please wait a moment and try again.",
    recoveryActions: ["retry"],
  },
  authentication_error: {
    severity: "medium",
    userMessage:
      "Authentication failed. Please refresh the page and try again.",
    recoveryActions: ["reload_page", "contact_support"],
  },
  cors_error: {
    severity: "critical",
    userMessage:
      "Connection blocked by browser security. Please contact support.",
    recoveryActions: ["contact_support", "reload_page"],
  },
  abort_error: {
    severity: "low",
    userMessage: "Request was cancelled. You can try again.",
    recoveryActions: ["retry", "go_back"],
  },
  unknown_error: {
    severity: "medium",
    userMessage:
      "An unexpected error occurred. Please try again or contact support.",
    recoveryActions: ["retry", "contact_support"],
  },
};

/**
 * Classify an error and return user-friendly information
 */
export function classifyError(
  error: unknown,
  requestId?: string,
  retryAttempt?: number,
): BackendError {
  const timestamp = new Date().toISOString();

  if (error instanceof Error) {
    let errorType: BackendErrorType = "unknown_error";
    const technicalMessage = error.message;
    let statusCode: number | undefined;

    // Check for ApiError first — use status code for reliable classification
    if (error instanceof ApiError) {
      statusCode = error.statusCode;

      if (statusCode >= 500) {
        errorType = "server_error";
      } else if (statusCode === 429) {
        errorType = "rate_limit_error";
      } else if (statusCode === 401 || statusCode === 403) {
        errorType = "authentication_error";
      } else if (statusCode >= 400) {
        errorType = "validation_error";
      }
    }
    // Network and fetch-related errors (Fallback)
    else if (error.name === "AbortError") {
      errorType = "abort_error";
    } else if (error.name === "TimeoutError") {
      errorType = "timeout_error";
    } else if (error.message.includes("fetch")) {
      errorType = "network_error";
    } else if (error.message.includes("CORS")) {
      errorType = "cors_error";
    }

    // Backend API specific errors (Fallback for non-ApiError string matches if any remain)
    else if (error.message.includes("Backend API error:")) {
      const statusMatch = error.message.match(/(\d{3})/);
      if (statusMatch) {
        statusCode = parseInt(statusMatch[1], 10);

        if (statusCode >= 500) {
          errorType = "server_error";
        } else if (statusCode === 429) {
          errorType = "rate_limit_error";
        } else if (statusCode === 401 || statusCode === 403) {
          errorType = "authentication_error";
        } else if (statusCode >= 400) {
          errorType = "validation_error";
        }
      }
    }

    // Configuration errors
    else if (
      error.message.includes("Backend API URL") ||
      error.message.includes("configuration")
    ) {
      errorType = "configuration_error";
    }

    // Response parsing errors
    else if (
      error.message.includes("Invalid response") ||
      error.message.includes("parsing")
    ) {
      errorType = "parsing_error";
    }

    const mapping = ERROR_MAPPINGS[errorType];

    return {
      type: errorType,
      message: mapping.userMessage,
      technicalMessage,
      statusCode,
      severity: mapping.severity,
      recoveryActions: mapping.recoveryActions,
      isRetryable: DEFAULT_RETRY_CONFIG.retryableErrors.includes(errorType),
      retryAttempt,
      requestId,
      timestamp,
      originalError: error,
    };
  }

  // Handle non-Error objects
  const mapping = ERROR_MAPPINGS.unknown_error;
  let technicalMessage: string;

  if (typeof error === "object" && error !== null) {
    try {
      technicalMessage = JSON.stringify(error, null, 2);
    } catch {
      technicalMessage = `[object ${error.constructor?.name || "Object"}]`;
    }
  } else {
    technicalMessage = String(error);
  }

  return {
    type: "unknown_error",
    message: mapping.userMessage,
    technicalMessage,
    severity: mapping.severity,
    recoveryActions: mapping.recoveryActions,
    isRetryable: false,
    retryAttempt,
    requestId,
    timestamp,
    originalError: error instanceof Error ? error : new Error(technicalMessage),
  };
}

/**
 * Calculate retry delay with exponential backoff and jitter
 */
export function calculateRetryDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): number {
  const exponentialDelay = Math.min(
    config.initialDelay * config.backoffMultiplier ** (attempt - 1),
    config.maxDelay,
  );

  // Add jitter to prevent thundering herd
  const jitter = exponentialDelay * config.jitterFactor * Math.random();

  return Math.round(exponentialDelay + jitter);
}

/**
 * Check if an error should trigger a retry
 */
export function shouldRetry(
  error: BackendError,
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): boolean {
  return (
    error.isRetryable &&
    attempt <= config.maxAttempts &&
    config.retryableErrors.includes(error.type)
  );
}

/**
 * Sanitize error data for logging (remove sensitive information)
 */
export function sanitizeErrorForLogging(error: BackendError): Omit<
  BackendError,
  "originalError"
> & {
  stackTrace?: string;
  sanitizedContext?: Record<string, unknown>;
} {
  // Use recursive sanitization for context
  const sanitizedContext = error.context
    ? (sanitizeObject(error.context) as Record<string, unknown>)
    : undefined;

  return {
    type: error.type,
    message: error.message,
    technicalMessage: error.technicalMessage,
    statusCode: error.statusCode,
    severity: error.severity,
    recoveryActions: error.recoveryActions,
    isRetryable: error.isRetryable,
    retryAttempt: error.retryAttempt,
    requestId: error.requestId,
    timestamp: error.timestamp,
    stackTrace: error.originalError?.stack,
    sanitizedContext,
  };
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Check if the browser is online
 */
export function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

/**
 * Extract specific validation errors from backend response
 */
export function extractValidationErrors(error: BackendError): string[] {
  if (error.type !== "validation_error" || !error.context?.responseText) {
    return [];
  }

  const response = safeJsonParse<Record<string, unknown>>(
    error.context.responseText as string,
  );
  if (response?.detail && Array.isArray(response.detail)) {
    return response.detail.map((detail: { loc?: string[]; msg?: string }) => {
      if (detail.loc && detail.msg) {
        const fieldPath = detail.loc.slice(1).join(".");
        return `${fieldPath}: ${detail.msg}`;
      }
      return detail.msg || "Unknown validation error";
    });
  }

  return [];
}

/**
 * Get contextual error message based on operation
 */
export function getContextualErrorMessage(
  error: BackendError,
  operation:
    | "topic_generation"
    | "form_validation"
    | "data_save" = "topic_generation",
): string {
  const baseMessage = error.message;

  switch (operation) {
    case "topic_generation":
      if (error.type === "timeout_error") {
        return "Topic generation is taking longer than expected. This sometimes happens with complex requests.";
      }
      if (error.type === "server_error") {
        return "Our AI service is temporarily unavailable. Your form data has been saved and you can try again shortly.";
      }
      if (error.type === "validation_error") {
        const validationErrors = extractValidationErrors(error);
        if (validationErrors.length > 0) {
          return `Missing required fields: ${validationErrors.map((err) => err.split(":")[0]).join(", ")}`;
        }
      }
      break;

    case "form_validation":
      if (error.type === "validation_error") {
        const validationErrors = extractValidationErrors(error);
        if (validationErrors.length > 0) {
          return `Validation errors: ${validationErrors.join(", ")}`;
        }
        return "Please review your form entries and make sure all required fields are completed correctly.";
      }
      break;

    case "data_save":
      if (error.type === "network_error") {
        return "Unable to save your data. Please check your connection and try again.";
      }
      break;
  }

  return baseMessage;
}

/**
 * Check if error indicates backend is completely unavailable
 */
export function isBackendUnavailable(error: BackendError): boolean {
  return (
    error.type === "network_error" ||
    error.type === "configuration_error" ||
    (error.type === "server_error" && error.statusCode === 503)
  );
}

/**
 * Get appropriate fallback behavior for backend unavailability
 */
export function getFallbackBehavior(operation: string): {
  enableOfflineMode: boolean;
  showCachedData: boolean;
  allowRetry: boolean;
  message: string;
} {
  switch (operation) {
    case "topic_generation":
      return {
        enableOfflineMode: false,
        showCachedData: false,
        allowRetry: true,
        message:
          "Topic generation requires an active connection. Please check your internet and try again.",
      };
    default:
      return {
        enableOfflineMode: false,
        showCachedData: false,
        allowRetry: true,
        message:
          "This feature requires an active connection. Please try again when you're online.",
      };
  }
}

// ============================================================================
// NEW SHARED ERROR UTILITIES
// ============================================================================

/**
 * Interface representing the structure of a backend error response.
 * Handles standard { error: { message } }, { message }, and FastAPI { detail } formats.
 */
interface BackendErrorResponse {
  error?: {
    message?: string;
    code?: string;
  };
  message?: string;
  detail?:
    | Array<{
        type: string;
        loc: (string | number)[];
        msg: string;
        input?: unknown;
        ctx?: unknown;
      }>
    | string;
}

/**
 * Extract a human-readable error message from various backend error formats.
 *
 * Handles:
 * - Structured { error: { message } }
 * - Simple { message }
 * - FastAPI string { detail: string }
 * - FastAPI array { detail: [{ loc, msg }] }
 *
 * @param data The unknown error data from the API response
 * @param fallback A fallback message to return if extraction fails
 * @returns The extracted error message or the fallback
 */
export function extractApiError(data: unknown, fallback?: string): string {
  if (!data || typeof data !== "object") {
    return fallback || "An unexpected error occurred";
  }

  const parsedError = data as BackendErrorResponse;

  // Handle FastAPI validation errors (array or string)
  if (parsedError.detail) {
    if (Array.isArray(parsedError.detail)) {
      // Extract validation error messages: "field: message"
      return parsedError.detail
        .map((err) => {
          const field =
            err.loc && err.loc.length > 0
              ? err.loc[err.loc.length - 1]
              : "unknown";
          return `${field}: ${err.msg}`;
        })
        .join(", ");
    } else if (typeof parsedError.detail === "string") {
      return parsedError.detail;
    }
  }

  // Handle standard error formats
  const extractedMessage = parsedError.error?.message || parsedError.message;

  if (extractedMessage) {
    return extractedMessage;
  }

  return fallback || "An unexpected error occurred";
}

/**
 * Safely parses the response body as JSON.
 * Returns an empty object if parsing fails, ensuring it never throws.
 *
 * @param response The fetch Response object
 * @returns The parsed JSON object or an empty object
 */
export async function safeParseErrorBody(response: Response): Promise<unknown> {
  try {
    const errorText = await response.text();
    // Re-use safeJsonParse from utils for consistent parsing logic
    return safeJsonParse(errorText, {});
  } catch {
    // If text() fails (e.g. strict CORS or network issue reading body), return empty object
    return {};
  }
}
