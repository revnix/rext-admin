/**
 * Route Helper Utilities for Workspace-Scoped URLs
 *
 * Centralized route generation following the /w/{workspace-id}/* pattern.
 * Provides type-safe URL generation and workspace ID extraction.
 */

/**
 * Workspace-scoped route generators
 */
export const workspaceRoutes = {
  /**
   * Root workspace route - redirects to topics
   */
  root: (workspaceId: string) => `/w/${workspaceId}`,

  /**
   * Topics routes
   */
  topics: (workspaceId: string) => `/w/${workspaceId}/topics`,
  topicDetail: (workspaceId: string, topicId: string) =>
    `/w/${workspaceId}/topics/${topicId}`,
  topicCreate: (_workspaceId: string) => `/topics/create`, // Fallback to global for now

  /**
   * Content routes
   */
  content: (workspaceId: string) => `/w/${workspaceId}/content`,
  contentDetail: (workspaceId: string, contentId: string) =>
    `/w/${workspaceId}/content/${contentId}`,
  contentCreate: (workspaceId: string) => `/w/${workspaceId}/content/create`,
  contentProgress: (workspaceId: string, contentId: string) =>
    `/w/${workspaceId}/content/progress/${contentId}`,

  /**
   * Users route
   */
  users: (workspaceId: string) => `/w/${workspaceId}/users`,

  /**
   * Analytics route
   */
  analytics: (workspaceId: string) => `/w/${workspaceId}/analytics`,

  /**
   * Settings routes
   */
  settings: (workspaceId: string) => `/w/${workspaceId}/settings`,
  settingsGeneral: (workspaceId: string) =>
    `/w/${workspaceId}/settings/general`,
  settingsSecurity: (workspaceId: string) =>
    `/w/${workspaceId}/settings/security`,
  settingsNotifications: (workspaceId: string) =>
    `/w/${workspaceId}/settings/notifications`,

  /**
   * Knowledge routes (tab-based within workspace detail)
   */
  knowledge: (workspaceId: string, view?: string) => {
    const base = `/w/${workspaceId}?tab=knowledge`;
    return view ? `${base}&view=${view}` : base;
  },
  knowledgeWeb: (workspaceId: string) =>
    `/w/${workspaceId}?tab=knowledge&view=web`,
  knowledgeFiles: (workspaceId: string) =>
    `/w/${workspaceId}?tab=knowledge&view=files`,
  knowledgeText: (workspaceId: string) =>
    `/w/${workspaceId}?tab=knowledge&view=text`,
} as const;

/**
 * Extract workspace ID from a pathname
 *
 * @param pathname - The URL pathname to parse
 * @returns The workspace ID if found, null otherwise
 *
 * @example
 * extractWorkspaceId('/w/ws-123/topics') // 'ws-123'
 * extractWorkspaceId('/w/550e8400-e29b-41d4-a716-446655440000/content') // '550e8400-e29b-41d4-a716-446655440000'
 * extractWorkspaceId('/workspaces') // null
 */
export function extractWorkspaceId(pathname: string): string | null {
  const match = pathname.match(/^\/w\/([^/]+)/);
  return match ? match[1] : null;
}

/**
 * Check if pathname is a workspace-scoped route
 *
 * @param pathname - The URL pathname to check
 * @returns True if the pathname starts with /w/
 *
 * @example
 * isWorkspacePath('/w/ws-123/topics') // true
 * isWorkspacePath('/workspaces') // false
 */
export function isWorkspacePath(pathname: string): boolean {
  return pathname.startsWith("/w/");
}

/**
 * Validate workspace ID format (UUID v4)
 *
 * @param workspaceId - The workspace ID to validate
 * @returns True if valid UUID format
 */
export function isValidWorkspaceId(workspaceId: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(workspaceId);
}

/**
 * Get workspace detail tab URL
 *
 * @param workspaceId - The workspace ID
 * @param tab - The tab name (overview, knowledge, members, settings)
 * @returns The workspace detail URL with tab parameter
 */
export function getWorkspaceTabUrl(
  workspaceId: string,
  tab: "overview" | "knowledge" | "members" | "settings",
): string {
  return `/w/${workspaceId}?tab=${tab}`;
}

/**
 * Legacy route helpers for backward compatibility during migration
 * @deprecated Use workspaceRoutes instead
 */
export const legacyRoutes = {
  workspaceDetail: (workspaceId: string) => `/workspaces/${workspaceId}`,
  topics: () => "/topics",
  content: () => "/content",
} as const;
