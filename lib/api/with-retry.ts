/**
 * Retry Utility
 *
 * Automatic retry with exponential backoff for failed operations:
 * - Configurable retry attempts
 * - Exponential backoff delay
 * - Conditional retry logic
 * - Comprehensive logging
 *
 * @example
 * ```tsx
 * const data = await withRetry(
 *   () => fetch('/api/data').then(r => r.json()),
 *   {
 *     maxRetries: 3,
 *     retryDelay: 1000,
 *     shouldRetry: (error) => error.statusCode === 503,
 *   }
 * );
 * ```
 */

import { logger } from "@/lib/logger";
import { sanitizeErrorForLogging } from "@/lib/error-utils";

export interface RetryOptions {
  /**
   * Maximum number of retry attempts (default: 3)
   */
  maxRetries?: number;

  /**
   * Base delay between retries in milliseconds (default: 1000)
   * Actual delay will use exponential backoff: delay * (2 ^ attempt)
   */
  retryDelay?: number;

  /**
   * Function to determine if error should be retried
   * Default: retry on network errors and 5xx status codes
   */
  shouldRetry?: (error: Error, attempt: number) => boolean;

  /**
   * Custom backoff function
   * Default: exponential backoff
   */
  backoffFn?: (attempt: number, baseDelay: number) => number;

  /**
   * Operation name for logging
   */
  operationName?: string;

  /**
   * Component name for logging context
   */
  component?: string;

  /**
   * Callback before each retry attempt
   */
  onRetry?: (error: Error, attempt: number, delay: number) => void;
}

const log = logger.forComponent("RetryUtility");

/**
 * Default retry logic - retry on network errors and 5xx status codes
 */
function defaultShouldRetry(error: Error, attempt: number): boolean {
  // Don't retry if max attempts reached (checked separately)
  // Retry on network errors
  if (
    error.message.includes("network") ||
    error.message.includes("fetch") ||
    error.message.includes("timeout")
  ) {
    return true;
  }

  // Retry on 5xx server errors
  if ("statusCode" in error) {
    const statusCode = (error as Error & { statusCode?: number }).statusCode;
    if (statusCode && statusCode >= 500 && statusCode < 600) {
      return true;
    }
  }

  // Don't retry on client errors (4xx) or other errors
  return false;
}

/**
 * Default exponential backoff function
 */
function defaultBackoff(attempt: number, baseDelay: number): number {
  // Exponential backoff: baseDelay * (2 ^ attempt)
  // Add jitter to prevent thundering herd
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 1000; // Random 0-1000ms jitter
  return exponentialDelay + jitter;
}

/**
 * Execute an async operation with automatic retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    shouldRetry = defaultShouldRetry,
    backoffFn = defaultBackoff,
    operationName = "operation",
    component,
    onRetry,
  } = options;

  let lastError: Error | null = null;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      log.debug(`Attempting ${operationName} (attempt ${attempt + 1}/${maxRetries + 1})`, {
        component,
        attempt,
      });

      const result = await operation();

      if (attempt > 0) {
        log.info(`${operationName} succeeded after ${attempt} retries`, {
          component,
          totalAttempts: attempt + 1,
        });
      }

      return result;
    } catch (error) {
      const standardError =
        error instanceof Error ? error : new Error(String(error));
      lastError = standardError;

      log.warn(`${operationName} failed (attempt ${attempt + 1}/${maxRetries + 1})`, {
        component,
        attempt,
        error: standardError.message,
      });

      // Check if we should retry
      const isLastAttempt = attempt === maxRetries;
      const canRetry = !isLastAttempt && shouldRetry(standardError, attempt);

      if (!canRetry) {
        if (isLastAttempt) {
          log.error(`${operationName} failed after ${maxRetries + 1} attempts`, {
            component,
            totalAttempts: maxRetries + 1,
            error: standardError.message,
          });
        } else {
          log.error(`${operationName} failed (not retrying)`, {
            component,
            attempt,
            error: standardError.message,
          });
        }
        throw standardError;
      }

      // Calculate delay and wait
      const delay = backoffFn(attempt, retryDelay);

      log.debug(`Retrying ${operationName} in ${delay}ms`, {
        component,
        attempt,
        delay,
      });

      // Call onRetry callback
      if (onRetry) {
        try {
          onRetry(standardError, attempt, delay);
        } catch (callbackError) {
          log.error(`onRetry callback failed for ${operationName}`, {
            component,
            callbackError: String(callbackError),
          });
        }
      }

      // Wait before retrying
      await sleep(delay);

      attempt++;
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError || new Error(`${operationName} failed after ${maxRetries + 1} attempts`);
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Helper to create a retry function with preset options
 */
export function createRetryFn<T>(
  operation: () => Promise<T>,
  options: RetryOptions,
): () => Promise<T> {
  return () => withRetry(operation, options);
}

/**
 * Common retry configurations
 */
export const RetryPresets = {
  /**
   * Fast retry - 3 attempts with 500ms base delay
   */
  fast: {
    maxRetries: 3,
    retryDelay: 500,
  },

  /**
   * Standard retry - 3 attempts with 1s base delay
   */
  standard: {
    maxRetries: 3,
    retryDelay: 1000,
  },

  /**
   * Slow retry - 5 attempts with 2s base delay
   */
  slow: {
    maxRetries: 5,
    retryDelay: 2000,
  },

  /**
   * Aggressive retry - 5 attempts with 500ms base delay
   */
  aggressive: {
    maxRetries: 5,
    retryDelay: 500,
  },

  /**
   * Conservative retry - 2 attempts with 2s base delay
   */
  conservative: {
    maxRetries: 2,
    retryDelay: 2000,
  },
} as const;
