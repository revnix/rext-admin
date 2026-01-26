/**
 * Route Helper Utilities for Workspace-Scoped URLs
 *
 * Centralized route generation following the /w/{workspace-slug}/* pattern.
 * Provides type-safe URL generation and workspace slug extraction.
 */

/**
 * Valid workspace page segments
 */
export const WORKSPACE_PAGES = [
  "topics",
  "content",
  "members",
  "knowledge",
  "media",
  "integrations",
  "personas",
  "persona_create",
] as const;

export type WorkspacePageSegment = (typeof WORKSPACE_PAGES)[number];

/**
 * Workspace-scoped route generators
 * Now using workspace slug for human-readable URLs
 */
export const workspaceRoutes = {
  /**
   * Root workspace route - now points to dashboard (workspace-scoped at /)
   * The dashboard is workspace-aware and shows workspace-specific content
   */
  root: (_workspaceSlug: string) => `/`,

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
  generate_content: (workspaceSlug: string) =>
    `/w/${workspaceSlug}/generate_content`,
  contentDetail: (workspaceSlug: string, contentId: string) =>
    `/w/${workspaceSlug}/content/${contentId}`,
  contentCreate: (workspaceSlug: string) =>
    `/w/${workspaceSlug}/content/create`,
  contentProgress: (workspaceSlug: string, contentId: string) =>
    `/w/${workspaceSlug}/content/progress/${contentId}`,

  /**
   * Members route
   */
  members: (workspaceSlug: string) => `/w/${workspaceSlug}/members`,

  /**
   * Knowledge routes
   */
  knowledge: (workspaceSlug: string) => `/w/${workspaceSlug}/knowledge`,
  knowledgeDetail: (workspaceSlug: string, kbId: string) =>
    `/w/${workspaceSlug}/knowledge/${kbId}`,

  /**
   * Media route
   */
  media: (workspaceSlug: string) => `/w/${workspaceSlug}/media`,

  /**
   * Integrations route
   */
  integrations: (workspaceSlug: string) => `/w/${workspaceSlug}/integrations`,

  /**
   * Personas route
   */
  personas: (workspaceSlug: string) => `/w/${workspaceSlug}/personas`,
  persona_create: (workspaceSlug: string) =>
    `/w/${workspaceSlug}/personas/create`,

  /**
   * Settings routes
   */
  settings: {
    root: (workspaceSlug: string) => `/w/${workspaceSlug}/settings`,
    billing: (workspaceSlug: string) => `/w/${workspaceSlug}/settings/billing`,
    integrations: (workspaceSlug: string) =>
      `/w/${workspaceSlug}/settings/integrations`,
  },
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
 * Extract workspace page segment from pathname
 *
 * @param pathname - The URL pathname to parse
 * @returns The page segment if found and valid, null otherwise
 *
 * @example
 * extractWorkspacePageSegment('/w/ws-123/topics') // 'topics'
 * extractWorkspacePageSegment('/w/ws-123/content/123') // 'content'
 * extractWorkspacePageSegment('/w/ws-123') // null
 * extractWorkspacePageSegment('/workspaces') // null
 */
export function extractWorkspacePageSegment(
  pathname: string,
): WorkspacePageSegment | null {
  const match = pathname.match(/^\/w\/[^/]+\/([^/?]+)/);
  const segment = match ? match[1] : null;
  return segment && WORKSPACE_PAGES.includes(segment as WorkspacePageSegment)
    ? (segment as WorkspacePageSegment)
    : null;
}

/**
 * Build workspace path for a given page segment
 *
 * @param workspaceSlug - The workspace slug
 * @param pageSegment - The page segment (topics, content, etc.)
 * @returns The full workspace path
 *
 * @example
 * buildWorkspacePath('my-workspace', 'topics') // '/w/my-workspace/topics'
 * buildWorkspacePath('my-workspace', 'content') // '/w/my-workspace/content'
 */
export function buildWorkspacePath(
  workspaceSlug: string,
  pageSegment: WorkspacePageSegment,
): string {
  const routeMap: Record<WorkspacePageSegment, (slug: string) => string> = {
    topics: workspaceRoutes.topics,
    content: workspaceRoutes.content,
    members: workspaceRoutes.members,
    knowledge: workspaceRoutes.knowledge,
    media: workspaceRoutes.media,
    integrations: workspaceRoutes.integrations,
    personas: workspaceRoutes.personas,
    persona_create: workspaceRoutes.persona_create,
  };

  const routeFn = routeMap[pageSegment];
  return routeFn
    ? routeFn(workspaceSlug)
    : workspaceRoutes.topics(workspaceSlug);
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
 * @param tab - The tab name (overview, knowledge, members)
 * @returns The workspace detail URL with tab parameter
 */
export function getWorkspaceTabUrl(
  workspaceId: string,
  tab: "overview" | "knowledge" | "members",
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
