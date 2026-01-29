/**
 * Workspace Service - Core CRUD Operations
 *
 * Handles core workspace management operations including:
 * - Create, read, update, delete workspaces
 * - Workspace duplication
 * - Brand voice refresh
 */

import { apiErrorHandler } from "@/lib/api-error-middleware";
import { authenticatedFetch } from "@/lib/auth-utils";
import { generateRequestId, sanitizeErrorForLogging } from "@/lib/error-utils";
import { logger } from "@/lib/logger";
import { InputSanitizer } from "@/lib/sanitization";
import type {
  CreateWorkspaceRequest,
  CreateWorkspaceResponse,
  RefreshBrandVoiceResponse,
  UpdateWorkspaceRequest,
  WorkspaceApiConfig,
  WorkspaceApiContext,
  WorkspaceErrorCode,
  WorkspaceListResponse,
  WorkspaceResponse,
} from "@/types/workspace";

// ============================================================================
// ERROR HANDLING
// ============================================================================

export class WorkspaceServiceError extends Error {
  constructor(
    public readonly code: WorkspaceErrorCode,
    public readonly message: string,
    public readonly details?: Record<string, unknown>,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "WorkspaceServiceError";
  }

  static fromResponse(
    response: unknown,
    statusCode: number,
  ): WorkspaceServiceError {
    const responseObj = response as Record<string, unknown>;
    const code =
      (responseObj.error_code as WorkspaceErrorCode) || "INVALID_REQUEST";
    const message =
      (responseObj.error as string) || "An unknown error occurred";
    const details = (responseObj.details as Record<string, unknown>) || {};

    return new WorkspaceServiceError(code, message, details, statusCode);
  }
}

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export class WorkspaceService {
  private readonly config: WorkspaceApiConfig;
  private readonly log = logger.forComponent("WorkspaceService");
  private readonly activeRequests = new Map<string, AbortController>();

  constructor(config: Partial<WorkspaceApiConfig> = {}) {
    this.config = {
      baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:2024",
      timeout: 30000,
      enableRequestDeduplication: true,
      ...config,
    };
  }

  // ============================================================================
  // CORE WORKSPACE OPERATIONS
  // ============================================================================

  /**
   * Health check for workspace API
   */
  async healthCheck(): Promise<{ status: string }> {
    return this.makeRequest<{ status: string }>("GET", "/api/v1/workspace/");
  }

  /**
   * List all workspaces with metadata
   */
  async listWorkspaces(): Promise<WorkspaceListResponse> {
    return this.makeRequest<WorkspaceListResponse>(
      "GET",
      "/api/v1/workspace/all",
    );
  }

  /**
   * Get workspace by ID
   */
  async getWorkspace(workspaceId: string): Promise<WorkspaceResponse> {
    this.validateUuid(workspaceId, "workspace_id");
    return this.makeRequest<WorkspaceResponse>(
      "GET",
      `/api/v1/workspace/detail?workspace_id=${workspaceId}`,
    );
  }

  /**
   * Get workspace by slug
   */
  async getWorkspaceBySlug(workspaceSlug: string): Promise<WorkspaceResponse> {
    if (!/^[a-z0-9-]+$/.test(workspaceSlug)) {
      throw new WorkspaceServiceError(
        "INVALID_REQUEST",
        "Invalid workspace slug format",
        { slug: workspaceSlug },
      );
    }

    return this.makeRequest<WorkspaceResponse>(
      "GET",
      `/api/v1/workspace/slug/${workspaceSlug}`,
    );
  }

  /**
   * Create new workspace
   */
  async createWorkspace(
    data: CreateWorkspaceRequest,
  ): Promise<CreateWorkspaceResponse> {
    this.validateWorkspaceData(data);
    const sanitizedData = this.sanitizeWorkspaceData(data);

    return this.makeRequest<CreateWorkspaceResponse>(
      "POST",
      "/api/v1/workspace/create",
      sanitizedData,
    );
  }

  /**
   * Update workspace details
   */
  async updateWorkspace(
    workspaceId: string,
    data: UpdateWorkspaceRequest,
  ): Promise<WorkspaceResponse> {
    this.validateUuid(workspaceId, "workspace_id");
    this.validateWorkspaceUpdateData(data);
    const sanitizedData = this.sanitizeWorkspaceUpdateData(data);

    return this.makeRequest<WorkspaceResponse>(
      "PUT",
      `/api/v1/workspace/update?workspace_id=${workspaceId}`,
      sanitizedData,
    );
  }

  /**
   * Delete workspace with vector store cleanup
   */
  async deleteWorkspace(workspaceId: string): Promise<{ success: boolean }> {
    this.validateUuid(workspaceId, "workspace_id");
    return this.makeRequest<{ success: boolean }>(
      "DELETE",
      `/api/v1/workspace/delete?workspace_id=${workspaceId}`,
    );
  }

  /**
   * Duplicate workspace
   */
  async duplicateWorkspace(
    sourceWorkspaceId: string,
  ): Promise<CreateWorkspaceResponse> {
    this.validateUuid(sourceWorkspaceId, "workspace_id");

    const sourceResponse = await this.getWorkspace(sourceWorkspaceId);
    const sourceWorkspace = sourceResponse.workspace;

    const duplicateTitle = this.generateDuplicateTitle(sourceWorkspace.title);

    const duplicateData: CreateWorkspaceRequest = {
      title: duplicateTitle,
      timezone: sourceWorkspace.timezone,
      url: sourceWorkspace.url,
    };

    return this.createWorkspace(duplicateData);
  }

  /**
   * Refresh brand voice analysis for workspace
   */
  async refreshBrandVoice(
    workspaceId: string,
  ): Promise<RefreshBrandVoiceResponse> {
    this.validateUuid(workspaceId, "workspace_id");

    return this.makeRequest<RefreshBrandVoiceResponse>(
      "POST",
      `/api/v1/workspaces/${workspaceId}/brand-voice/refresh`,
    );
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private generateDuplicateTitle(originalTitle: string): string {
    const copyPattern = / \(Copy( \d+)?\)$/;
    const match = originalTitle.match(copyPattern);

    if (match) {
      const copyNumber = match[1] ? parseInt(match[1].trim(), 10) + 1 : 2;
      return originalTitle.replace(copyPattern, ` (Copy ${copyNumber})`);
    } else {
      return `${originalTitle} (Copy)`;
    }
  }

  private async makeRequest<T>(
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

  private async executeRequest<T>(
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

  private async handleErrorResponse(
    response: Response,
    context: WorkspaceApiContext,
    duration: number,
  ): Promise<never> {
    const errorData = await response.json().catch(() => ({}));

    this.log.error("Workspace request failed", {
      requestId: context.requestId,
      status: response.status,
      statusText: response.statusText,
      duration,
      errorData: sanitizeErrorForLogging(errorData),
    });

    throw WorkspaceServiceError.fromResponse(errorData, response.status);
  }

  private async handleRequestError(
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

  private createRequestContext(requestId: string): WorkspaceApiContext {
    return {
      requestId,
      timestamp: new Date().toISOString(),
      userId: undefined,
    };
  }

  // ============================================================================
  // VALIDATION METHODS
  // ============================================================================

  private validateUuid(id: string, fieldName: string): void {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      throw new WorkspaceServiceError(
        "INVALID_REQUEST",
        `Invalid ${fieldName}: must be a valid UUID`,
      );
    }
  }

  private validateWorkspaceData(data: CreateWorkspaceRequest): void {
    if (!data.title || data.title.trim().length === 0) {
      throw new WorkspaceServiceError("INVALID_REQUEST", "Title is required");
    }

    if (data.title.length > 200) {
      throw new WorkspaceServiceError(
        "INVALID_REQUEST",
        "Title must be 200 characters or less",
      );
    }

    if (!data.url || !this.isValidUrl(data.url)) {
      throw new WorkspaceServiceError("INVALID_URL", "Valid URL is required");
    }
  }

  private validateWorkspaceUpdateData(data: UpdateWorkspaceRequest): void {
    if (data.title !== undefined) {
      if (!data.title || data.title.trim().length === 0) {
        throw new WorkspaceServiceError(
          "INVALID_REQUEST",
          "Title cannot be empty",
        );
      }
      if (data.title.length > 200) {
        throw new WorkspaceServiceError(
          "INVALID_REQUEST",
          "Title must be 200 characters or less",
        );
      }
    }

    if (data.url !== undefined && !this.isValidUrl(data.url)) {
      throw new WorkspaceServiceError("INVALID_URL", "Valid URL is required");
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  // ============================================================================
  // SANITIZATION METHODS
  // ============================================================================

  private sanitizeWorkspaceData(
    data: CreateWorkspaceRequest,
  ): Record<string, unknown> {
    return {
      name: InputSanitizer.sanitizeText(data.title.trim()),
      timezone: data.timezone,
      url: data.url.trim(),
    };
  }

  private sanitizeWorkspaceUpdateData(
    data: UpdateWorkspaceRequest,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    if (data.title !== undefined) {
      result.name = InputSanitizer.sanitizeText(data.title.trim());
    }
    if (data.timezone !== undefined) {
      result.timezone = data.timezone;
    }
    if (data.url !== undefined) {
      result.url = data.url.trim();
    }

    return result;
  }

  /**
   * Cancel all active requests
   */
  public cancelAllRequests(): void {
    for (const [requestId, controller] of this.activeRequests) {
      controller.abort();
      this.log.debug("Cancelled request", { requestId });
    }

    this.activeRequests.clear();
  }

  /**
   * Get the count of active requests
   */
  public getActiveRequestsCount(): number {
    return this.activeRequests.size;
  }
}

// Default instance
export const workspaceService = new WorkspaceService();
