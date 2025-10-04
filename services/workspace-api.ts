/**
 * Workspace API Service Client
 *
 * This module provides a comprehensive API client for workspace management,
 * including CRUD operations, knowledge management, and brand voice features.
 * Follows the established patterns from backend.ts with error handling,
 * request deduplication, and proper authentication.
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
  CreateWorkspaceRequest,
  FileKnowledge,
  RefreshBrandVoiceResponse,
  TextKnowledge,
  UpdateTextKnowledgeRequest,
  UpdateWorkspaceRequest,
  WebKnowledge,
  WorkspaceApiConfig,
  WorkspaceApiContext,
  WorkspaceErrorCode,
  WorkspaceListResponse,
  WorkspaceResponse,
} from "@/types/workspace";

// ============================================================================
// ERROR HANDLING
// ============================================================================

export class WorkspaceApiError extends Error {
  constructor(
    public readonly code: WorkspaceErrorCode,
    public readonly message: string,
    public readonly details?: Record<string, unknown>,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "WorkspaceApiError";
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
// MAIN SERVICE CLASS
// ============================================================================

export class WorkspaceApiService {
  private readonly config: WorkspaceApiConfig;
  private readonly log = logger.forComponent("WorkspaceApiService");
  private readonly activeRequests = new Map<string, AbortController>();
  private readonly requestDeduplicationMap = new Map<
    string,
    Promise<unknown>
  >();

  constructor(config: Partial<WorkspaceApiConfig> = {}) {
    this.config = {
      baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:2024",
      timeout: 30000, // 30 seconds
      enableRequestDeduplication: true,
      ...config,
    };

    this.log.info("WorkspaceApiService initialized", {
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
    });
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
      `/api/v1/workspace/${workspaceId}`,
    );
  }

  /**
   * Create new workspace (includes website scraping + brand voice extraction)
   */
  async createWorkspace(
    data: CreateWorkspaceRequest,
  ): Promise<WorkspaceResponse> {
    this.validateWorkspaceData(data);
    const sanitizedData = this.sanitizeWorkspaceData(data);

    return this.makeRequest<WorkspaceResponse>(
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
      `/api/v1/workspace/update/${workspaceId}`,
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
      `/api/v1/workspace/delete/${workspaceId}`,
    );
  }

  /**
   * Duplicate workspace by creating a new workspace with copied data
   * Note: This is a client-side operation that uses the create endpoint
   */
  async duplicateWorkspace(
    sourceWorkspaceId: string,
  ): Promise<WorkspaceResponse> {
    this.validateUuid(sourceWorkspaceId, "workspace_id");

    // First, get the source workspace data
    const sourceResponse = await this.getWorkspace(sourceWorkspaceId);
    const sourceWorkspace = sourceResponse.workspace;

    // Generate a unique title for the duplicate
    const duplicateTitle = this.generateDuplicateTitle(sourceWorkspace.title);

    // Create the duplicate workspace data
    const duplicateData: CreateWorkspaceRequest = {
      title: duplicateTitle,
      description: sourceWorkspace.description
        ? `${sourceWorkspace.description} (Duplicated from ${sourceWorkspace.title})`
        : `Duplicated from ${sourceWorkspace.title}`,
      url: sourceWorkspace.url,
    };

    // Create the new workspace
    return this.createWorkspace(duplicateData);
  }

  /**
   * Generate a unique title for duplicated workspace
   */
  private generateDuplicateTitle(originalTitle: string): string {
    const copyPattern = / \(Copy( \d+)?\)$/;
    const match = originalTitle.match(copyPattern);

    if (match) {
      // Title already has "(Copy)" or "(Copy N)" - increment the number
      const copyNumber = match[1] ? parseInt(match[1].trim(), 10) + 1 : 2;
      return originalTitle.replace(copyPattern, ` (Copy ${copyNumber})`);
    } else {
      // First copy - add "(Copy)"
      return `${originalTitle} (Copy)`;
    }
  }

  /**
   * Refresh brand voice analysis for workspace
   * Note: This is a mock implementation for frontend development
   * In production, this would trigger backend re-analysis
   */
  async refreshBrandVoice(
    workspaceId: string,
  ): Promise<RefreshBrandVoiceResponse> {
    this.validateUuid(workspaceId, "workspace_id");

    // Mock implementation - simulate backend processing time
    return new Promise((resolve) => {
      setTimeout(
        () => {
          const changesDetected = Math.random() > 0.3; // 70% chance of changes
          resolve({
            brand_voice: this.generateMockUpdatedBrandVoice(workspaceId),
            changes_detected: changesDetected,
            previous_brand_voice: changesDetected
              ? this.generateMockPreviousBrandVoice(workspaceId)
              : undefined,
          });
        },
        2000 + Math.random() * 3000,
      ); // 2-5 second delay to simulate processing
    });
  }

  /**
   * Generate mock updated brand voice data
   */
  private generateMockUpdatedBrandVoice(workspaceId: string) {
    const mockVariations = [
      {
        about:
          "An innovative tech company focused on AI-driven solutions and cutting-edge automation tools.",
        customer_profile:
          "Forward-thinking businesses and entrepreneurs seeking intelligent automation and data-driven insights.",
        selling_position:
          "Leading provider of intelligent automation tools that transform business operations through AI.",
        target_audience: [
          "Tech Leaders",
          "Business Owners",
          "Innovation Teams",
          "Digital Transformation Managers",
        ],
        brand_voice: [
          "Professional",
          "Innovative",
          "Trustworthy",
          "Results-Driven",
          "Forward-Thinking",
        ],
        competitors: [
          "TechCorp",
          "AI Solutions Inc",
          "AutomateNow",
          "SmartFlow",
        ],
        content_strategy: [
          "Thought Leadership",
          "Case Studies",
          "Product Demos",
          "Industry Insights",
        ],
      },
      {
        about:
          "A customer-centric technology platform empowering businesses with seamless digital experiences.",
        customer_profile:
          "Growing companies looking to enhance customer experience and streamline operations.",
        selling_position:
          "The all-in-one platform for businesses to create exceptional customer experiences at scale.",
        target_audience: [
          "Customer Success Teams",
          "Product Managers",
          "Small Business Owners",
          "Growth Teams",
        ],
        brand_voice: [
          "Approachable",
          "Empowering",
          "Reliable",
          "Customer-First",
          "Growth-Oriented",
        ],
        competitors: [
          "CustomerFlow",
          "ExperienceHub",
          "BusinessGrow",
          "ScaleUp",
        ],
        content_strategy: [
          "Customer Stories",
          "Best Practices",
          "Growth Tips",
          "Platform Updates",
        ],
      },
      {
        about:
          "A data-driven analytics company helping organizations make informed decisions through advanced insights.",
        customer_profile:
          "Data-conscious leaders and analysts seeking actionable business intelligence.",
        selling_position:
          "Transform your data into strategic advantages with our comprehensive analytics platform.",
        target_audience: [
          "Data Analysts",
          "Business Intelligence Teams",
          "C-Suite Executives",
          "Research Teams",
        ],
        brand_voice: [
          "Analytical",
          "Insightful",
          "Precise",
          "Strategic",
          "Data-Driven",
        ],
        competitors: [
          "DataViz Pro",
          "Analytics Central",
          "InsightFlow",
          "MetricsHub",
        ],
        content_strategy: [
          "Data Insights",
          "Industry Reports",
          "Methodology Guides",
          "Trend Analysis",
        ],
      },
    ];

    const selectedVariation =
      mockVariations[Math.floor(Math.random() * mockVariations.length)];

    return {
      id: generateRequestId(),
      workspace_id: workspaceId,
      ...selectedVariation,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Generate mock previous brand voice data for comparison
   */
  private generateMockPreviousBrandVoice(workspaceId: string) {
    return {
      id: generateRequestId(),
      workspace_id: workspaceId,
      about: "A technology company providing business solutions.",
      customer_profile: "Businesses looking for software solutions.",
      selling_position: "Reliable technology solutions for modern businesses.",
      target_audience: ["Business Owners", "IT Teams"],
      brand_voice: ["Professional", "Reliable", "Practical"],
      competitors: ["TechCorp", "BusinessSoft"],
      content_strategy: ["Product Updates", "Case Studies"],
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  // ============================================================================
  // WEB KNOWLEDGE OPERATIONS
  // ============================================================================

  /**
   * List all web knowledge entries
   */
  async listWebKnowledge(): Promise<{ web_knowledge: WebKnowledge[] }> {
    return this.makeRequest<{ web_knowledge: WebKnowledge[] }>(
      "GET",
      "/api/v1/workspace/web_knowledge/all",
    );
  }

  /**
   * Get specific web knowledge
   */
  async getWebKnowledge(
    webId: string,
  ): Promise<{ web_knowledge: WebKnowledge }> {
    this.validateUuid(webId, "web_id");
    return this.makeRequest<{ web_knowledge: WebKnowledge }>(
      "GET",
      `/api/v1/workspace/web_knowledge/${webId}`,
    );
  }

  /**
   * Add URL with automatic scraping & vector storage
   */
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

  /**
   * Update web knowledge
   */
  async updateWebKnowledge(
    workspaceId: string,
    webId: string,
    title: string,
  ): Promise<{ web_knowledge: WebKnowledge }> {
    this.validateUuid(workspaceId, "workspace_id");
    this.validateUuid(webId, "web_id");

    return this.makeRequest<{ web_knowledge: WebKnowledge }>(
      "PUT",
      `/api/v1/workspace/web_knowledge/update/${workspaceId}/${webId}?title=${encodeURIComponent(title)}`,
    );
  }

  /**
   * Delete web knowledge with cleanup
   */
  async deleteWebKnowledge(
    workspaceId: string,
    webId: string,
  ): Promise<{ success: boolean }> {
    this.validateUuid(workspaceId, "workspace_id");
    this.validateUuid(webId, "web_id");

    return this.makeRequest<{ success: boolean }>(
      "DELETE",
      `/api/v1/workspace/web_knowledge/delete/${workspaceId}/${webId}`,
    );
  }

  // ============================================================================
  // FILE KNOWLEDGE OPERATIONS
  // ============================================================================

  /**
   * List all file knowledge
   */
  async listFileKnowledge(): Promise<{ file_knowledge: FileKnowledge[] }> {
    return this.makeRequest<{ file_knowledge: FileKnowledge[] }>(
      "GET",
      "/api/v1/workspace/file/all",
    );
  }

  /**
   * Get specific file knowledge
   */
  async getFileKnowledge(
    fileId: string,
  ): Promise<{ file_knowledge: FileKnowledge }> {
    this.validateUuid(fileId, "file_id");
    return this.makeRequest<{ file_knowledge: FileKnowledge }>(
      "GET",
      `/api/v1/workspace/file/${fileId}`,
    );
  }

  /**
   * Upload file with text extraction & vector storage
   */
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

  /**
   * Delete file knowledge with file cleanup
   */
  async deleteFileKnowledge(
    workspaceId: string,
    fileId: string,
  ): Promise<{ success: boolean }> {
    this.validateUuid(workspaceId, "workspace_id");
    this.validateUuid(fileId, "file_id");

    return this.makeRequest<{ success: boolean }>(
      "DELETE",
      `/api/v1/workspace/file/delete/${workspaceId}/${fileId}`,
    );
  }

  // ============================================================================
  // TEXT KNOWLEDGE OPERATIONS
  // ============================================================================

  /**
   * List all text knowledge
   */
  async listTextKnowledge(): Promise<{ text_knowledge: TextKnowledge[] }> {
    return this.makeRequest<{ text_knowledge: TextKnowledge[] }>(
      "GET",
      "/api/v1/workspace/text/all",
    );
  }

  /**
   * Get specific text knowledge
   */
  async getTextKnowledge(
    workspaceId: string,
    textId: string,
  ): Promise<{ text_knowledge: TextKnowledge }> {
    this.validateUuid(workspaceId, "workspace_id");
    this.validateUuid(textId, "text_id");

    return this.makeRequest<{ text_knowledge: TextKnowledge }>(
      "GET",
      `/api/v1/workspace/text/${workspaceId}/${textId}`,
    );
  }

  /**
   * Add direct text content
   */
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

  /**
   * Update text content
   */
  async updateTextKnowledge(
    workspaceId: string,
    textId: string,
    data: UpdateTextKnowledgeRequest,
  ): Promise<{ text_knowledge: TextKnowledge }> {
    this.validateUuid(workspaceId, "workspace_id");
    this.validateUuid(textId, "text_id");
    this.validateTextKnowledgeUpdateData(data);
    const sanitizedData = this.sanitizeTextKnowledgeUpdateData(data);

    return this.makeRequest<{ text_knowledge: TextKnowledge }>(
      "PUT",
      `/api/v1/workspace/text/update/${workspaceId}/${textId}`,
      sanitizedData,
    );
  }

  /**
   * Delete text knowledge
   */
  async deleteTextKnowledge(
    workspaceId: string,
    textId: string,
  ): Promise<{ success: boolean }> {
    this.validateUuid(workspaceId, "workspace_id");
    this.validateUuid(textId, "text_id");

    return this.makeRequest<{ success: boolean }>(
      "DELETE",
      `/api/v1/workspace/text/delete/${workspaceId}/${textId}`,
    );
  }

  // ============================================================================
  // WORKSPACE-SPECIFIC KNOWLEDGE ENDPOINTS
  // ============================================================================

  /**
   * Get all knowledge for a specific workspace
   */
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

  /**
   * Get web knowledge for a specific workspace
   */
  async getWorkspaceWebKnowledge(
    workspaceId: string,
  ): Promise<{ web_knowledge: WebKnowledge[]; total_count: number }> {
    this.validateUuid(workspaceId, "workspace_id");

    return this.makeRequest<{
      web_knowledge: WebKnowledge[];
      total_count: number;
    }>("GET", `/api/v1/workspace/${workspaceId}/knowledge/web`);
  }

  /**
   * Get file knowledge for a specific workspace
   */
  async getWorkspaceFileKnowledge(
    workspaceId: string,
  ): Promise<{ file_knowledge: FileKnowledge[]; total_count: number }> {
    this.validateUuid(workspaceId, "workspace_id");

    return this.makeRequest<{
      file_knowledge: FileKnowledge[];
      total_count: number;
    }>("GET", `/api/v1/workspace/${workspaceId}/knowledge/files`);
  }

  /**
   * Get text knowledge for a specific workspace
   */
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
  // WORKSPACE MEMBERS ENDPOINTS
  // ============================================================================

  /**
   * Get all members of a workspace
   */
  async getWorkspaceMembers(workspaceId: string): Promise<{
    members: Array<{
      id: string;
      user_id: string;
      workspace_id: string;
      status: string;
      is_default: boolean;
      joined_at: string | null;
      last_activity_at: string | null;
      user: {
        id: string;
        email: string;
        display_name: string;
        is_verified: boolean;
      };
    }>;
    total_count: number;
  }> {
    this.validateUuid(workspaceId, "workspace_id");

    return this.makeRequest<{
      members: Array<{
        id: string;
        user_id: string;
        workspace_id: string;
        status: string;
        is_default: boolean;
        joined_at: string | null;
        last_activity_at: string | null;
        user: {
          id: string;
          email: string;
          display_name: string;
          is_verified: boolean;
        };
      }>;
      total_count: number;
    }>("GET", `/api/v1/workspace/${workspaceId}/members`);
  }

  /**
   * Add member to workspace by email
   */
  async addWorkspaceMember(
    workspaceId: string,
    email: string,
  ): Promise<{
    member: {
      id: string;
      user_id: string;
      email: string;
      display_name: string;
      status: string;
    };
  }> {
    this.validateUuid(workspaceId, "workspace_id");
    if (!email || !this.isValidEmail(email)) {
      throw new WorkspaceApiError("INVALID_REQUEST", "Valid email is required");
    }

    return this.makeRequest<{
      member: {
        id: string;
        user_id: string;
        email: string;
        display_name: string;
        status: string;
      };
    }>("POST", `/api/v1/workspace/${workspaceId}/members`, { email });
  }

  /**
   * Remove member from workspace
   */
  async removeWorkspaceMember(
    workspaceId: string,
    memberId: string,
  ): Promise<{ member_id: string }> {
    this.validateUuid(workspaceId, "workspace_id");
    this.validateUuid(memberId, "member_id");

    return this.makeRequest<{ member_id: string }>(
      "DELETE",
      `/api/v1/workspace/${workspaceId}/members/${memberId}`,
    );
  }

  /**
   * Change workspace member's role
   */
  async changeMemberRole(
    workspaceId: string,
    memberId: string,
    roleId: string,
  ): Promise<{
    member_id: string;
    user_id: string;
    workspace_id: string;
    role_id: string;
    role_name: string;
    updated_by: string;
    updated_at: string;
  }> {
    this.validateUuid(workspaceId, "workspace_id");
    this.validateUuid(memberId, "member_id");
    this.validateUuid(roleId, "role_id");

    return this.makeRequest<{
      member_id: string;
      user_id: string;
      workspace_id: string;
      role_id: string;
      role_name: string;
      updated_by: string;
      updated_at: string;
    }>("PUT", `/api/v1/workspace/${workspaceId}/members/${memberId}/role`, {
      role_id: roleId,
    });
  }

  // ============================================================================
  // WORKSPACE INVITATIONS ENDPOINTS
  // ============================================================================

  /**
   * Create workspace invitation
   */
  async createInvitation(data: {
    workspace_id: string;
    email: string;
    role_id: string;
    expires_in_days?: number;
  }): Promise<{
    invitation: {
      id: string;
      workspace_id: string;
      email: string;
      role_id: string;
      status: string;
      expires_at: string;
      created_at: string;
    };
  }> {
    this.validateUuid(data.workspace_id, "workspace_id");
    this.validateUuid(data.role_id, "role_id");
    if (!data.email || !this.isValidEmail(data.email)) {
      throw new WorkspaceApiError("INVALID_REQUEST", "Valid email is required");
    }

    return this.makeRequest<{
      invitation: {
        id: string;
        workspace_id: string;
        email: string;
        role_id: string;
        status: string;
        expires_at: string;
        created_at: string;
      };
    }>("POST", "/api/v1/workspace/invitations/", data);
  }

  /**
   * Accept workspace invitation
   */
  async acceptInvitation(token: string): Promise<{
    workspace_member: {
      id: string;
      workspace_id: string;
      user_id: string;
      role_id: string;
      status: string;
    };
  }> {
    if (!token || token.trim().length === 0) {
      throw new WorkspaceApiError(
        "INVALID_REQUEST",
        "Invitation token is required",
      );
    }

    return this.makeRequest<{
      workspace_member: {
        id: string;
        workspace_id: string;
        user_id: string;
        role_id: string;
        status: string;
      };
    }>("POST", "/api/v1/workspace/invitations/accept", { token });
  }

  /**
   * Revoke workspace invitation
   */
  async revokeInvitation(invitationId: string): Promise<{
    invitation_id: string;
    status: string;
  }> {
    this.validateUuid(invitationId, "invitation_id");

    return this.makeRequest<{
      invitation_id: string;
      status: string;
    }>("POST", `/api/v1/workspace/invitations/${invitationId}/revoke`);
  }

  /**
   * List sent invitations (invitations created by current user)
   */
  async listSentInvitations(workspaceId?: string): Promise<{
    invitations: Array<{
      id: string;
      workspace_id: string;
      email: string;
      role_id: string;
      status: string;
      expires_at: string;
      created_at: string;
      workspace_name?: string;
      role_name?: string;
    }>;
    total_count: number;
  }> {
    const endpoint = workspaceId
      ? `/api/v1/workspace/invitations/sent?workspace_id=${workspaceId}`
      : "/api/v1/workspace/invitations/sent";

    return this.makeRequest<{
      invitations: Array<{
        id: string;
        workspace_id: string;
        email: string;
        role_id: string;
        status: string;
        expires_at: string;
        created_at: string;
        workspace_name?: string;
        role_name?: string;
      }>;
      total_count: number;
    }>("GET", endpoint);
  }

  /**
   * List received invitations (invitations for current user's email)
   */
  async listReceivedInvitations(): Promise<{
    invitations: Array<{
      id: string;
      workspace_id: string;
      email: string;
      role_id: string;
      status: string;
      expires_at: string;
      created_at: string;
      workspace_name?: string;
      role_name?: string;
      invitation_token?: string;
    }>;
    total_count: number;
  }> {
    return this.makeRequest<{
      invitations: Array<{
        id: string;
        workspace_id: string;
        email: string;
        role_id: string;
        status: string;
        expires_at: string;
        created_at: string;
        workspace_name?: string;
        role_name?: string;
        invitation_token?: string;
      }>;
      total_count: number;
    }>("GET", "/api/v1/workspace/invitations/received");
  }

  /**
   * Create bulk invitations
   */
  async createBulkInvitations(data: {
    workspace_id: string;
    emails: string[];
    role_id: string;
    expires_in_days?: number;
  }): Promise<{
    total_requested: number;
    successful: number;
    failed: number;
    results: Array<{
      email: string;
      success: boolean;
      invitation_id?: string;
      error_message?: string;
    }>;
  }> {
    this.validateUuid(data.workspace_id, "workspace_id");
    this.validateUuid(data.role_id, "role_id");

    if (!data.emails || data.emails.length === 0) {
      throw new WorkspaceApiError(
        "INVALID_REQUEST",
        "At least one email is required",
      );
    }

    if (data.emails.length > 50) {
      throw new WorkspaceApiError(
        "INVALID_REQUEST",
        "Maximum 50 emails allowed per request",
      );
    }

    return this.makeRequest<{
      total_requested: number;
      successful: number;
      failed: number;
      results: Array<{
        email: string;
        success: boolean;
        invitation_id?: string;
        error_message?: string;
      }>;
    }>("POST", "/api/v1/workspace/invitations/bulk", data);
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

    // Request deduplication for GET requests
    if (method === "GET" && this.config.enableRequestDeduplication) {
      const deduplicationKey = `${method}:${endpoint}`;
      if (this.requestDeduplicationMap.has(deduplicationKey)) {
        this.log.debug("Returning deduplicated request", {
          requestId,
          endpoint,
        });
        return this.requestDeduplicationMap.get(deduplicationKey) as Promise<T>;
      }
    }

    const controller = new AbortController();
    this.activeRequests.set(requestId, controller);

    try {
      const promise = this.executeRequest<T>(
        method,
        endpoint,
        body,
        controller.signal,
        context,
      );

      // Store for deduplication
      if (method === "GET" && this.config.enableRequestDeduplication) {
        const deduplicationKey = `${method}:${endpoint}`;
        this.requestDeduplicationMap.set(deduplicationKey, promise);

        // Clean up after request completes
        promise.finally(() => {
          this.requestDeduplicationMap.delete(deduplicationKey);
        });
      }

      return await promise;
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

    this.log.info("Making workspace API request", {
      requestId: context.requestId,
      method,
      endpoint,
      url,
    });

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Request-ID": context.requestId,
        "X-Timestamp": context.timestamp,
      };

      // Combine signals properly - fix for AbortSignal conflict
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

      // Handle empty responses (204 No Content)
      let data: unknown;
      if (
        response.status === 204 ||
        response.headers.get("content-length") === "0"
      ) {
        data = {};
      } else {
        data = await response.json();
      }

      this.log.info("Workspace API request completed", {
        requestId: context.requestId,
        status: response.status,
        duration,
      });

      // Extract data from the backend's response wrapper
      const responseData = data as { success?: boolean; data?: T };
      if (responseData?.success && responseData.data) {
        return responseData.data;
      }

      return data as T;
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.handleRequestError(error, context, duration);
      throw error; // This will never be reached due to handleRequestError throwing
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
    const startTime = Date.now();

    this.log.info("Making workspace file API request", {
      requestId: context.requestId,
      method,
      endpoint,
      url,
    });

    try {
      const headers: Record<string, string> = {
        "X-Request-ID": context.requestId,
        "X-Timestamp": context.timestamp,
      };

      // Combine signals properly - fix for AbortSignal conflict
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

      const duration = Date.now() - startTime;

      if (!response.ok) {
        await this.handleErrorResponse(response, context, duration);
      }

      // Handle empty responses (204 No Content)
      let data: unknown;
      if (
        response.status === 204 ||
        response.headers.get("content-length") === "0"
      ) {
        data = {};
      } else {
        data = await response.json();
      }

      this.log.info("Workspace file API request completed", {
        requestId: context.requestId,
        status: response.status,
        duration,
      });

      // Extract data from the backend's response wrapper
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

    this.log.error("Workspace API request failed", {
      requestId: context.requestId,
      status: response.status,
      statusText: response.statusText,
      duration,
      errorData: sanitizeErrorForLogging(errorData),
    });

    throw WorkspaceApiError.fromResponse(errorData, response.status);
  }

  private async handleRequestError(
    error: unknown,
    context: WorkspaceApiContext,
    duration: number,
  ): Promise<never> {
    // Use the centralized error handler
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

    // This line will never be reached due to handleError throwing
    throw error;
  }

  private createRequestContext(requestId: string): WorkspaceApiContext {
    return {
      requestId,
      timestamp: new Date().toISOString(),
      userId: undefined, // TODO: Add user context when authentication is implemented
    };
  }

  // ============================================================================
  // VALIDATION METHODS
  // ============================================================================

  private validateUuid(id: string, fieldName: string): void {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      throw new WorkspaceApiError(
        "INVALID_REQUEST",
        `Invalid ${fieldName}: must be a valid UUID`,
      );
    }
  }

  private validateWorkspaceData(data: CreateWorkspaceRequest): void {
    if (!data.title || data.title.trim().length === 0) {
      throw new WorkspaceApiError("INVALID_REQUEST", "Title is required");
    }

    if (data.title.length > 200) {
      throw new WorkspaceApiError(
        "INVALID_REQUEST",
        "Title must be 200 characters or less",
      );
    }

    if (!data.url || !this.isValidUrl(data.url)) {
      throw new WorkspaceApiError("INVALID_URL", "Valid URL is required");
    }

    if (data.description && data.description.length > 1000) {
      throw new WorkspaceApiError(
        "INVALID_REQUEST",
        "Description must be 1000 characters or less",
      );
    }
  }

  private validateWorkspaceUpdateData(data: UpdateWorkspaceRequest): void {
    if (data.title !== undefined) {
      if (!data.title || data.title.trim().length === 0) {
        throw new WorkspaceApiError("INVALID_REQUEST", "Title cannot be empty");
      }
      if (data.title.length > 200) {
        throw new WorkspaceApiError(
          "INVALID_REQUEST",
          "Title must be 200 characters or less",
        );
      }
    }

    if (data.url !== undefined && !this.isValidUrl(data.url)) {
      throw new WorkspaceApiError("INVALID_URL", "Valid URL is required");
    }

    if (data.description !== undefined && data.description.length > 1000) {
      throw new WorkspaceApiError(
        "INVALID_REQUEST",
        "Description must be 1000 characters or less",
      );
    }
  }

  private validateWebKnowledgeData(data: AddWebKnowledgeRequest): void {
    this.validateUuid(data.workspace_id, "workspace_id");
    if (!data.url || !this.isValidUrl(data.url)) {
      throw new WorkspaceApiError("INVALID_URL", "Valid URL is required");
    }
  }

  private validateFileKnowledgeData(data: AddFileKnowledgeRequest): void {
    this.validateUuid(data.workspace_id, "workspace_id");
    if (!data.file || !(data.file instanceof File)) {
      throw new WorkspaceApiError("INVALID_REQUEST", "Valid file is required");
    }

    // Check file size (10MB limit)
    if (data.file.size > 10 * 1024 * 1024) {
      throw new WorkspaceApiError(
        "INVALID_REQUEST",
        "File size must be 10MB or less",
      );
    }
  }

  private validateTextKnowledgeData(data: AddTextKnowledgeRequest): void {
    this.validateUuid(data.workspace_id, "workspace_id");
    if (!data.title || data.title.trim().length === 0) {
      throw new WorkspaceApiError("INVALID_REQUEST", "Title is required");
    }
    if (!data.content || data.content.trim().length === 0) {
      throw new WorkspaceApiError("INVALID_REQUEST", "Content is required");
    }
  }

  private validateTextKnowledgeUpdateData(
    data: UpdateTextKnowledgeRequest,
  ): void {
    if (
      data.title !== undefined &&
      (!data.title || data.title.trim().length === 0)
    ) {
      throw new WorkspaceApiError("INVALID_REQUEST", "Title cannot be empty");
    }
    if (
      data.content !== undefined &&
      (!data.content || data.content.trim().length === 0)
    ) {
      throw new WorkspaceApiError("INVALID_REQUEST", "Content cannot be empty");
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

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // ============================================================================
  // SANITIZATION METHODS
  // ============================================================================

  private sanitizeWorkspaceData(
    data: CreateWorkspaceRequest,
  ): Record<string, unknown> {
    return {
      name: InputSanitizer.sanitizeText(data.title.trim()), // Map title to name for backend
      description: data.description
        ? InputSanitizer.sanitizeText(data.description.trim())
        : undefined,
      url: data.url.trim(),
    };
  }

  private sanitizeWorkspaceUpdateData(
    data: UpdateWorkspaceRequest,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    if (data.title !== undefined) {
      // Map 'title' to 'name' for backend compatibility
      result.name = InputSanitizer.sanitizeText(data.title.trim());
    }
    if (data.description !== undefined) {
      result.description = InputSanitizer.sanitizeText(data.description.trim());
    }
    if (data.url !== undefined) {
      result.url = data.url.trim();
    }

    return result;
  }

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

  private sanitizeTextKnowledgeUpdateData(
    data: UpdateTextKnowledgeRequest,
  ): UpdateTextKnowledgeRequest {
    const result: UpdateTextKnowledgeRequest = {};

    if (data.title !== undefined) {
      result.title = InputSanitizer.sanitizeText(data.title.trim());
    }
    if (data.content !== undefined) {
      result.content = InputSanitizer.sanitizeText(data.content.trim());
    }
    if (data.tags !== undefined) {
      result.tags = data.tags
        .map((tag) => InputSanitizer.sanitizeText(tag.trim()))
        .filter(Boolean);
    }

    return result;
  }

  // ============================================================================
  // CLEANUP METHODS
  // ============================================================================

  /**
   * Cancel all active requests
   */
  public cancelAllRequests(): void {
    this.log.info("Cancelling all active workspace API requests", {
      activeRequestsCount: this.activeRequests.size,
    });

    for (const [requestId, controller] of this.activeRequests) {
      controller.abort();
      this.log.debug("Cancelled request", { requestId });
    }

    this.activeRequests.clear();
    this.requestDeduplicationMap.clear();
  }

  /**
   * Get the count of active requests
   */
  public getActiveRequestsCount(): number {
    return this.activeRequests.size;
  }
}

// ============================================================================
// DEFAULT INSTANCE AND EXPORTS
// ============================================================================

// Create default instance
export const workspaceApiService = new WorkspaceApiService();

// Re-export types for convenience
export type {
  AddFileKnowledgeRequest,
  AddTextKnowledgeRequest,
  AddWebKnowledgeRequest,
  CreateWorkspaceRequest,
  FileKnowledge,
  RefreshBrandVoiceResponse,
  TextKnowledge,
  UpdateTextKnowledgeRequest,
  UpdateWorkspaceRequest,
  WebKnowledge,
  Workspace,
  WorkspaceError,
  WorkspaceListResponse,
  WorkspaceResponse,
} from "@/types/workspace";
