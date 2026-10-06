/**
 * Workspace Statistics Types
 *
 * Real-time statistics for workspace onboarding tracking
 */

export interface WorkspaceStats {
  workspace_exists: boolean;
  content_count: number;
  members_count: number;
  has_content_builder: boolean;
}
