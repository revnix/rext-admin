/**
 * API Error Handling Middleware
 *
 * Centralized error handling middleware for all API operations including
 * workspace and knowledge management. Provides consistent error handling,
 * logging, and user-friendly error messages.
 */

import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { ApiError } from "@/lib/api-client/core";
import { WorkspaceServiceError as WorkspaceApiError } from "@/services/workspace/workspace-service";
import type { ErrorSeverity } from "@/types/consistent-response";
import type { WorkspaceErrorCode } from "@/types/workspace";

// ============================================================================
// ERROR SEVERITY MAPPING
// ============================================================================

const ERROR_SEVERITY_MAP: Record<WorkspaceErrorCode, ErrorSeverity> = {
  // Workspace errors
  WORKSPACE_NOT_FOUND: "high",
  WORKSPACE_TITLE_EXISTS: "medium",
  INVALID_URL: "medium",
  SCRAPING_FAILED: "high",
  UPLOAD_FAILED: "high",
  PERMISSION_DENIED: "high",
  KNOWLEDGE_NOT_FOUND: "high",
  INVALID_REQUEST: "medium",
  REQUEST_TIMEOUT: "medium",
  NETWORK_ERROR: "high",
};

// HTTP Status Code for Permission Denied
export const HTTP_FORBIDDEN = 403;
export const HTTP_UNAUTHORIZED = 401;

// ============================================================================
// USER-FRIENDLY ERROR MESSAGES
// ============================================================================

const ERROR_MESSAGES: Record<WorkspaceErrorCode, string> = {
  // Workspace errors
  WORKSPACE_NOT_FOUND:
    "The workspace you're looking for doesn't exist or has been deleted.",
  WORKSPACE_TITLE_EXISTS:
    "A workspace with this name already exists. Please choose a different name.",
  INVALID_URL:
    "Please enter a valid URL (must start with http:// or https://).",
  SCRAPING_FAILED:
    "We couldn't scrape content from this website. Please check the URL and try again.",
  UPLOAD_FAILED:
    "File upload failed. Please check your internet connection and try again.",
  PERMISSION_DENIED: "You don't have permission to perform this action.",
  KNOWLEDGE_NOT_FOUND: "The knowledge item you're looking for doesn't exist.",
  INVALID_REQUEST:
    "The request contains invalid data. Please check your input and try again.",
  REQUEST_TIMEOUT: "The request took too long to complete. Please try again.",
  NETWORK_ERROR:
    "Network error occurred. Please check your internet connection.",
};

// ============================================================================
// RECOVERY ACTIONS
// ============================================================================

interface RecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  type?: "primary" | "secondary";
}

type RecoveryActionGenerator = (
  context?: Record<string, unknown>,
) => RecoveryAction[];

const RECOVERY_ACTIONS: Partial<
  Record<WorkspaceErrorCode, RecoveryActionGenerator>
> = {
  NETWORK_ERROR: () => [
    {
      label: "Retry",
      action: () => window.location.reload(),
      type: "primary",
    },
    {
      label: "Check Connection",
      action: () => {
        window.open("https://www.google.com", "_blank");
      },
      type: "secondary",
    },
  ],

  REQUEST_TIMEOUT: () => [
    {
      label: "Try Again",
      action: () => window.location.reload(),
      type: "primary",
    },
  ],

  WORKSPACE_NOT_FOUND: () => [
    {
      label: "Go to Workspaces",
      action: () => {
        window.location.href = "/workspaces";
      },
      type: "primary",
    },
  ],

  PERMISSION_DENIED: () => [
    {
      label: "Go to Dashboard",
      action: () => {
        window.location.href = "/";
      },
      type: "primary",
    },
    {
      label: "Contact Admin",
      action: () => {
        window.location.href = "/settings";
      },
      type: "secondary",
    },
  ],
};

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

export interface ApiErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  throwError?: boolean;
  customMessage?: string;
  context?: Record<string, unknown>;
  onError?: (error: Error, context?: Record<string, unknown>) => void;
  onRetry?: () => void | Promise<void>;
}

export class ApiErrorHandler {
  private readonly log = logger.forComponent("ApiErrorHandler");

  /**
   * Handle API errors with consistent processing
   */
  async handleError(
    error: unknown,
    options: ApiErrorHandlerOptions = {},
  ): Promise<never> {
    const {
      showToast = true,
      logError = true,
      throwError = true,
      customMessage,
      context = {},
      onError,
      onRetry,
    } = options;

    // Normalize error
    const normalizedError = this.normalizeError(error);
    const errorCode = this.extractErrorCode(normalizedError);
    const severity = this.getErrorSeverity(errorCode);

    // Log error
    if (logError) {
      this.logError(normalizedError, context, severity);
    }

    // Show user notification
    if (showToast) {
      this.showErrorToast(normalizedError, errorCode, customMessage, onRetry);
    }

    // Call custom error handler
    if (onError) {
      try {
        await onError(normalizedError, context);
      } catch (handlerError) {
        this.log.error("Error handler failed", { handlerError });
      }
    }

    // Re-throw error if requested
    if (throwError) {
      throw normalizedError;
    }

    // This should never be reached, but TypeScript requires it
    return Promise.reject(normalizedError);
  }

  /**
   * Wrap async operations with error handling
   */
  async withErrorHandling<T>(
    operation: () => Promise<T>,
    options: ApiErrorHandlerOptions = {},
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      await this.handleError(error, options);
      throw error; // This will never execute due to handleError throwing
    }
  }

  /**
   * Create a higher-order function with error handling
   */
  withErrorHandlingHOF<TArgs extends unknown[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    defaultOptions: ApiErrorHandlerOptions = {},
  ) {
    return async (...args: TArgs): Promise<TReturn> => {
      return this.withErrorHandling(() => fn(...args), defaultOptions);
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private normalizeError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    if (typeof error === "string") {
      return new Error(error);
    }

    if (error && typeof error === "object" && "message" in error) {
      return new Error(String(error.message));
    }

    return new Error("An unknown error occurred");
  }

  private extractErrorCode(error: Error): WorkspaceErrorCode {
    if (error instanceof WorkspaceApiError) {
      return error.code;
    }

    // Check for ApiError
    if (error instanceof ApiError) {
      if (
        error.statusCode === HTTP_FORBIDDEN ||
        error.statusCode === HTTP_UNAUTHORIZED
      ) {
        return "PERMISSION_DENIED";
      }
    }

    // Try to extract error code from error message or properties
    if ("code" in error && typeof error.code === "string") {
      return error.code as WorkspaceErrorCode;
    }

    // Check for HTTP status codes
    if ("status" in error) {
      const status = Number(error.status);
      if (status === HTTP_FORBIDDEN || status === HTTP_UNAUTHORIZED) {
        return "PERMISSION_DENIED";
      }
    }

    // Check for permission errors in message
    if (
      error.message.toLowerCase().includes("permission") ||
      error.message.includes("403") ||
      error.message.toLowerCase().includes("forbidden") ||
      error.message.toLowerCase().includes("unauthorized")
    ) {
      return "PERMISSION_DENIED";
    }

    // Check for network errors
    if (error.message.includes("fetch") || error.message.includes("network")) {
      return "NETWORK_ERROR";
    }

    // Check for timeout errors
    if (
      error.message.includes("timeout") ||
      error.message.includes("aborted")
    ) {
      return "REQUEST_TIMEOUT";
    }

    return "INVALID_REQUEST";
  }

  private getErrorSeverity(errorCode: WorkspaceErrorCode): ErrorSeverity {
    return ERROR_SEVERITY_MAP[errorCode] || "high";
  }

  private logError(
    error: Error,
    context: Record<string, unknown>,
    severity: ErrorSeverity,
  ): void {
    const logData = {
      errorMessage: error.message,
      errorName: error.name,
      errorStack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    };

    switch (severity) {
      case "low":
      case "medium":
        this.log.warn("API operation warning", logData);
        break;
      default:
        this.log.error("API operation failed", logData);
        break;
    }
  }

  private showErrorToast(
    error: Error,
    errorCode: WorkspaceErrorCode,
    customMessage?: string,
    onRetry?: () => void | Promise<void>,
  ): void {
    const message = customMessage || ERROR_MESSAGES[errorCode] || error.message;
    const severity = this.getErrorSeverity(errorCode);

    // Get recovery actions
    const recoveryActions = RECOVERY_ACTIONS[errorCode]?.() || [];

    // Add retry action if provided
    if (onRetry) {
      recoveryActions.unshift({
        label: "Retry",
        action: onRetry,
        type: "primary",
      });
    }

    // Show toast based on severity
    switch (severity) {
      case "low":
      case "medium":
        toast.warning(message, {
          description: "Please check your input and try again.",
          action: recoveryActions[0]
            ? {
                label: recoveryActions[0].label,
                onClick: recoveryActions[0].action,
              }
            : undefined,
        });
        break;
      default:
        toast.error(message, {
          description: "If this problem persists, please contact support.",
          action: recoveryActions[0]
            ? {
                label: recoveryActions[0].label,
                onClick: recoveryActions[0].action,
              }
            : undefined,
        });
        break;
    }
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

// Create default instance
export const apiErrorHandler = new ApiErrorHandler();

/**
 * Convenience function for handling errors
 */
export const handleApiError = (
  error: unknown,
  options?: ApiErrorHandlerOptions,
) => apiErrorHandler.handleError(error, options);

/**
 * Convenience function for wrapping operations with error handling
 */
export const withApiErrorHandling = <T>(
  operation: () => Promise<T>,
  options?: ApiErrorHandlerOptions,
) => apiErrorHandler.withErrorHandling(operation, options);

/**
 * Higher-order function decorator for automatic error handling
 */
export const withErrorHandling = <TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options?: ApiErrorHandlerOptions,
) => apiErrorHandler.withErrorHandlingHOF(fn, options);

// ============================================================================
// REACT HOOK FOR ERROR HANDLING
// ============================================================================

export function useApiErrorHandler() {
  const handleError = async (
    error: unknown,
    options?: ApiErrorHandlerOptions,
  ) => {
    return apiErrorHandler.handleError(error, {
      showToast: true,
      logError: true,
      throwError: false,
      ...options,
    });
  };

  const withErrorHandling = <T>(
    operation: () => Promise<T>,
    options?: ApiErrorHandlerOptions,
  ) => {
    return apiErrorHandler.withErrorHandling(operation, {
      showToast: true,
      logError: true,
      throwError: false,
      ...options,
    });
  };

  return {
    handleError,
    withErrorHandling,
  };
}
