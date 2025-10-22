/**
 * Workspace Statistics Types
 *
 * Real-time statistics for workspace onboarding tracking
 */

export interface WorkspaceStats {
  workspace_exists: boolean;
  topics_count: number;
  content_count: number;
  knowledge_items_count: number;
  members_count: number;
  has_topic_builder: boolean;
  has_content_builder: boolean;
}
