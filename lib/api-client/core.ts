/**
 * Core API Client
 *
 * Base client class with generic request handling
 */

import { resolveApiBaseUrl } from "@/lib/api-base-url";
import { authenticatedFetch } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { safeJsonParse } from "@/lib/utils";
import { extractApiError } from "@/lib/error-utils";
import {
  AWAY_RETRY_DELAYS_MS,
  isAwayStatus,
  isIdempotent,
  isNetworkFailure,
  isOffline,
  markRetried,
  noteServerAnswered,
  reportServerAway,
  SERVER_UNREACHABLE,
  SERVER_UNREACHABLE_MESSAGE,
  waitFor,
} from "./server-away";

const log = logger.forComponent("ApiClient");

// ============================================================================
// ERROR HANDLING
// ============================================================================

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

  /** Check if an error is an ApiError */
  static is(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }

  /** Check if an error is a specific status code */
  static hasStatus(error: unknown, status: number | number[]): boolean {
    if (!ApiError.is(error)) return false;
    return Array.isArray(status)
      ? status.includes(error.statusCode)
      : error.statusCode === status;
  }

  /** Is this an authentication or permission error (401/403) */
  get isAuthError(): boolean {
    return this.statusCode === 401 || this.statusCode === 403;
  }

  /** Is this a not found error (404) */
  get isNotFoundError(): boolean {
    return this.statusCode === 404;
  }

  /** Is this a rate limit error (429) */
  get isRateLimitError(): boolean {
    return this.statusCode === 429;
  }

  /** Should this error typically NOT be retried (401, 403, 404) */
  get isNonRetryable(): boolean {
    return [401, 403, 404].includes(this.statusCode);
  }
}

// ============================================================================
// MAIN API CLIENT CLASS
// ============================================================================

export class ApiClient {
  private readonly baseUrl: string;
  private readonly activeRequests = new Map<string, AbortController>();

  constructor() {
    this.baseUrl = resolveApiBaseUrl({ allowWindowOriginFallback: true });
  }

  /**
   * Generic request method for all API calls. A request that changes nothing is tried again
   * while the server is away (a deploy's restart); see `ridingOutDeploy`.
   */
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.ridingOutDeploy(options, () =>
      this.requestOnce<T>(endpoint, options),
    );
  }

  /**
   * No answer, or one cut short: the connection failed, the proxy's answer carried no CORS headers,
   * or the body stopped arriving after the headers had. Any of them becomes the "couldn't reach the
   * server" error; whatever else went wrong reading an answer stays as it is.
   */
  private unreachable(error: unknown): unknown {
    if (!isNetworkFailure(error)) return error;
    return new ApiError(
      0,
      SERVER_UNREACHABLE_MESSAGE,
      SERVER_UNREACHABLE,
      null,
    );
  }

  /**
   * Rides out a backend deploy (task 759): the API restarts for about a minute, and meanwhile the
   * proxy answers 502 or 503, or nothing readable at all. A GET or HEAD is sent again after about
   * 1, 3 and 8 seconds; when those run out the shell is told the server is away, and the request
   * fails as usual. Anything else isn't repeated, since it may already have been carried out: it
   * fails at once with a sentence to show. The backend's own 502 or 503 (a JSON body, with its
   * own words) is retried the same way but keeps its message.
   */
  private async ridingOutDeploy<T>(
    options: RequestInit,
    send: () => Promise<T>,
  ): Promise<T> {
    for (let attempt = 0; ; attempt += 1) {
      try {
        const answer = await send();
        noteServerAnswered();
        return answer;
      } catch (error) {
        if (!ApiError.is(error)) throw error;
        const noAnswer = error.code === SERVER_UNREACHABLE;
        const proxyAnswer =
          isAwayStatus(error.statusCode) && error.context == null;
        if (!noAnswer && !isAwayStatus(error.statusCode)) throw error;

        const failure =
          noAnswer || !proxyAnswer
            ? error
            : new ApiError(
                error.statusCode,
                SERVER_UNREACHABLE_MESSAGE,
                SERVER_UNREACHABLE,
                null,
              );
        if (!isIdempotent(options.method) || isOffline()) throw failure;

        const delay = AWAY_RETRY_DELAYS_MS[attempt];
        if (delay === undefined) {
          markRetried(failure);
          if (failure.code === SERVER_UNREACHABLE) reportServerAway();
          throw failure;
        }
        await waitFor(delay, options.signal);
      }
    }
  }

  private async requestOnce<T>(
    endpoint: string,
    options: RequestInit,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await authenticatedFetch(url, options);

      // Handle HTTP errors
      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        let errorData: unknown = null;

        errorData = safeJsonParse(errorText, null, "API error body");

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

        // Use shared utility to extract error message
        const errorMessage = extractApiError(
          errorData,
          `Request failed: ${response.statusText}`,
        );

        // Auto-logout when user account is suspended, banned, or session revoked.
        //
        // A 401 on its own is NOT proof the session died: endpoints that verify
        // a password inline (account deactivation, change password) answer 401
        // for a wrong password. Signing out on those threw the user to the
        // login page with "session expired" while their session was perfectly
        // valid. Only act when the body actually says the account or session is
        // gone — a genuinely expired or revoked session is already handled by
        // classifyUnauthorized() in authenticatedFetch() before this runs.
        const lowerMsg = errorMessage.toLowerCase();
        const indicatesAccountBlocked = [
          "suspended",
          "banned",
          "revoked",
          "blacklisted",
          "disabled",
        ].some((marker) => lowerMsg.includes(marker));

        if (
          typeof window !== "undefined" &&
          !endpoint.includes("/logout") &&
          !endpoint.includes("/login") &&
          !endpoint.includes("/register") &&
          (response.status === 401 || response.status === 403) &&
          indicatesAccountBlocked
        ) {
          const errorParam = lowerMsg.includes("suspended")
            ? "AccountSuspended"
            : lowerMsg.includes("banned")
              ? "AccountBanned"
              : lowerMsg.includes("revoked") || lowerMsg.includes("blacklisted")
                ? "SessionEnded"
                : "SessionExpired";

          import("@/lib/logout-utils").then(({ performLogout }) => {
            performLogout(`/login?error=${errorParam}`);
          });
        }

        throw new ApiError(
          response.status,
          errorMessage,
          parsedError?.error?.code,
          errorData,
        );
      }

      // 204 No Content and 205 Reset Content should not be parsed as JSON
      if (response.status === 204 || response.status === 205) {
        return null as T;
      }

      // Parse successful response
      let result = await response.json();

      // Handle cases where the response might be a double-encoded JSON string
      if (typeof result === "string") {
        try {
          const parsed = JSON.parse(result);
          if (parsed && typeof parsed === "object") {
            result = parsed;
          }
        } catch {
          // Stay with original result if parsing fails
        }
      }

      // Handle new consistent format: { success: true, data: {...}, meta: {...} }
      if (result && typeof result === "object" && "success" in result) {
        // `success: false` is a failure even on an HTTP 200 and even when the
        // body carries no structured `error` object — some endpoints report the
        // problem only via a top-level `message`/`detail` (e.g. duplicate email
        // on register). Without this, the caller sees a resolved promise and
        // treats the failure as success.
        if (result.success === false) {
          const flatMessage =
            typeof result.message === "string"
              ? result.message
              : typeof result.detail === "string"
                ? result.detail
                : undefined;
          throw new ApiError(
            result.error?.status_code || response.status,
            result.error?.message || flatMessage || "Request failed",
            result.error?.code,
            result.error?.details ?? result,
          );
        }

        if (result.success && "data" in result) {
          const data = result.data;

          // Debug raw response processing
          if (process.env.NODE_ENV === "development") {
            log.debug(`[API DEBUG] ${endpoint} processing:`, {
              hasSuccess: true,
              hasData: "data" in result,
              dataType: typeof data,
              dataIsNull: data === null,
            });
          }

          // Only unwrap nested data if it's the intended payload.
          // If the outer object already looks like it has the payload (e.g., has 'id' or other resource fields),
          // and 'data' is just a small wrapper with a 'message', then the payload is at the root.
          const hasRootPayload =
            result &&
            typeof result === "object" &&
            ("id" in result ||
              "billing_period" in result ||
              "plan_id" in result);
          const dataIsJustMessage =
            data &&
            typeof data === "object" &&
            !Array.isArray(data) &&
            Object.keys(data).length <= 2 &&
            "message" in data;

          if (hasRootPayload && (dataIsJustMessage || data === null)) {
            // Keep the root object as the payload, but remove success/data if they are redundant meta-fields
            const { success, data: _unused, ...rest } = result;
            return rest as T;
          }

          // If data itself is an informative object with a message and non-null data, unwrap it further
          if (
            data &&
            typeof data === "object" &&
            "message" in data &&
            "data" in data &&
            data.data !== null &&
            data.data !== undefined
          ) {
            return (data as unknown as { data: T }).data;
          }

          return result.data as T;
        }

        // If it has success but no data field, return the object itself (minus success)
        const { success, ...rest } = result;
        if (Object.keys(rest).length > 0) {
          return rest as T;
        }
      }

      // Handle message-wrapped responses (e.g., { message: '...', data: ... } or { message: '...', ...stats })
      // This provides a centralized way to handle responses that include a message but might not use the strict 'success' format
      if (result && typeof result === "object" && "message" in result) {
        // If it has 'data' property (even if null), unwrap it
        if ("data" in result) {
          const data = (result as unknown as { data: T }).data;
          // Deep unwrap if the inner data also contains a message-wrapped response
          if (
            data &&
            typeof data === "object" &&
            "message" in data &&
            "data" in data
          ) {
            return (data as unknown as { data: T }).data;
          }
          return data as T;
        }

        // If it's a flat object with a message, return the rest of the properties
        const { message, ...rest } = result;
        if (Object.keys(rest).length > 0) {
          return rest as T;
        }

        // If it only has a message and it's a "not found" style message, return null
        if (
          typeof (result as unknown as { message: string }).message ===
            "string" &&
          (result as unknown as { message: string }).message
            .toLowerCase()
            .includes("not found")
        ) {
          return null as T;
        }
      }

      // Legacy format or direct data
      return result as T;
    } catch (thrown) {
      const error = this.unreachable(thrown);
      if (error instanceof ApiError) {
        throw error;
      }

      log.error("Request failed", { error, endpoint });
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Raw request method for binary data or direct response access
   * Returns the underlying Response object
   */
  async requestRaw(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<Response> {
    return this.ridingOutDeploy(options, () =>
      this.requestRawOnce(endpoint, options),
    );
  }

  private async requestRawOnce(
    endpoint: string,
    options: RequestInit,
  ): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await authenticatedFetch(url, options);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        const errorData = safeJsonParse(errorText, null, "API error body");
        const errorMessage = extractApiError(
          errorData,
          `Request failed: ${response.statusText}`,
        );

        throw new ApiError(response.status, errorMessage, undefined, errorData);
      }

      return response;
    } catch (thrown) {
      const error = this.unreachable(thrown);
      if (error instanceof ApiError) {
        throw error;
      }

      log.error("Raw request failed", { error, endpoint });
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
