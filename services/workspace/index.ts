/**
 * Workspace Services - Barrel Export
 *
 * Consolidated export of all workspace-related services
 */

export * from "./workspace-service";
export * from "./knowledge-service";
export * from "./brand-voice-service";
export * from "./members-service";

// Re-export instances for convenience
export { workspaceService } from "./workspace-service";
export { knowledgeService } from "./knowledge-service";
export { brandVoiceService } from "./brand-voice-service";
export { membersService } from "./members-service";
