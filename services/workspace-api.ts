/**
 * Workspace API Service Client (Backward Compatible)
 *
 * This file maintains backward compatibility by re-exporting the new
 * domain-specific services under the original WorkspaceApiService class.
 *
 * NEW CODE SHOULD USE:
 * - services/workspace/workspace-service.ts for core operations
 * - services/workspace/knowledge-service.ts for knowledge management
 * - services/workspace/members-service.ts for member management
 * - services/workspace/brand-voice-service.ts for brand voice operations
 */

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
  WorkspaceListResponse,
  WorkspaceResponse,
} from "@/types/workspace";
import { KnowledgeService } from "./workspace/knowledge-service";
import { MembersService } from "./workspace/members-service";
import { WorkspaceService } from "./workspace/workspace-service";

// Re-export errors
export { WorkspaceServiceError as WorkspaceApiError } from "./workspace/workspace-service";

// ============================================================================
// BACKWARD COMPATIBLE API SERVICE
// ============================================================================

/**
 * @deprecated Use individual services from services/workspace/* instead
 * This class is maintained for backward compatibility only.
 */
export class WorkspaceApiService {
  private workspaceService: WorkspaceService;
  private knowledgeService: KnowledgeService;
  private membersService: MembersService;

  constructor(config: Partial<WorkspaceApiConfig> = {}) {
    this.workspaceService = new WorkspaceService(config);
    this.knowledgeService = new KnowledgeService(config);
    this.membersService = new MembersService(config);
  }

  // ============================================================================
  // CORE WORKSPACE OPERATIONS - Delegate to WorkspaceService
  // ============================================================================

  async healthCheck() {
    return this.workspaceService.healthCheck();
  }

  async listWorkspaces() {
    return this.workspaceService.listWorkspaces();
  }

  async getWorkspace(workspaceId: string) {
    return this.workspaceService.getWorkspace(workspaceId);
  }

  async getWorkspaceBySlug(workspaceSlug: string) {
    return this.workspaceService.getWorkspaceBySlug(workspaceSlug);
  }

  async createWorkspace(data: CreateWorkspaceRequest) {
    return this.workspaceService.createWorkspace(data);
  }

  async updateWorkspace(workspaceId: string, data: UpdateWorkspaceRequest) {
    return this.workspaceService.updateWorkspace(workspaceId, data);
  }

  async deleteWorkspace(workspaceId: string) {
    return this.workspaceService.deleteWorkspace(workspaceId);
  }

  async duplicateWorkspace(sourceWorkspaceId: string) {
    return this.workspaceService.duplicateWorkspace(sourceWorkspaceId);
  }

  async refreshBrandVoice(workspaceId: string) {
    return this.workspaceService.refreshBrandVoice(workspaceId);
  }

  // ============================================================================
  // KNOWLEDGE OPERATIONS - Delegate to KnowledgeService
  // ============================================================================

  async listWebKnowledge() {
    return this.knowledgeService.listWebKnowledge();
  }

  async getWebKnowledge(webId: string) {
    return this.knowledgeService.getWebKnowledge(webId);
  }

  async addWebKnowledge(data: AddWebKnowledgeRequest) {
    return this.knowledgeService.addWebKnowledge(data);
  }

  async updateWebKnowledge(workspaceId: string, webId: string, title: string) {
    return this.knowledgeService.updateWebKnowledge(workspaceId, webId, title);
  }

  async deleteWebKnowledge(workspaceId: string, webId: string) {
    return this.knowledgeService.deleteWebKnowledge(workspaceId, webId);
  }

  async listFileKnowledge() {
    return this.knowledgeService.listFileKnowledge();
  }

  async getFileKnowledge(fileId: string) {
    return this.knowledgeService.getFileKnowledge(fileId);
  }

  async addFileKnowledge(data: AddFileKnowledgeRequest) {
    return this.knowledgeService.addFileKnowledge(data);
  }

  async deleteFileKnowledge(workspaceId: string, fileId: string) {
    return this.knowledgeService.deleteFileKnowledge(workspaceId, fileId);
  }

  async listTextKnowledge() {
    return this.knowledgeService.listTextKnowledge();
  }

  async getTextKnowledge(workspaceId: string, textId: string) {
    return this.knowledgeService.getTextKnowledge(workspaceId, textId);
  }

  async addTextKnowledge(data: AddTextKnowledgeRequest) {
    return this.knowledgeService.addTextKnowledge(data);
  }

  async updateTextKnowledge(
    workspaceId: string,
    textId: string,
    data: UpdateTextKnowledgeRequest,
  ) {
    return this.knowledgeService.updateTextKnowledge(workspaceId, textId, data);
  }

  async deleteTextKnowledge(workspaceId: string, textId: string) {
    return this.knowledgeService.deleteTextKnowledge(workspaceId, textId);
  }

  async getWorkspaceKnowledge(workspaceId: string) {
    return this.knowledgeService.getWorkspaceKnowledge(workspaceId);
  }

  async getWorkspaceWebKnowledge(workspaceId: string) {
    return this.knowledgeService.getWorkspaceWebKnowledge(workspaceId);
  }

  async getWorkspaceFileKnowledge(workspaceId: string) {
    return this.knowledgeService.getWorkspaceFileKnowledge(workspaceId);
  }

  async getWorkspaceTextKnowledge(workspaceId: string) {
    return this.knowledgeService.getWorkspaceTextKnowledge(workspaceId);
  }

  // ============================================================================
  // MEMBERS OPERATIONS - Delegate to MembersService
  // ============================================================================

  async getWorkspaceMembers(workspaceId: string) {
    return this.membersService.getWorkspaceMembers(workspaceId);
  }

  async addWorkspaceMember(workspaceId: string, email: string) {
    return this.membersService.addWorkspaceMember(workspaceId, email);
  }

  async removeWorkspaceMember(workspaceId: string, memberId: string) {
    return this.membersService.removeWorkspaceMember(workspaceId, memberId);
  }

  async changeMemberRole(
    workspaceId: string,
    memberId: string,
    roleId: string,
  ) {
    return this.membersService.changeMemberRole(workspaceId, memberId, roleId);
  }

  async createInvitation(data: {
    workspace_id: string;
    email: string;
    role_id: string;
    expires_in_days?: number;
  }) {
    return this.membersService.createInvitation(data);
  }

  async acceptInvitation(token: string) {
    return this.membersService.acceptInvitation(token);
  }

  async revokeInvitation(invitationId: string) {
    return this.membersService.revokeInvitation(invitationId);
  }

  async listSentInvitations(workspaceId?: string) {
    return this.membersService.listSentInvitations(workspaceId);
  }

  async listReceivedInvitations() {
    return this.membersService.listReceivedInvitations();
  }

  async createBulkInvitations(data: {
    workspace_id: string;
    emails: string[];
    role_id: string;
    expires_in_days?: number;
  }) {
    return this.membersService.createBulkInvitations(data);
  }

  // ============================================================================
  // CLEANUP METHODS
  // ============================================================================

  public cancelAllRequests(): void {
    this.workspaceService.cancelAllRequests();
    this.knowledgeService.cancelAllRequests();
    this.membersService.cancelAllRequests();
  }

  public getActiveRequestsCount(): number {
    return this.workspaceService.getActiveRequestsCount();
  }
}

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
  WorkspaceListResponse,
  WorkspaceResponse,
};
