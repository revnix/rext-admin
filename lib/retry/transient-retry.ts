/**
 * Transient Retry Helper
 *
 * Provides bounded automatic retry for transient failures with exponential backoff + jitter.
 * Used to improve resilience for critical operations like billing mutations without
 * introducing global retry settings that could mask application issues.
 *
 * @module lib/retry/transient-retry
 */

import { ApiError } from "@/lib/api-client/core";
import { log } from "@/lib/logger";

const transientLogger = log.forComponent("TransientRetry");

/**
 * Configuration for retry behavior
 */
export interface RetryOptions {
    /**
     * Maximum number of retry attempts (default: 3)
     */
    maxAttempts?: number;

    /**
     * Base delay in milliseconds for exponential backoff (default: 500)
     */
    baseDelayMs?: number;

    /**
     * Maximum delay in milliseconds to cap exponential growth (default: 4000)
     */
    maxDelayMs?: number;
}

/**
 * HTTP status codes that indicate transient failures and should be retried
 */
const TRANSIENT_STATUS_CODES = new Set([
    408, // Request Timeout
    425, // Too Early
    429, // Too Many Requests
    500, // Internal Server Error
    502, // Bad Gateway
    503, // Service Unavailable
    504, // Gateway Timeout
]);

/**
 * Determines if an error is transient and should trigger a retry.
 * Includes:
 * - Transient HTTP status codes (408, 429, 5xx)
 * - Network-related errors (AbortError, TimeoutError, fetch failures)
 *
 * Does NOT retry:
 * - Authentication/Authorization errors (401, 403)
 * - Validation errors (400, 422)
 * - Not found errors (404)
 * - Other client errors (4xx)
 *
 * @param error - The error to classify
 * @returns True if the error is transient and should be retried
 */
export function isTransientError(error: unknown): boolean {
    // ApiError with transient status code
    if (error instanceof ApiError) {
        return TRANSIENT_STATUS_CODES.has(error.statusCode);
    }

    // Native fetch/network errors
    if (error instanceof Error) {
        const isNetworkError =
            error.name === "AbortError" ||
            error.name === "TimeoutError" ||
            error.message.toLowerCase().includes("network") ||
            error.message.toLowerCase().includes("failed to fetch");

        return isNetworkError;
    }

    return false;
}

/**
 * Calculate exponential backoff with jitter.
 * Formula: exponential * (1 + jitter), where jitter is ±20%
 *
 * @param attempt - Current attempt number (1-based)
 * @param baseDelayMs - Base delay in milliseconds
 * @param maxDelayMs - Maximum delay cap
 * @returns Delay in milliseconds with jitter applied
 */
export function getExponentialBackoffDelay(
    attempt: number,
    baseDelayMs: number,
    maxDelayMs: number,
): number {
    // Exponential: baseDelayMs * 2^(attempt-1), capped at maxDelayMs
    const exponential = Math.min(
        baseDelayMs * Math.pow(2, attempt - 1),
        maxDelayMs,
    );

    // Add ±20% jitter to prevent thundering herd
    const jitterFraction = 0.2 * (Math.random() - 0.5) * 2; // Random between -20% and +20%
    const jitter = exponential * jitterFraction;

    return Math.round(exponential + jitter);
}

/**
 * Retry an operation with bounded exponential backoff and jitter.
 *
 * Retries transient failures (network errors, 5xx, 429, etc.) but fails immediately
 * on non-transient errors (4xx auth/validation errors).
 *
 * @param operation - Async function to retry
 * @param options - Retry configuration
 * @returns Result of the operation if successful
 * @throws Original error if it's non-transient or retries are exhausted
 *
 * @example
 * const result = await retryTransient(
 *   () => apiClient.subscriptions.updatePlan(planId),
 *   { maxAttempts: 3, baseDelayMs: 500, maxDelayMs: 4000 }
 * );
 */
export async function retryTransient<T>(
    operation: () => Promise<T>,
    {
        maxAttempts = 3,
        baseDelayMs = 500,
        maxDelayMs = 4000,
    }: RetryOptions = {},
): Promise<T> {
    let lastError: unknown;
    let attempt = 0;

    while (attempt < maxAttempts) {
        attempt += 1;

        try {
            return await operation();
        } catch (error) {
            lastError = error;

            // Non-transient errors should fail immediately without retry
            if (!isTransientError(error)) {
                transientLogger.debug("Non-transient error, failing immediately", {
                    error,
                    errorType: error instanceof Error ? error.name : typeof error,
                });
                throw error;
            }

            // If this is the last attempt, throw the error
            if (attempt >= maxAttempts) {
                transientLogger.warn("Retry exhausted", {
                    maxAttempts,
                    error:
                        error instanceof Error ? error.message : String(error),
                });
                throw error;
            }

            // Wait before retrying
            const delayMs = getExponentialBackoffDelay(attempt, baseDelayMs, maxDelayMs);
            transientLogger.debug("Retrying after transient error", {
                attempt,
                maxAttempts,
                delayMs,
                error:
                    error instanceof Error ? error.message : String(error),
            });

            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }

    // Should never reach here, but fail if we do
    throw (
        lastError ??
        new Error("Retry loop exhausted unexpectedly with no error captured")
    );
}
