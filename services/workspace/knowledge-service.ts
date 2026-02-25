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
import { InputSanitizer } from "@/lib/sanitization";
import type {
  AddFileKnowledgeRequest,
  AddTextKnowledgeRequest,
  AddWebKnowledgeRequest,
  FileKnowledge,
  TextKnowledge,
  UpdateTextKnowledgeRequest,
  WebKnowledge,
  WorkspaceApiConfig,
  WorkspaceApiContext,
} from "@/types/workspace";
import {
  BaseWorkspaceService,
  WorkspaceApiError,
} from "./base-workspace-service";

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export { WorkspaceApiError as KnowledgeServiceError };

export class KnowledgeService extends BaseWorkspaceService {
  constructor(config: Partial<WorkspaceApiConfig> = {}) {
    super("KnowledgeService", config);
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
      `/api/v1/workspaces/${workspaceId}/knowledge/web`,
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
      `/api/v1/workspaces/${workspaceId}/knowledge/web/${webId}`,
    );
  }

  async addWebKnowledge(
    data: AddWebKnowledgeRequest,
  ): Promise<{ web_knowledge: WebKnowledge }> {
    this.validateWebKnowledgeData(data);
    const sanitizedData = this.sanitizeWebKnowledgeData(data);

    return this.makeRequest<{ web_knowledge: WebKnowledge }>(
      "POST",
      `/api/v1/workspaces/${data.workspace_id}/knowledge/web`,
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
      "PATCH",
      `/api/v1/workspaces/${workspaceId}/knowledge/web/${webId}`,
      { title },
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
      `/api/v1/workspaces/${workspaceId}/knowledge/web/${webId}`,
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
      `/api/v1/workspaces/${workspaceId}/knowledge/files`,
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
      `/api/v1/workspaces/${workspaceId}/knowledge/files/${fileId}`,
    );
  }

  async addFileKnowledge(
    data: AddFileKnowledgeRequest,
  ): Promise<{ file_knowledge: FileKnowledge }> {
    this.validateFileKnowledgeData(data);

    const formData = new FormData();
    formData.append("file", data.file);

    return this.makeFileRequest<{ file_knowledge: FileKnowledge }>(
      "POST",
      `/api/v1/workspaces/${data.workspace_id}/knowledge/files`,
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
      `/api/v1/workspaces/${workspaceId}/knowledge/files/${fileId}`,
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
      `/api/v1/workspaces/${workspaceId}/knowledge/text`,
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
      `/api/v1/workspaces/${workspaceId}/knowledge/text/${textId}`,
    );
  }

  async addTextKnowledge(
    data: AddTextKnowledgeRequest,
  ): Promise<{ text_knowledge: TextKnowledge }> {
    this.validateTextKnowledgeData(data);
    const sanitizedData = this.sanitizeTextKnowledgeData(data);

    return this.makeRequest<{ text_knowledge: TextKnowledge }>(
      "POST",
      `/api/v1/workspaces/${data.workspace_id}/knowledge/text`,
      sanitizedData,
    );
  }

  async updateTextKnowledge(
    textId: string,
    workspaceId: string,
    data: UpdateTextKnowledgeRequest,
  ): Promise<{ text_knowledge: TextKnowledge }> {
    this.validateUuid(textId, "text_id");
    this.validateUuid(workspaceId, "workspace_id");
    const sanitized = this.sanitizeUpdateTextKnowledgeData(data);

    if (Object.keys(sanitized).length === 0) {
      throw new WorkspaceApiError(
        "INVALID_REQUEST",
        "At least one field (title, content, tags) must be provided",
      );
    }

    return this.makeRequest<{ text_knowledge: TextKnowledge }>(
      "PATCH",
      `/api/v1/workspaces/${workspaceId}/knowledge/text/${textId}`,
      sanitized,
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
      `/api/v1/workspaces/${workspaceId}/knowledge/text/${textId}`,
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
    }>("GET", `/api/v1/workspaces/${workspaceId}/knowledge`);
  }

  async getWorkspaceWebKnowledge(
    workspaceId: string,
  ): Promise<{ web_knowledge: WebKnowledge[]; total_count: number }> {
    this.validateUuid(workspaceId, "workspace_id");

    return this.makeRequest<{
      web_knowledge: WebKnowledge[];
      total_count: number;
    }>("GET", `/api/v1/workspaces/${workspaceId}/knowledge/web`);
  }

  async getWorkspaceFileKnowledge(
    workspaceId: string,
  ): Promise<{ file_knowledge: FileKnowledge[]; total_count: number }> {
    this.validateUuid(workspaceId, "workspace_id");

    return this.makeRequest<{
      file_knowledge: FileKnowledge[];
      total_count: number;
    }>("GET", `/api/v1/workspaces/${workspaceId}/knowledge/files`);
  }

  async getWorkspaceTextKnowledge(
    workspaceId: string,
  ): Promise<{ text_knowledge: TextKnowledge[]; total_count: number }> {
    this.validateUuid(workspaceId, "workspace_id");

    return this.makeRequest<{
      text_knowledge: TextKnowledge[];
      total_count: number;
    }>("GET", `/api/v1/workspaces/${workspaceId}/knowledge/text`);
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
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

  protected async handleErrorResponse(
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
      throw new WorkspaceApiError(
        "INVALID_REQUEST",
        `Invalid ${fieldName}: must be a valid UUID`,
      );
    }
  }

  protected validateWebKnowledgeData(data: AddWebKnowledgeRequest): void {
    this.validateUuid(data.workspace_id, "workspace_id");
    if (!data.url || !this.isValidUrl(data.url)) {
      throw new WorkspaceApiError("INVALID_URL", "Valid URL is required");
    }
  }

  protected validateFileKnowledgeData(data: AddFileKnowledgeRequest): void {
    this.validateUuid(data.workspace_id, "workspace_id");
    if (!data.file || !(data.file instanceof File)) {
      throw new WorkspaceApiError("INVALID_REQUEST", "Valid file is required");
    }

    if (data.file.size > 10 * 1024 * 1024) {
      throw new WorkspaceApiError(
        "INVALID_REQUEST",
        "File size must be 10MB or less",
      );
    }
  }

  protected validateTextKnowledgeData(data: AddTextKnowledgeRequest): void {
    this.validateUuid(data.workspace_id, "workspace_id");
    if (!data.title || data.title.trim().length === 0) {
      throw new WorkspaceApiError("INVALID_REQUEST", "Title is required");
    }
    if (!data.content || data.content.trim().length === 0) {
      throw new WorkspaceApiError("INVALID_REQUEST", "Content is required");
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

  private sanitizeWebKnowledgeData(data: AddWebKnowledgeRequest): {
    url: string;
    title?: string;
  } {
    const sanitized: { url: string; title?: string } = {
      url: data.url.trim(),
    };

    if (data.title && data.title.trim().length > 0) {
      sanitized.title = InputSanitizer.sanitizeText(data.title.trim());
    }

    return sanitized;
  }

  private sanitizeTextKnowledgeData(data: AddTextKnowledgeRequest): {
    title: string;
    content: string;
    tags?: string[];
  } {
    return {
      title: InputSanitizer.sanitizeText(data.title.trim()),
      content: InputSanitizer.sanitizeText(data.content.trim()),
      tags: data.tags
        ?.map((tag) => InputSanitizer.sanitizeText(tag.trim()))
        .filter(Boolean),
    };
  }

  private sanitizeUpdateTextKnowledgeData(data: UpdateTextKnowledgeRequest): {
    title?: string;
    content?: string;
    tags?: string[];
  } {
    const sanitized: { title?: string; content?: string; tags?: string[] } = {};

    if (data.title && data.title.trim().length > 0) {
      sanitized.title = InputSanitizer.sanitizeText(data.title.trim());
    }

    if (data.content && data.content.trim().length > 0) {
      sanitized.content = InputSanitizer.sanitizeText(data.content.trim());
    }

    if (data.tags) {
      const cleanedTags = data.tags
        .map((tag) => InputSanitizer.sanitizeText(tag.trim()))
        .filter(Boolean);

      if (cleanedTags.length > 0) {
        sanitized.tags = cleanedTags;
      }
    }

    return sanitized;
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
