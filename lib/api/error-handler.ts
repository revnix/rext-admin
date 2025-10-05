/**
 * Error Handler Utility
 *
 * Centralized error handling with:
 * - Consistent error transformation
 * - Toast notifications
 * - Logging
 * - Fallback values
 *
 * @example
 * ```tsx
 * const data = await withErrorHandler(
 *   () => workspaceService.getWorkspace(id),
 *   {
 *     operationName: "fetch workspace",
 *     fallbackValue: null,
 *     showToast: true,
 *   }
 * );
 * ```
 */

import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { sanitizeErrorForLogging } from "@/lib/error-utils";

export interface ErrorHandlerContext<T> {
  /**
   * Human-readable name of the operation (for logging and error messages)
   */
  operationName: string;

  /**
   * Fallback value to return on error (optional)
   */
  fallbackValue?: T;

  /**
   * Custom error callback
   */
  onError?: (error: Error) => void;

  /**
   * Whether to show toast notification (default: true)
   */
  showToast?: boolean;

  /**
   * Custom toast error message (overrides default)
   */
  toastMessage?: string;

  /**
   * Whether to rethrow the error after handling (default: false)
   */
  rethrow?: boolean;

  /**
   * Component name for logging context
   */
  component?: string;
}

const log = logger.forComponent("ErrorHandler");

/**
 * Wraps an async operation with centralized error handling
 */
export async function withErrorHandler<T>(
  operation: () => Promise<T>,
  context: ErrorHandlerContext<T>,
): Promise<T> {
  const {
    operationName,
    fallbackValue,
    onError,
    showToast = true,
    toastMessage,
    rethrow = false,
    component,
  } = context;

  try {
    log.debug(`Starting operation: ${operationName}`, {
      component,
    });

    const result = await operation();

    log.debug(`Operation succeeded: ${operationName}`, {
      component,
    });

    return result;
  } catch (error) {
    // Transform error to standard Error object
    const standardError =
      error instanceof Error ? error : new Error(String(error));

    // Log the error
    log.error(`Operation failed: ${operationName}`, {
      component,
      error: standardError.message,
      stack: standardError.stack,
    });

    // Show toast notification
    if (showToast) {
      const message =
        toastMessage ||
        `Failed to ${operationName}: ${standardError.message}`;
      toast.error(message);
    }

    // Call custom error callback
    if (onError) {
      try {
        onError(standardError);
      } catch (callbackError) {
        log.error(`Error callback failed for: ${operationName}`, {
          component,
          callbackError: String(callbackError),
        });
      }
    }

    // Rethrow if requested
    if (rethrow) {
      throw standardError;
    }

    // Return fallback value if provided
    if (fallbackValue !== undefined) {
      log.debug(`Returning fallback value for: ${operationName}`, {
        component,
      });
      return fallbackValue;
    }

    // If no fallback and not rethrowing, throw the error
    throw standardError;
  }
}

/**
 * Synchronous version of withErrorHandler for non-async operations
 */
export function withErrorHandlerSync<T>(
  operation: () => T,
  context: ErrorHandlerContext<T>,
): T {
  const {
    operationName,
    fallbackValue,
    onError,
    showToast = true,
    toastMessage,
    rethrow = false,
    component,
  } = context;

  try {
    log.debug(`Starting sync operation: ${operationName}`, {
      component,
    });

    const result = operation();

    log.debug(`Sync operation succeeded: ${operationName}`, {
      component,
    });

    return result;
  } catch (error) {
    const standardError =
      error instanceof Error ? error : new Error(String(error));

    log.error(`Sync operation failed: ${operationName}`, {
      component,
      error: standardError.message,
    });

    if (showToast) {
      const message =
        toastMessage ||
        `Failed to ${operationName}: ${standardError.message}`;
      toast.error(message);
    }

    if (onError) {
      try {
        onError(standardError);
      } catch (callbackError) {
        log.error(`Error callback failed for: ${operationName}`, {
          component,
          callbackError: String(callbackError),
        });
      }
    }

    if (rethrow) {
      throw standardError;
    }

    if (fallbackValue !== undefined) {
      return fallbackValue;
    }

    throw standardError;
  }
}

/**
 * Helper to extract user-friendly error message from various error types
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  return "An unknown error occurred";
}

/**
 * Helper to check if error is of a specific type
 */
export function isErrorType(error: unknown, errorName: string): boolean {
  return error instanceof Error && error.name === errorName;
}

/**
 * Helper to check if error has a specific status code
 */
export function hasStatusCode(
  error: unknown,
  statusCode: number,
): error is Error & { statusCode: number } {
  return (
    error instanceof Error &&
    "statusCode" in error &&
    error.statusCode === statusCode
  );
}
