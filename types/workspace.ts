/**
 * Workspace Management Type Interfaces
 *
 * This module defines all TypeScript interfaces for workspace management,
 * including data models, API requests/responses, and related types for
 * knowledge management, brand voice, and workspace operations.
 *
 * @see /types/api.ts for general API patterns
 * @see workspace-frontend-tasks.md for backend API reference
 */

// ============================================================================
// WORKSPACE CORE TYPES
// ============================================================================

/**
 * Main workspace model matching backend WorkspaceModel
 */
export interface Workspace {
  id: string; // UUID
  title?: string; // optional for backward compatibility - deprecated, use 'name' instead
  name: string; // unique, required — workspace display name
  slug: string; // URL-safe identifier for workspace
  timezone?: string; // optional IANA timezone
  url: string; // required
  created_at: string; // DateTime ISO string
  updated_at?: string; // DateTime ISO string
  brand_voice?: BrandVoice;
  websites?: WebKnowledge[];
  knowledge_files?: FileKnowledge[];
  text_knowledge?: TextKnowledge[];
  // New fields from backend API response
  knowledge_stats?: {
    web_knowledge: number;
    files: number;
    text_knowledge: number;
    total: number;
  };
  analytics?: {
    knowledge_counts: {
      web_knowledge: number;
      files: number;
      text_knowledge: number;
      total_knowledge_items: number;
    };
    content_metrics: {
      total_words: number;
      web_content_words: number;
      file_content_words: number;
      avg_web_article_words: number;
      avg_file_words: number;
      estimated_reading_time_minutes: number;
    };
    team_metrics: {
      total_members: number;
    };
  };
  // Flat analytics fields (backend returns these at root level)
  knowledge_counts?: {
    web_knowledge: number;
    files: number;
    text_knowledge: number;
    total_knowledge_items: number;
  };
  content_metrics?: {
    total_words?: number;
    web_content_words?: number;
    file_content_words?: number;
    avg_web_article_words?: number;
    avg_file_words?: number;
    estimated_reading_time_minutes?: number;
  };
  team_metrics?: {
    total_members: number;
  };
  members_count?: number;
  content_count?: number;
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
  linkedin_url?: string | null;
  demographics?: string;
  pain_points?: string | string[];
  goals?: string | string[];
  behaviors?: string | string[];
}

/**
 * Brand voice data extracted by LLM
 */
export interface BrandVoice {
  id?: string;
  workspace_id: string;
  brand_name?: string; // The actual brand/product name — distinct from the workspace name
  about?: string; // Brand description
  customer_profile?: string; // Target customer details
  selling_position?: string; // Unique selling proposition
  target_audience?: string[]; // Array of audience segments
  brand_voice?: string[]; // Communication tone/style characteristics
  competitors?: string[]; // Array of competitor names
  content_strategy?: string[]; // Content pillars/themes
  content_pillar?: string[]; // Alternative name for content strategy

 
 site_compliance?: {        // for site_compliance data
  security_headers?: {
    checked: boolean;
    headers_present: Record<string, string>;
  };
  cookie_consent?: {
    has_consent_banner: boolean;
    provider: string | null;
    detection_method?: string;
  };
};


  personas?: Persona[]; // Target audience personas
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// KNOWLEDGE MANAGEMENT TYPES
// ============================================================================

/**
 * Web knowledge model for scraped URLs
 */
export interface WebKnowledge {
  id: string;
  workspace_id: string;
  knowledge_base_id: string; // FK to knowledge_base
  url: string;
  title?: string;
  status: WebKnowledgeStatus;
  char_count?: number;
  word_count?: number;
  content?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

/**
 * File knowledge model for uploaded files
 */
export interface FileKnowledge {
  id: string;
  workspace_id: string;
  knowledge_base_id: string; // FK to knowledge_base
  name: string;
  type: string; // MIME type
  size: number; // bytes
  path: string; // file path/URL
  content?: string; // extracted text
  char_count?: number;
  word_count?: number;
  status: FileKnowledgeStatus;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

/**
 * Text knowledge model for direct text entries
 */
export interface TextKnowledge {
  id: string;
  workspace_id: string;
  knowledge_base_id: string; // FK to knowledge_base
  title: string;
  content: string;
  char_count?: number;
  word_count?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

// ============================================================================
// STATUS TYPES
// ============================================================================

export type WebKnowledgeStatus =
  | "pending"
  | "scraping"
  | "completed"
  | "failed"
  | "processing";

export type FileKnowledgeStatus =
  | "pending"
  | "uploading"
  | "processing"
  | "completed"
  | "failed";

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
  url: string;
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
// KNOWLEDGE MANAGEMENT API TYPES
// ============================================================================

/**
 * Request payload for adding web knowledge
 */
export interface AddWebKnowledgeRequest {
  workspace_id: string;
  url: string;
  title?: string;
}

/**
 * Request payload for adding file knowledge
 */
export interface AddFileKnowledgeRequest {
  workspace_id: string;
  file: File;
}

/**
 * Request payload for adding text knowledge
 */
export interface AddTextKnowledgeRequest {
  workspace_id: string;
  title: string;
  content: string;
  tags?: string[];
}

/**
 * Request payload for updating text knowledge
 */
export interface UpdateTextKnowledgeRequest {
  title?: string;
  content?: string;
  tags?: string[];
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

/**
 * Knowledge type for unified knowledge management
 */
export type KnowledgeType = "web" | "file" | "text";

/**
 * Unified knowledge item for displays
 */
export interface KnowledgeItem {
  id: string;
  type: KnowledgeType;
  title: string;
  content?: string;
  url?: string;
  status: string;
  char_count?: number;
  word_count?: number;
  created_at: string;
  updated_at?: string;
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
  | "KNOWLEDGE_NOT_FOUND"
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

/**
 * Knowledge management state for UI
 */
export interface KnowledgeManagementState {
  selectedType: KnowledgeType;
  selectedItems: string[];
  isUploadModalOpen: boolean;
  uploadProgress: Record<string, number>;
}

// ============================================================================
// VALIDATION SCHEMAS (for use with Zod)
// ============================================================================
/**
 * File upload constraints
 */
export const FILE_CONSTRAINTS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    "text/plain",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/markdown",
  ],
} as const;

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
// KNOWLEDGE STORE UTILITY TYPES
// ============================================================================

/**
 * File upload progress tracking for file knowledge uploads
 */
export interface FileUploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: "uploading" | "processing" | "completed" | "failed";
  error?: string;
}

/**
 * Global search result for cross-type knowledge search
 */
export interface GlobalSearchResult {
  id: string;
  type: KnowledgeType;
  title: string;
  content: string;
  url?: string;
  tags?: string[];
  created_at: string;
  updated_at?: string;
  status?: string;
  relevanceScore: number;
  matchedFields: string[];
  contentPreview: string;
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
 * Workspace Knowledge Management Store State
 * Manages knowledge selection, upload modal, and progress tracking
 */
export interface WorkspaceKnowledgeState {
  knowledge: KnowledgeManagementState;

  // Actions
  setSelectedKnowledgeType: (type: KnowledgeType) => void;
  toggleKnowledgeSelection: (itemId: string) => void;
  selectAllKnowledge: (itemIds: string[]) => void;
  deselectAllKnowledge: () => void;
  openUploadModal: () => void;
  closeUploadModal: () => void;
  setUploadProgress: (fileId: string, progress: number) => void;
  removeUploadProgress: (fileId: string) => void;
}

/**
 * Brand Voice Refresh Store State
 * Manages brand voice refresh operations
 */
export interface BrandVoiceRefreshStoreState {
  brandVoiceRefresh: BrandVoiceRefreshState;

  // Actions
  refreshBrandVoice: (workspaceId: string) => Promise<string>;
  setBrandVoiceRefreshState: (state: Partial<BrandVoiceRefreshState>) => void;
}

/**
 * Combined Workspace Store State
 * Combines all workspace store states into a single interface
 */
export interface WorkspaceState
  extends WorkspaceContextState,
    WorkspaceCrudState,
    WorkspaceFormStoreState,
    WorkspaceKnowledgeState,
    BrandVoiceRefreshStoreState {
  // Utility actions
  resetStore: () => void;
}
