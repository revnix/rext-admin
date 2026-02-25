/**
 * @deprecated Use `apiClient.workspaces` from `@/lib/api-client` instead.
 * This service uses legacy `/api/v1/workspace/*` endpoints that may be removed.
 * The API Client uses the canonical RESTful `/api/v1/workspaces/*` endpoints.
 *
 * Migration: Replace `workspaceService.listWorkspaces()` with `apiClient.workspaces.list()`, etc.
 */

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
import { InputSanitizer } from "@/lib/sanitization";
import type {
  CreateWorkspaceRequest,
  CreateWorkspaceResponse,
  RefreshBrandVoiceResponse,
  UpdateWorkspaceRequest,
  WorkspaceApiConfig,
  WorkspaceApiContext,
  WorkspaceListResponse,
  WorkspaceResponse,
} from "@/types/workspace";
import {
  BaseWorkspaceService,
  WorkspaceApiError,
} from "./base-workspace-service";
import { WorkspaceServiceError } from ".";
import { VALIDATION_MESSAGES } from "./validation-messages";

// ============================================================================
// ERROR HANDLING
// ============================================================================

export { WorkspaceApiError as WorkspaceServiceError };

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================
export class WorkspaceService extends BaseWorkspaceService {
  constructor(config: Partial<WorkspaceApiConfig> = {}) {
    super("WorkspaceService", config);
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
        VALIDATION_MESSAGES.INVALID_SLUG_FORMAT,
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

    const duplicateName = this.generateDuplicateName(sourceWorkspace.name);

    const duplicateData: CreateWorkspaceRequest = {
      name: duplicateName,
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

  protected generateDuplicateName(originalName: string): string {
    const copyPattern = / \(Copy( \d+)?\)$/;
    const match = originalName.match(copyPattern);

    if (match) {
      const copyNumber = match[1] ? parseInt(match[1].trim(), 10) + 1 : 2;
      return originalName.replace(copyPattern, ` (Copy ${copyNumber})`);
    } else {
      return `${originalName} (Copy)`;
    }
  }

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

  protected async handleErrorResponse(
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

  protected createRequestContext(requestId: string): WorkspaceApiContext {
    return {
      requestId,
      timestamp: new Date().toISOString(),
      userId: undefined,
    };
  }

  // ============================================================================
  // VALIDATION METHODS
  // ============================================================================

  protected validateUuid(id: string, fieldName: string): void {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      throw new WorkspaceServiceError(
        "INVALID_REQUEST",
        VALIDATION_MESSAGES.INVALID_UUID(fieldName),
      );
    }
  }

  protected validateWorkspaceData(data: CreateWorkspaceRequest): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new WorkspaceServiceError(
        "INVALID_REQUEST",
        VALIDATION_MESSAGES.TITLE_REQUIRED,
      );
    }

    if (data.name.length > 200) {
      throw new WorkspaceServiceError(
        "INVALID_REQUEST",
        VALIDATION_MESSAGES.TITLE_MAX_LENGTH(200),
      );
    }

    if (!data.url || !this.isValidUrl(data.url)) {
      throw new WorkspaceServiceError(
        "INVALID_URL",
        VALIDATION_MESSAGES.URL_REQUIRED,
      );
    }
  }

  protected validateWorkspaceUpdateData(data: UpdateWorkspaceRequest): void {
    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        throw new WorkspaceServiceError(
          "INVALID_REQUEST",
          VALIDATION_MESSAGES.TITLE_REQUIRED,  // Now consistent with create
        );
      }
      if (data.name.length > 200) {
        throw new WorkspaceServiceError(
          "INVALID_REQUEST",
          VALIDATION_MESSAGES.TITLE_MAX_LENGTH(200),
        );
      }
    }

    if (data.url !== undefined && !this.isValidUrl(data.url)) {
      throw new WorkspaceServiceError(
        "INVALID_URL",
        VALIDATION_MESSAGES.URL_REQUIRED,
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

  // ============================================================================
  // SANITIZATION METHODS
  // ============================================================================

  private sanitizeWorkspaceData(
    data: CreateWorkspaceRequest,
  ): Record<string, unknown> {
    return {
      name: InputSanitizer.sanitizeText(data.name.trim()),
      timezone: data.timezone,
      url: data.url.trim(),
    };
  }

  private sanitizeWorkspaceUpdateData(
    data: UpdateWorkspaceRequest,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    if (data.name !== undefined) {
      result.name = InputSanitizer.sanitizeText(data.name.trim());
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
