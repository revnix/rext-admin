/**
 * Workspace Components
 *
 * Barrel export file for workspace-related components.
 * Uses explicit named exports (no wildcard) for tree-shaking compatibility.
 *
 * IMPORTANT: Components within this directory should import from each other
 * using direct relative paths (e.g., import { PersonaCard } from "./persona-card"),
 * NOT through this barrel file, to avoid circular dependencies.
 */

// Brand Voice
export { BrandVoiceRefreshControl } from "./brand-voice-refresh-control";

// Members & Invitations
export { WorkspaceChangeRoleDialog } from "./workspace-change-role-dialog";
export { WorkspaceInvitationsPanel } from "./workspace-invitations-panel";
export { WorkspaceInviteMembersDialog } from "./workspace-invite-members-dialog";
export { WorkspaceMembersPanel } from "./workspace-members-panel";
export { WorkspaceRemoveMemberDialog } from "./workspace-remove-member-dialog";

// Personas
export { PersonaCard, PersonasGrid } from "./persona-card";

// Workspace Core
export { WorkspaceCreateWizard } from "./workspace-create-wizard";
export { WorkspaceDeleteDialog } from "./workspace-delete-dialog";
export {
  WorkspaceWelcomeModal,
  markWelcomeModalShown,
  shouldShowWelcomeModal,
} from "./workspace-welcome-modal";
