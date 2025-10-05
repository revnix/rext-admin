/**
 * Knowledge Service - Knowledge Management Operations
 *
 * Handles workspace knowledge operations including:
 * - Web knowledge (URL scraping)
 * - File knowledge (file uploads)
 * - Text knowledge (direct text content)
 * - Workspace-specific knowledge queries
 */

import { apiErrorHandler } from "@/lib/api-error-middleware";
import { authenticatedFetch } from "@/lib/auth-utils";
import { generateRequestId, sanitizeErrorForLogging } from "@/lib/error-utils";
import { logger } from "@/lib/logger";
import { InputSanitizer } from "@/lib/sanitization";
import type {
  AddFileKnowledgeRequest,
  AddTextKnowledgeRequest,
  AddWebKnowledgeRequest,
  FileKnowledge,
  TextKnowledge,
  WebKnowledge,
  WorkspaceApiConfig,
  WorkspaceApiContext,
  WorkspaceErrorCode,
} from "@/types/workspace";

// ============================================================================
// ERROR HANDLING
// ============================================================================

export class KnowledgeServiceError extends Error {
  constructor(
    public readonly code: WorkspaceErrorCode,
    public readonly message: string,
    public readonly details?: Record<string, unknown>,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "KnowledgeServiceError";
  }

  static fromResponse(
    response: unknown,
    statusCode: number,
  ): KnowledgeServiceError {
    const responseObj = response as Record<string, unknown>;
    const code =
      (responseObj.error_code as WorkspaceErrorCode) || "INVALID_REQUEST";
    const message =
      (responseObj.error as string) || "An unknown error occurred";
    const details = (responseObj.details as Record<string, unknown>) || {};

    return new KnowledgeServiceError(code, message, details, statusCode);
  }
}

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export class KnowledgeService {
  private readonly config: WorkspaceApiConfig;
  private readonly log = logger.forComponent("KnowledgeService");
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
  // WEB KNOWLEDGE OPERATIONS
  // ============================================================================

  async listWebKnowledge(
    workspaceId: string,
  ): Promise<{ web_knowledge: WebKnowledge[] }> {
    this.validateUuid(workspaceId, "workspace_id");
    return this.makeRequest<{ web_knowledge: WebKnowledge[] }>(
      "GET",
      `/api/v1/workspace/web_knowledge/all?workspace_id=${encodeURIComponent(workspaceId)}`,
    );
  }

  async getWebKnowledge(
    webId: string,
    workspaceId: string,
  ): Promise<{ web_knowledge: WebKnowledge }> {
    this.validateUuid(webId, "web_id");
    this.validateUuid(workspaceId, "workspace_id");
    return this.makeRequest<{ web_knowledge: WebKnowledge }>(
      "GET",
      `/api/v1/workspace/web_knowledge/${webId}?workspace_id=${encodeURIComponent(workspaceId)}`,
    );
  }

  async addWebKnowledge(
    data: AddWebKnowledgeRequest,
  ): Promise<{ web_knowledge: WebKnowledge }> {
    this.validateWebKnowledgeData(data);
    const sanitizedData = this.sanitizeWebKnowledgeData(data);

    return this.makeRequest<{ web_knowledge: WebKnowledge }>(
      "POST",
      "/api/v1/workspace/web_knowledge/add",
      sanitizedData,
    );
  }

  async updateWebKnowledge(
    workspaceId: string,
    webId: string,
    title: string,
  ): Promise<{ web_knowledge: WebKnowledge }> {
    this.validateUuid(workspaceId, "workspace_id");
    this.validateUuid(webId, "web_id");

    return this.makeRequest<{ web_knowledge: WebKnowledge }>(
      "PUT",
      `/api/v1/workspace/web_knowledge/update/${webId}?workspace_id=${encodeURIComponent(workspaceId)}&title=${encodeURIComponent(title)}`,
    );
  }

  async deleteWebKnowledge(
    workspaceId: string,
    webId: string,
  ): Promise<{ success: boolean }> {
    this.validateUuid(workspaceId, "workspace_id");
    this.validateUuid(webId, "web_id");

    return this.makeRequest<{ success: boolean }>(
      "DELETE",
      `/api/v1/workspace/web_knowledge/delete/${webId}?workspace_id=${encodeURIComponent(workspaceId)}`,
    );
  }

  // ============================================================================
  // FILE KNOWLEDGE OPERATIONS
  // ============================================================================

  async listFileKnowledge(
    workspaceId: string,
  ): Promise<{ file_knowledge: FileKnowledge[] }> {
    this.validateUuid(workspaceId, "workspace_id");
    return this.makeRequest<{ file_knowledge: FileKnowledge[] }>(
      "GET",
      `/api/v1/workspace/file/all?workspace_id=${encodeURIComponent(workspaceId)}`,
    );
  }

  async getFileKnowledge(
    fileId: string,
    workspaceId: string,
  ): Promise<{ file_knowledge: FileKnowledge }> {
    this.validateUuid(fileId, "file_id");
    this.validateUuid(workspaceId, "workspace_id");
    return this.makeRequest<{ file_knowledge: FileKnowledge }>(
      "GET",
      `/api/v1/workspace/file/${fileId}?workspace_id=${encodeURIComponent(workspaceId)}`,
    );
  }

  async addFileKnowledge(
    data: AddFileKnowledgeRequest,
  ): Promise<{ file_knowledge: FileKnowledge }> {
    this.validateFileKnowledgeData(data);

    const formData = new FormData();
    formData.append("workspace_id", data.workspace_id);
    formData.append("file", data.file);

    return this.makeFileRequest<{ file_knowledge: FileKnowledge }>(
      "POST",
      "/api/v1/workspace/file/add",
      formData,
    );
  }

  async deleteFileKnowledge(
    workspaceId: string,
    fileId: string,
  ): Promise<{ success: boolean }> {
    this.validateUuid(workspaceId, "workspace_id");
    this.validateUuid(fileId, "file_id");

    return this.makeRequest<{ success: boolean }>(
      "DELETE",
      `/api/v1/workspace/file/delete/${fileId}?workspace_id=${encodeURIComponent(workspaceId)}`,
    );
  }

  // ============================================================================
  // TEXT KNOWLEDGE OPERATIONS
  // ============================================================================

  async listTextKnowledge(
    workspaceId: string,
  ): Promise<{ text_knowledge: TextKnowledge[] }> {
    this.validateUuid(workspaceId, "workspace_id");
    return this.makeRequest<{ text_knowledge: TextKnowledge[] }>(
      "GET",
      `/api/v1/workspace/text/all?workspace_id=${encodeURIComponent(workspaceId)}`,
    );
  }

  async getTextKnowledge(
    textId: string,
    workspaceId: string,
  ): Promise<{ text_knowledge: TextKnowledge }> {
    this.validateUuid(textId, "text_id");
    this.validateUuid(workspaceId, "workspace_id");

    return this.makeRequest<{ text_knowledge: TextKnowledge }>(
      "GET",
      `/api/v1/workspace/text/${textId}?workspace_id=${encodeURIComponent(workspaceId)}`,
    );
  }

  async addTextKnowledge(
    data: AddTextKnowledgeRequest,
  ): Promise<{ text_knowledge: TextKnowledge }> {
    this.validateTextKnowledgeData(data);
    const sanitizedData = this.sanitizeTextKnowledgeData(data);

    return this.makeRequest<{ text_knowledge: TextKnowledge }>(
      "POST",
      "/api/v1/workspace/text/add-text",
      sanitizedData,
    );
  }

  async updateTextKnowledge(
    textId: string,
    workspaceId: string,
    newContent: string,
  ): Promise<{ text_knowledge: TextKnowledge }> {
    this.validateUuid(textId, "text_id");
    this.validateUuid(workspaceId, "workspace_id");

    return this.makeRequest<{ text_knowledge: TextKnowledge }>(
      "PUT",
      `/api/v1/workspace/text/update/${textId}?workspace_id=${encodeURIComponent(workspaceId)}&new_content=${encodeURIComponent(newContent)}`,
    );
  }

  async deleteTextKnowledge(
    textId: string,
    workspaceId: string,
  ): Promise<{ success: boolean }> {
    this.validateUuid(textId, "text_id");
    this.validateUuid(workspaceId, "workspace_id");

    return this.makeRequest<{ success: boolean }>(
      "DELETE",
      `/api/v1/workspace/text/delete/${textId}?workspace_id=${encodeURIComponent(workspaceId)}`,
    );
  }

  // ============================================================================
  // WORKSPACE-SPECIFIC KNOWLEDGE ENDPOINTS
  // ============================================================================

  async getWorkspaceKnowledge(workspaceId: string): Promise<{
    web_knowledge: WebKnowledge[];
    file_knowledge: FileKnowledge[];
    text_knowledge: TextKnowledge[];
    summary: {
      web_count: number;
      file_count: number;
      text_count: number;
      total_count: number;
    };
  }> {
    this.validateUuid(workspaceId, "workspace_id");

    return this.makeRequest<{
      web_knowledge: WebKnowledge[];
      file_knowledge: FileKnowledge[];
      text_knowledge: TextKnowledge[];
      summary: {
        web_count: number;
        file_count: number;
        text_count: number;
        total_count: number;
      };
    }>("GET", `/api/v1/workspace/${workspaceId}/knowledge/all`);
  }

  async getWorkspaceWebKnowledge(
    workspaceId: string,
  ): Promise<{ web_knowledge: WebKnowledge[]; total_count: number }> {
    this.validateUuid(workspaceId, "workspace_id");

    return this.makeRequest<{
      web_knowledge: WebKnowledge[];
      total_count: number;
    }>("GET", `/api/v1/workspace/${workspaceId}/knowledge/web`);
  }

  async getWorkspaceFileKnowledge(
    workspaceId: string,
  ): Promise<{ file_knowledge: FileKnowledge[]; total_count: number }> {
    this.validateUuid(workspaceId, "workspace_id");

    return this.makeRequest<{
      file_knowledge: FileKnowledge[];
      total_count: number;
    }>("GET", `/api/v1/workspace/${workspaceId}/knowledge/files`);
  }

  async getWorkspaceTextKnowledge(
    workspaceId: string,
  ): Promise<{ text_knowledge: TextKnowledge[]; total_count: number }> {
    this.validateUuid(workspaceId, "workspace_id");

    return this.makeRequest<{
      text_knowledge: TextKnowledge[];
      total_count: number;
    }>("GET", `/api/v1/workspace/${workspaceId}/knowledge/text`);
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

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

  private async makeFileRequest<T>(
    method: string,
    endpoint: string,
    formData: FormData,
  ): Promise<T> {
    const requestId = generateRequestId();
    const context = this.createRequestContext(requestId);
    const controller = new AbortController();
    this.activeRequests.set(requestId, controller);

    try {
      return await this.executeFileRequest<T>(
        method,
        endpoint,
        formData,
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

  private async executeFileRequest<T>(
    method: string,
    endpoint: string,
    formData: FormData,
    signal: AbortSignal,
    context: WorkspaceApiContext,
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;

    try {
      const headers: Record<string, string> = {
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
        body: formData,
        signal: combinedSignal,
      });

      if (!response.ok) {
        const duration = Date.now() - Date.now();
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
      const duration = Date.now() - Date.now();
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

    this.log.error("Knowledge request failed", {
      requestId: context.requestId,
      status: response.status,
      statusText: response.statusText,
      duration,
      errorData: sanitizeErrorForLogging(errorData),
    });

    throw KnowledgeServiceError.fromResponse(errorData, response.status);
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
      throw new KnowledgeServiceError(
        "INVALID_REQUEST",
        `Invalid ${fieldName}: must be a valid UUID`,
      );
    }
  }

  private validateWebKnowledgeData(data: AddWebKnowledgeRequest): void {
    this.validateUuid(data.workspace_id, "workspace_id");
    if (!data.url || !this.isValidUrl(data.url)) {
      throw new KnowledgeServiceError("INVALID_URL", "Valid URL is required");
    }
  }

  private validateFileKnowledgeData(data: AddFileKnowledgeRequest): void {
    this.validateUuid(data.workspace_id, "workspace_id");
    if (!data.file || !(data.file instanceof File)) {
      throw new KnowledgeServiceError(
        "INVALID_REQUEST",
        "Valid file is required",
      );
    }

    if (data.file.size > 10 * 1024 * 1024) {
      throw new KnowledgeServiceError(
        "INVALID_REQUEST",
        "File size must be 10MB or less",
      );
    }
  }

  private validateTextKnowledgeData(data: AddTextKnowledgeRequest): void {
    this.validateUuid(data.workspace_id, "workspace_id");
    if (!data.title || data.title.trim().length === 0) {
      throw new KnowledgeServiceError("INVALID_REQUEST", "Title is required");
    }
    if (!data.content || data.content.trim().length === 0) {
      throw new KnowledgeServiceError("INVALID_REQUEST", "Content is required");
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

  private sanitizeWebKnowledgeData(
    data: AddWebKnowledgeRequest,
  ): AddWebKnowledgeRequest {
    return {
      workspace_id: data.workspace_id,
      url: data.url.trim(),
    };
  }

  private sanitizeTextKnowledgeData(
    data: AddTextKnowledgeRequest,
  ): AddTextKnowledgeRequest {
    return {
      workspace_id: data.workspace_id,
      title: InputSanitizer.sanitizeText(data.title.trim()),
      content: InputSanitizer.sanitizeText(data.content.trim()),
      tags: data.tags
        ?.map((tag) => InputSanitizer.sanitizeText(tag.trim()))
        .filter(Boolean),
    };
  }

  public cancelAllRequests(): void {
    for (const [_requestId, controller] of this.activeRequests) {
      controller.abort();
    }
    this.activeRequests.clear();
  }
}

// Default instance
export const knowledgeService = new KnowledgeService();
