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
export { EditableBrandVoiceCard } from "./editable-brand-voice-card";
export { WorkspaceBrandVoiceForm } from "./workspace-brand-voice-form";

// Email Templates
export { EmailTemplateEditor } from "./email-template-editor";

// Knowledge Management
export { WorkspaceAddKnowledgeDialog } from "./workspace-add-knowledge-dialog";
export { WorkspaceCreateKnowledgeBaseDialog } from "./workspace-create-knowledge-base-dialog";
export { WorkspaceDeleteKnowledgeBaseDialog } from "./workspace-delete-knowledge-base-dialog";
export { WorkspaceDeleteKnowledgeDialog } from "./workspace-delete-knowledge-dialog";
export { WorkspaceEditKnowledgeBaseDialog } from "./workspace-edit-knowledge-base-dialog";
export { WorkspaceEditKnowledgeDialog } from "./workspace-edit-knowledge-dialog";
export { WorkspaceKnowledgeBasesTable } from "./workspace-knowledge-bases-table";
export { WorkspaceKnowledgeSummaryCard } from "./workspace-knowledge-summary-card";
export {
  WorkspaceKnowledgeTable,
  convertToKnowledgeItems,
} from "./workspace-knowledge-table";
export type { KnowledgeItem } from "./workspace-knowledge-table";

// Members & Invitations
export { WorkspaceChangeRoleDialog } from "./workspace-change-role-dialog";
export { WorkspaceInvitationsPanel } from "./workspace-invitations-panel";
export { WorkspaceInviteMembersDialog } from "./workspace-invite-members-dialog";
export { WorkspaceMembersPanel } from "./workspace-members-panel";
export { WorkspaceRemoveMemberDialog } from "./workspace-remove-member-dialog";

// Personas
export { PersonaCard, PersonasGrid } from "./persona-card";
export { PersonaSelection } from "./persona-selection";

// Workspace Core
export { WorkspaceCreateWizard } from "./workspace-create-wizard";
export { WorkspaceDeleteDialog } from "./workspace-delete-dialog";
export { WorkspaceEmptyState } from "./workspace-empty-state";
export { WorkspaceOverviewForm } from "./workspace-overview-form";
export { WorkspaceProgressTimeline } from "./workspace-progress-timeline";
export {
  WorkspaceWelcomeModal,
  markWelcomeModalShown,
  shouldShowWelcomeModal,
} from "./workspace-welcome-modal";
