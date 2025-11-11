/**
 * Core API Client
 *
 * Base client class with generic request handling
 */

import { authenticatedFetch } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

const log = logger.forComponent("ApiClient");

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Custom API error class with status code and context
 */
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly message: string,
    public readonly code?: string,
    public readonly context?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ============================================================================
// MAIN API CLIENT CLASS
// ============================================================================

export class ApiClient {
  private readonly baseUrl: string;
  private readonly activeRequests = new Map<string, AbortController>();

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_BACKEND_API_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "http://127.0.0.1:2024";
  }

  /**
   * Generic request method for all API calls
   */
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await authenticatedFetch(url, options);

      // Handle HTTP errors
      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        let errorData: unknown = null;

        try {
          errorData = JSON.parse(errorText);
        } catch {
          // Not JSON, use text
        }

        const parsedError = errorData as {
          error?: { message?: string; code?: string };
          message?: string;
          detail?:
            | Array<{
                type: string;
                loc: string[];
                msg: string;
                input?: unknown;
                ctx?: unknown;
              }>
            | string;
        };

        // Handle FastAPI validation errors
        let errorMessage: string;
        if (parsedError?.detail) {
          if (Array.isArray(parsedError.detail)) {
            // Extract validation error messages
            errorMessage = parsedError.detail
              .map((err) => {
                const field = err.loc[err.loc.length - 1];
                return `${field}: ${err.msg}`;
              })
              .join(", ");
          } else {
            // String detail message
            errorMessage = parsedError.detail;
          }
        } else {
          errorMessage =
            parsedError?.error?.message ||
            parsedError?.message ||
            `Request failed: ${response.statusText}`;
        }

        throw new ApiError(
          response.status,
          errorMessage,
          parsedError?.error?.code,
          errorData,
        );
      }

      // Parse successful response
      const result = await response.json();

      // Handle API spec format: { status: "success", data: {...}, message: "..." }
      if (
        result &&
        typeof result === "object" &&
        "status" in result &&
        result.status === "success"
      ) {
        if ("data" in result && result.data) {
          // If data contains a single nested object (e.g., { profile: {...} }),
          // unwrap it to the inner object
          const dataKeys = Object.keys(result.data);
          if (
            dataKeys.length === 1 &&
            typeof result.data[dataKeys[0]] === "object"
          ) {
            return result.data[dataKeys[0]] as T;
          }
          // Otherwise return data as-is
          return result.data as T;
        }
      }

      // Handle alternative format: { success: true, data: {...}, meta: {...} }
      if (result && typeof result === "object" && "success" in result) {
        if (result.success === false && "error" in result) {
          throw new ApiError(
            result.error?.status_code || response.status,
            result.error?.message || "Request failed",
            result.error?.code,
            result.error?.details,
          );
        }

        if (result.success && "data" in result) {
          return result.data as T;
        }
      }

      // Legacy format or direct data
      return result as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      log.error("Request failed", { error, endpoint });
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Cancel all active requests
   */
  cancelAllRequests(): void {
    this.activeRequests.forEach((controller) => {
      controller.abort();
    });
    this.activeRequests.clear();
  }

  /**
   * Get count of active requests
   */
  getActiveRequestsCount(): number {
    return this.activeRequests.size;
  }
}
