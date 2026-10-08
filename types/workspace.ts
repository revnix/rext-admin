/**
 * Workspace Management Type Interfaces
 *
 * This module defines all TypeScript interfaces for workspace management,
 * including data models, API requests/responses, and related types for
 * brand voice and workspace operations.
 *
 * @see /types/api.ts for general API patterns
 * @see workspace-frontend-tasks.md for backend API reference
 */

import type { BaseTableRow } from "./shared";

// ============================================================================
// WORKSPACE CORE TYPES
// ============================================================================

/**
 * Main workspace model matching backend WorkspaceModel
 */
export interface Workspace {
  id: string; // UUID
  user_id?: string; // Workspace owner user ID
  owner_id?: string; // Optional owner identifier
  title?: string; // optional for backward compatibility - deprecated, use 'name' instead
  name: string; // unique, required — workspace display name
  slug: string; // URL-safe identifier for workspace
  timezone?: string; // optional IANA timezone
  // Null for a workspace made from a description, until a website is added (rext-control#853).
  url: string | null;
  // The site's favicon as an absolute URL, kept by the backend (G9); null until fetched.
  favicon_url?: string | null;
  // Not returned by the backend yet (pending workspace-validation PR); the
  // general-info form reads it optimistically, so keep it optional.
  description?: string;
  created_at: string; // DateTime ISO string
  updated_at?: string; // DateTime ISO string
  brand_voice?: BrandVoice;
  analytics?: {
    team_metrics?: {
      total_members: number;
    };
  };
  // Flat analytics fields (backend returns these at root level)
  team_metrics?: {
    total_members: number;
  };
  members_count?: number;
  content_count?: number;
  /**
   * The workspace's latest analysis run, on its detail: "not_started" for a workspace made with
   * "Skip for now" (rext-control task 905), then running, completed, failed or interrupted.
   * Absent on a list.
   */
  pipeline?: {
    status: string;
    operation_id?: string | null;
    started_at?: string | null;
  } | null;
}

/**
 * Persona data for target audience
 */
export interface Persona {
  id?: string; // UUID, optional for creation
  name: string;
  description: string;
  full_name?: string | null;
  professional_title?: string | null;
  areas_of_expertise?: string | string[];
  tone_of_voice?: string;
  bio?: string;
  avatar_url?: string | null;
  /**
   * Where the picture came from. "custom" when someone chose it, "page" when
   * the site published it, "gravatar" when it was derived from an address, and
   * "generated" when nothing was found and initials were drawn. A photograph of
   * someone and a coloured circle bearing their letters are not the same claim,
   * and the URL alone does not say which is on screen.
   */
  avatar_source?: "custom" | "page" | "gravatar" | "generated" | null;
  /** Used to derive a Gravatar when no photograph was found. */
  email?: string | null;
  linkedin_url?: string | null;
  demographics?: string;
  pain_points?: string | string[];
  goals?: string | string[];
  behaviors?: string | string[];
  created_at?: string;
  updated_at?: string;
  /** The workspace's articles written as this persona, outside the trash; the list sets it. */
  article_count?: number;
}

/**
 * Brand voice data extracted by LLM
 */
/** A workspace as the workspaces list and its delete dialog read it. */
export interface WorkspaceData extends BaseTableRow {
  title: string; // Display name for workspace
  name?: string; // API field name (mapped to title)
  slug: string; // URL-safe identifier for workspace
  description?: string;
  url: string;
  created_at: string;
  updated_at?: string;
  owner?: {
    name: string;
    email: string;
  };
  brand_voice?: BrandVoice;
  status: string;
  /** The pipeline's latest run, on the workspace's detail: running, completed, failed or interrupted. */
  pipeline?: {
    status: string;
    operation_id?: string | null;
    started_at?: string | null;
  } | null;
}

export interface BrandVoice {
  id?: string;
  workspace_id: string;
  brand_name?: string; // The actual brand/product name — distinct from the workspace name
  about?: string; // Brand description
  customer_profile?: string | null; // Target customer details
  selling_position?: string; // Unique selling proposition
  target_audience?: string[]; // Array of audience segments
  brand_voice?: string[]; // Communication tone/style characteristics
  competitors?: string[]; // Array of competitor names
  content_strategy?: string[]; // Content pillars/themes
  content_pillar?: string[]; // Alternative name for content strategy
  personas?: Persona[]; // Target audience personas
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// STATUS TYPES
// ============================================================================

export type WorkspaceStatus = "active" | "inactive" | "archived" | "deleted";

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Request payload for creating a new workspace
 */
export interface CreateWorkspaceRequest {
  name: string;
  timezone?: string;
  /** The website to read, or none: then `description` says what the business does. */
  url?: string;
  description?: string;
  /** The business's name as the person typed it, sent with a description (rext-control task 922). */
  brand_name?: string;
}

/**
 * Request payload for updating workspace details
 */
export interface UpdateWorkspaceRequest {
  name?: string;
  timezone?: string;
  url?: string;
}

/**
 * Response for workspace list endpoint
 */
export interface WorkspaceListResponse {
  workspaces: Workspace[];
  total: number;
  page?: number;
  limit?: number;
}

/**
 * Response for single workspace endpoint
 */
export interface WorkspaceResponse {
  workspace: Workspace;
}

/**
 * Response for creating a workspace with background processing metadata.
 *
 * Matches backend `created()` payload which includes both workspace data and
 * an `operation_id` used to subscribe to SSE progress updates. `message` is
 * optional because the backend helper injects it when available.
 */
export interface CreateWorkspaceResponse {
  workspace: Workspace;
  operation_id: string;
  message?: string;
}

// ============================================================================
// UI STATE AND FORM TYPES
// ============================================================================

/**
 * Form data for workspace creation
 */
export interface WorkspaceFormData {
  name: string;
  timezone?: string;
  url: string;
}

/**
 * Workspace filtering options (now handled by DataTable)
 */
export interface WorkspaceFilters {
  search?: string;
  status?: WorkspaceStatus;
  sortBy?: "name" | "created_at" | "updated_at";
  sortOrder?: "asc" | "desc";
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Workspace-specific error types
 */
export type WorkspaceErrorCode =
  | "WORKSPACE_NOT_FOUND"
  | "WORKSPACE_TITLE_EXISTS"
  | "INVALID_URL"
  | "SCRAPING_FAILED"
  | "UPLOAD_FAILED"
  | "PERMISSION_DENIED"
  | "INVALID_REQUEST"
  | "REQUEST_TIMEOUT"
  | "NETWORK_ERROR";

/**
 * Workspace error structure
 */
export interface WorkspaceError {
  code: WorkspaceErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// API SERVICE CONFIGURATION
// ============================================================================

/**
 * Configuration for workspace API service
 */
export interface WorkspaceApiConfig {
  baseUrl: string;
  apiKey?: string;
  timeout: number;
  enableRequestDeduplication: boolean;
}

/**
 * Request context for workspace API calls
 */
export interface WorkspaceApiContext {
  requestId: string;
  timestamp: string;
  userId?: string;
}

// ============================================================================
// STORE STATE TYPES
// ============================================================================

/**
 * Loading states for different workspace operations
 */
export interface WorkspaceLoadingStates {
  switching: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  duplicating: boolean;
}

/**
 * Workspace form state for UI
 */
export interface WorkspaceFormState {
  isOpen: boolean;
  mode: "create" | "edit";
  data: WorkspaceFormData;
  isSubmitting: boolean;
  errors: Record<string, string>;
}

// ============================================================================
// BRAND VOICE REFRESH TYPES
// ============================================================================

/**
 * Request payload for refreshing brand voice analysis
 */
export interface RefreshBrandVoiceRequest {
  workspace_id: string;
}

/**
 * Response from brand voice refresh operation
 */
export interface RefreshBrandVoiceResponse {
  operation_id: string;
}

/**
 * UI state for brand voice refresh operations
 */
export interface BrandVoiceRefreshState {
  isRefreshing: boolean;
  operationId?: string;
  refreshError?: string;
}

// ============================================================================
// WORKSPACE STORE STATE INTERFACES
// ============================================================================

/**
 * Workspace Context Store State
 * Manages current workspace context, list, and workspace switching
 */
export interface WorkspaceContextState {
  // Current workspace context
  currentWorkspace: Workspace | null;
  workspaceList: Workspace[];

  // Recently used workspaces for quick access
  recentWorkspaces: string[]; // workspace IDs

  // Last workspace page path for preserving navigation on workspace switch
  lastWorkspacePath: string | null; // e.g., 'topics', 'content', 'analytics'

  // SSR hydration state
  _hasHydrated: boolean;

  // Actions
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setWorkspaceList: (workspaces: Workspace[]) => void;
  updateWorkspaceInList: (updatedWorkspace: Workspace) => void;
  removeWorkspaceFromList: (workspaceId: string) => void;
  addWorkspaceToList: (workspace: Workspace) => void;
  addToRecentWorkspaces: (workspaceId: string) => void;
  removeFromRecentWorkspaces: (workspaceId: string) => void;
  clearRecentWorkspaces: () => void;
  setLastWorkspacePath: (path: string | null) => void;
  optimisticallyUpdateWorkspace: (
    workspaceId: string,
    updates: Partial<Workspace>,
  ) => void;
  revertOptimisticUpdate: (workspace: Workspace) => void;
  setHasHydrated: (hydrated: boolean) => void;
}

/**
 * Workspace CRUD Store State
 * Manages workspace create, read, update, delete operations
 */
export interface WorkspaceCrudState {
  // Loading states
  loadingStates: WorkspaceLoadingStates;

  // Operation tracking for SSE (transient, not persisted)
  currentOperation: {
    operationId: string;
    workspaceId: string;
  } | null;

  // Actions
  createWorkspace: (data: CreateWorkspaceRequest) => Promise<Workspace>;
  updateWorkspace: (
    workspaceId: string,
    data: UpdateWorkspaceRequest,
  ) => Promise<Workspace>;
  deleteWorkspace: (workspaceId: string) => Promise<string>;
  duplicateWorkspace: (sourceWorkspaceId: string) => Promise<Workspace>;
  fetchWorkspaces: () => Promise<Workspace[]>;
  fetchWorkspace: (workspaceId: string) => Promise<Workspace>;
  setLoading: (
    operation: keyof WorkspaceLoadingStates,
    loading: boolean,
  ) => void;
  setCurrentOperation: (
    operation: {
      operationId: string;
      workspaceId: string;
    } | null,
  ) => void;
  clearCurrentOperation: () => void;
}

/**
 * Workspace Form Store State
 * Manages workspace form UI state for creation and editing
 */
export interface WorkspaceFormStoreState {
  workspaceForm: WorkspaceFormState;

  // Actions
  openWorkspaceForm: (mode: "create" | "edit", workspace?: Workspace) => void;
  closeWorkspaceForm: () => void;
  updateWorkspaceFormData: (data: Partial<WorkspaceFormData>) => void;
  setWorkspaceFormSubmitting: (isSubmitting: boolean) => void;
  setWorkspaceFormErrors: (errors: Record<string, string>) => void;
  resetWorkspaceForm: () => void;
}

/**
 * Brand Voice Refresh Store State
 * Manages brand voice refresh operations
 */
export interface BrandVoiceRefreshStoreState {
  /** Each workspace's refresh by its id, so one workspace's run or failure never shows in another. */
  brandVoiceRefresh: Record<string, BrandVoiceRefreshState>;

  // Actions
  refreshBrandVoice: (workspaceId: string) => Promise<string>;
  setBrandVoiceRefreshState: (
    workspaceId: string,
    state: Partial<BrandVoiceRefreshState>,
  ) => void;
}

/**
 * Combined Workspace Store State
 * Combines all workspace store states into a single interface
 */
export interface WorkspaceState
  extends WorkspaceContextState,
    WorkspaceCrudState,
    WorkspaceFormStoreState,
    BrandVoiceRefreshStoreState {
  // Utility actions
  resetStore: () => void;
}
