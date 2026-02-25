/**
 * Workspace Services - Barrel Export
 *
 * Consolidated export of all workspace-related services
 */

export * from "./knowledge-service";
export * from "./members-service";
export * from "./workspace-service";
// Re-export instances for convenience
export {
  BaseWorkspaceService,
  WorkspaceApiError,
} from "./base-workspace-service";
export { WorkspaceService, workspaceService } from "./workspace-service";
export { KnowledgeService, knowledgeService } from "./knowledge-service";
export { MembersService, membersService } from "./members-service";
export { VALIDATION_MESSAGES } from "./validation-messages";
