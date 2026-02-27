import { apiErrorHandler } from "@/lib/api-error-middleware";
import { authenticatedFetch } from "@/lib/auth-utils";
import { generateRequestId, sanitizeErrorForLogging } from "@/lib/error-utils";
import { logger } from "@/lib/logger";
import type {
  WorkspaceApiConfig,
  WorkspaceApiContext,
  WorkspaceErrorCode,
} from "@/types/workspace";
import { resolveApiBaseUrl } from "@/lib/api-base-url";

// ============================================================================
// SHARED ERROR CLASS
// ============================================================================

export class WorkspaceApiError extends Error {
  constructor(
    public readonly code: WorkspaceErrorCode,
    public readonly message: string,
    public readonly details?: Record<string, unknown>,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = this.constructor.name;
  }

  static fromResponse(
    response: unknown,
    statusCode: number,
  ): WorkspaceApiError {
    const responseObj = response as Record<string, unknown>;
    const code =
      (responseObj.error_code as WorkspaceErrorCode) || "INVALID_REQUEST";
    const message =
      (responseObj.error as string) || "An unknown error occurred";
    const details = (responseObj.details as Record<string, unknown>) || {};

    return new WorkspaceApiError(code, message, details, statusCode);
  }
}

// ============================================================================
// ABSTRACT BASE SERVICE
// ============================================================================

export abstract class BaseWorkspaceService {
  protected readonly config: WorkspaceApiConfig;
  protected readonly log;
  protected readonly activeRequests = new Map<string, AbortController>();

  constructor(componentName: string, config: Partial<WorkspaceApiConfig> = {}) {
    this.log = logger.forComponent(componentName);
    this.config = {
      baseUrl: resolveApiBaseUrl({ allowWindowOriginFallback: true }),
      timeout: 30000,
      enableRequestDeduplication: true,
      ...config,
    };
  }

  // ============================================================================
  // REQUEST EXECUTION
  // ============================================================================

  protected async makeRequest<T>(
    method: string,
    endpoint: string,
    body?: unknown,
  ): Promise<T> {
    const requestId = generateRequestId();
    const context = this.createRequestContext(requestId);
    const controller = new AbortController();
    this.activeRequests.set(requestId, controller);

    try {
      return await this.executeRequest<T>(
        method,
        endpoint,
        body,
        controller.signal,
        context,
      );
    } finally {
      this.activeRequests.delete(requestId);
    }
  }

  protected async executeRequest<T>(
    method: string,
    endpoint: string,
    body: unknown,
    signal: AbortSignal,
    context: WorkspaceApiContext,
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const startTime = Date.now();

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Request-ID": context.requestId,
        "X-Timestamp": context.timestamp,
      };

      const signals = [signal];
      if (this.config.timeout) {
        signals.push(AbortSignal.timeout(this.config.timeout));
      }
      const combinedSignal =
        signals.length > 1 ? AbortSignal.any(signals) : signal;

      const response = await authenticatedFetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: combinedSignal,
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        await this.handleErrorResponse(response, context, duration);
      }

      let data: unknown;
      if (
        response.status === 204 ||
        response.headers.get("content-length") === "0"
      ) {
        data = {};
      } else {
        data = await response.json();
      }

      const responseData = data as { success?: boolean; data?: T };
      if (responseData?.success && responseData.data) {
        return responseData.data;
      }

      return data as T;
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.handleRequestError(error, context, duration);
      throw error;
    }
  }

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  protected async handleErrorResponse(
    response: Response,
    context: WorkspaceApiContext,
    duration: number,
  ): Promise<never> {
    const errorData = await response.json().catch(() => ({}));

    this.log.error("Request failed", {
      requestId: context.requestId,
      status: response.status,
      statusText: response.statusText,
      duration,
      errorData: sanitizeErrorForLogging(errorData),
    });

    throw WorkspaceApiError.fromResponse(errorData, response.status);
  }

  protected async handleRequestError(
    error: unknown,
    context: WorkspaceApiContext,
    duration: number,
  ): Promise<never> {
    await apiErrorHandler.handleError(error, {
      showToast: true,
      logError: true,
      throwError: true,
      context: {
        requestId: context.requestId,
        duration,
        timestamp: context.timestamp,
      },
    });

    throw error;
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  protected createRequestContext(requestId: string): WorkspaceApiContext {
    return {
      requestId,
      timestamp: new Date().toISOString(),
      userId: undefined,
    };
  }

  protected validateUuid(id: string, fieldName: string): void {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      throw new WorkspaceApiError(
        "INVALID_REQUEST",
        `Invalid ${fieldName}: must be a valid UUID`,
      );
    }
  }

  protected isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  public cancelAllRequests(): void {
    for (const [requestId, controller] of this.activeRequests) {
      controller.abort();
      this.log.debug("Cancelled request", { requestId });
    }
    this.activeRequests.clear();
  }

  public getActiveRequestsCount(): number {
    return this.activeRequests.size;
  }
}
