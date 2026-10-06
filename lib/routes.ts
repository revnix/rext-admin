import type { Route } from "next";

/**
 * Route Helper Utilities for Workspace-Scoped URLs
 *
 * Centralized route generation following the /w/{workspace-slug}/* pattern.
 * Provides type-safe URL generation and workspace slug extraction.
 */

/**
 * Valid workspace page segments: the pages the workspace switcher keeps open when it changes
 * workspace. A settings section is a page of its own, so switching from Members opens Members.
 */
export const WORKSPACE_PAGES = [
  "content",
  "integrations",
  "personas",
  "persona_create",
  "settings",
  "settings/brand-voice",
  "settings/members",
  "settings/danger-zone",
] as const;

export type WorkspacePageSegment = (typeof WORKSPACE_PAGES)[number];

/** Account settings: one SettingsPage, a route per section (Profile is the root). */
export const settingsRoutes = {
  root: "/settings",
  security: "/settings/security",
  notifications: "/settings/notifications",
  subscription: "/settings/subscription",
  data: "/settings/data",
} as const satisfies Record<string, Route>;

export type SettingsRoute =
  (typeof settingsRoutes)[keyof typeof settingsRoutes];

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
   * Content routes
   */
  content: (workspaceSlug: string) => `/w/${workspaceSlug}/content`,
  generate_content: (workspaceSlug: string) =>
    `/w/${workspaceSlug}/generate_content`,
  contentDetail: (workspaceSlug: string, contentId: string) =>
    `/w/${workspaceSlug}/content/${contentId}`,
  content_calendar: (workspaceSlug: string) =>
    `/w/${workspaceSlug}/content/calendar`,

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
   * Workspace settings: one SettingsPage, a route per section (General is the root).
   */
  settings: {
    root: (workspaceSlug: string) => `/w/${workspaceSlug}/settings`,
    brandVoice: (workspaceSlug: string) =>
      `/w/${workspaceSlug}/settings/brand-voice`,
    members: (workspaceSlug: string) => `/w/${workspaceSlug}/settings/members`,
    dangerZone: (workspaceSlug: string) =>
      `/w/${workspaceSlug}/settings/danger-zone`,
  },
} as const;

/**
 * Extract workspace ID from a pathname
 *
 * @param pathname - The URL pathname to parse
 * @returns The workspace ID if found, null otherwise
 *
 * @example
 * extractWorkspaceId('/w/ws-123/content') // 'ws-123'
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
 * isWorkspacePath('/w/ws-123/content') // true
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
 * extractWorkspacePageSegment('/w/ws-123/content') // 'content'
 * extractWorkspacePageSegment('/w/ws-123/content/123') // 'content'
 * extractWorkspacePageSegment('/w/ws-123/settings/members') // 'settings/members'
 * extractWorkspacePageSegment('/w/ws-123') // null
 * extractWorkspacePageSegment('/workspaces') // null
 */
export function extractWorkspacePageSegment(
  pathname: string,
): WorkspacePageSegment | null {
  const match = pathname.match(/^\/w\/[^/]+\/([^?#]+)/);
  if (!match) return null;
  const path = match[1].replace(/\/+$/, "");
  // The longest page the path is in, so a settings section wins over settings.
  let found: WorkspacePageSegment | null = null;
  for (const page of WORKSPACE_PAGES) {
    const inside = path === page || path.startsWith(`${page}/`);
    if (inside && (!found || page.length > found.length)) found = page;
  }
  return found;
}

/**
 * Build workspace path for a given page segment
 *
 * @param workspaceSlug - The workspace slug
 * @param pageSegment - The page segment (content, settings, etc.)
 * @returns The full workspace path
 *
 * @example
 * buildWorkspacePath('my-workspace', 'content') // '/w/my-workspace/content'
 */
export function buildWorkspacePath(
  workspaceSlug: string,
  pageSegment: WorkspacePageSegment,
): string {
  const routeMap: Record<WorkspacePageSegment, (slug: string) => string> = {
    content: workspaceRoutes.content,
    integrations: workspaceRoutes.integrations,
    personas: workspaceRoutes.personas,
    persona_create: workspaceRoutes.persona_create,
    settings: workspaceRoutes.settings.root,
    "settings/brand-voice": workspaceRoutes.settings.brandVoice,
    "settings/members": workspaceRoutes.settings.members,
    "settings/danger-zone": workspaceRoutes.settings.dangerZone,
  };

  const routeFn = routeMap[pageSegment];
  return routeFn
    ? routeFn(workspaceSlug)
    : workspaceRoutes.content(workspaceSlug);
}
