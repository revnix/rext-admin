/**
 * Route Helper Utilities for Workspace-Scoped URLs
 *
 * Centralized route generation following the /w/{workspace-slug}/* pattern.
 * Provides type-safe URL generation and workspace slug extraction.
 */

/**
 * Workspace-scoped route generators
 * Now using workspace slug for human-readable URLs
 */
export const workspaceRoutes = {
  /**
   * Root workspace route - redirects to topics
   */
  root: (workspaceSlug: string) => `/w/${workspaceSlug}`,

  /**
   * Topics routes
   */
  topics: (workspaceSlug: string) => `/w/${workspaceSlug}/topics`,
  topicDetail: (workspaceSlug: string, topicId: string) =>
    `/w/${workspaceSlug}/topics/${topicId}`,
  topicCreate: (workspaceSlug: string) => `/w/${workspaceSlug}/topics/create`,

  /**
   * Content routes
   */
  content: (workspaceSlug: string) => `/w/${workspaceSlug}/content`,
  contentDetail: (workspaceSlug: string, contentId: string) =>
    `/w/${workspaceSlug}/content/${contentId}`,
  contentCreate: (workspaceSlug: string) =>
    `/w/${workspaceSlug}/content/create`,
  contentProgress: (workspaceSlug: string, contentId: string) =>
    `/w/${workspaceSlug}/content/progress/${contentId}`,

  /**
   * Users route
   */
  users: (workspaceSlug: string) => `/w/${workspaceSlug}/users`,

  /**
   * Analytics route
   */
  analytics: (workspaceSlug: string) => `/w/${workspaceSlug}/analytics`,

  /**
   * Settings routes
   */
  settings: (workspaceSlug: string) => `/w/${workspaceSlug}/settings`,
  settingsGeneral: (workspaceSlug: string) =>
    `/w/${workspaceSlug}/settings/general`,
  settingsSecurity: (workspaceSlug: string) =>
    `/w/${workspaceSlug}/settings/security`,
  settingsNotifications: (workspaceSlug: string) =>
    `/w/${workspaceSlug}/settings/notifications`,

  /**
   * Knowledge routes (tab-based within workspace detail)
   */
  knowledge: (workspaceSlug: string, view?: string) => {
    const base = `/w/${workspaceSlug}?tab=knowledge`;
    return view ? `${base}&view=${view}` : base;
  },
  knowledgeWeb: (workspaceSlug: string) =>
    `/w/${workspaceSlug}?tab=knowledge&view=web`,
  knowledgeFiles: (workspaceSlug: string) =>
    `/w/${workspaceSlug}?tab=knowledge&view=files`,
  knowledgeText: (workspaceSlug: string) =>
    `/w/${workspaceSlug}?tab=knowledge&view=text`,
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
