/**
 * Workspace Services - Barrel Export
 *
 * Consolidated export of all workspace-related services
 */

export * from "./brand-voice-service";
export { brandVoiceService } from "./brand-voice-service";
export * from "./knowledge-service";
export { knowledgeService } from "./knowledge-service";
export * from "./members-service";
export { membersService } from "./members-service";
export * from "./workspace-service";
// Re-export instances for convenience
export { workspaceService } from "./workspace-service";
