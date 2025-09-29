/**
 * Workspace Layout Type Interfaces
 *
 * This module defines TypeScript interfaces for the WorkspaceLayout component,
 * including action configurations, layout variants, and workspace-specific props.
 *
 * @see /components/workspace/workspace-layout.tsx for implementation
 * @see /types/workspace.ts for base workspace types
 */

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { Workspace } from "@/types/workspace";

// ============================================================================
// WORKSPACE ACTION TYPES
// ============================================================================

/**
 * Configuration for workspace action buttons
 */
export interface WorkspaceAction {
  /** Unique identifier for the action */
  id: string;
  /** Display label for the action */
  label: string;
  /** Icon component to display */
  icon: LucideIcon;
  /** Click handler function */
  onClick: () => void | Promise<void>;
  /** Button variant styling */
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  /** Whether the action is disabled */
  disabled?: boolean;
  /** Whether the action is currently loading */
  loading?: boolean;
  /** Tooltip text for the action */
  tooltip?: string;
  /** Whether to show in header actions vs dropdown */
  placement?: "header" | "dropdown";
  /** Confirmation dialog config for destructive actions */
  confirmation?: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
  };
}

/**
 * Predefined workspace action types
 */
export type WorkspaceActionType =
  | "edit"
  | "duplicate"
  | "delete"
  | "settings"
  | "refresh"
  | "export"
  | "share";

/**
 * Default action configuration
 */
export interface DefaultWorkspaceActions {
  /** Enable edit action */
  edit?: boolean;
  /** Enable duplicate action */
  duplicate?: boolean;
  /** Enable delete action */
  delete?: boolean;
  /** Enable settings action */
  settings?: boolean;
  /** Enable refresh action */
  refresh?: boolean;
}

// ============================================================================
// WORKSPACE LAYOUT TYPES
// ============================================================================

/**
 * Workspace layout variants
 */
export type WorkspaceLayoutVariant =
  | "list" // For workspace listing pages
  | "detail" // For individual workspace pages
  | "minimal"; // Minimal layout for focused views

/**
 * Workspace context information
 */
export interface WorkspaceContext {
  /** Current workspace (for detail views) */
  workspace?: Workspace;
  /** Total workspace count (for list views) */
  totalCount?: number;
  /** Whether we're in a workspace-specific context */
  isWorkspaceContext: boolean;
}

/**
 * Breadcrumb item for workspace navigation
 */
export interface WorkspaceBreadcrumb {
  label: string;
  href?: string;
  isActive?: boolean;
}

// ============================================================================
// WORKSPACE LAYOUT PROPS
// ============================================================================

/**
 * Base props for WorkspaceLayout component
 */
export interface WorkspaceLayoutProps {
  /** Page title */
  title: string;
  /** Page description */
  description?: string;
  /** Layout variant */
  variant?: WorkspaceLayoutVariant;
  /** Current workspace context */
  workspace?: Workspace;
  /** Custom breadcrumbs (auto-generated if not provided) */
  breadcrumbs?: WorkspaceBreadcrumb[];
  /** Whether to show back button */
  showBackButton?: boolean;
  /** Back button destination */
  backUrl?: string;
  /** Back button label */
  backLabel?: string;
  /** Additional header actions */
  headerActions?: ReactNode;
  /** Custom workspace actions */
  actions?: WorkspaceAction[];
  /** Default actions to enable/disable */
  defaultActions?: DefaultWorkspaceActions;
  /** Whether page is in loading state */
  isLoading?: boolean;
  /** Error state */
  error?: Error | string;
  /** Loading message */
  loadingMessage?: string;
  /** Additional CSS classes */
  className?: string;
  /** Content area CSS classes */
  contentClassName?: string;
  /** Children content */
  children: ReactNode;
}

/**
 * Props specific to workspace list layout
 */
export interface WorkspaceListLayoutProps
  extends Omit<WorkspaceLayoutProps, "variant" | "workspace"> {
  variant: "list";
  /** Total number of workspaces */
  totalCount?: number;
  /** Whether to show create workspace action */
  showCreateAction?: boolean;
}

/**
 * Props specific to workspace detail layout
 */
export interface WorkspaceDetailLayoutProps
  extends Omit<WorkspaceLayoutProps, "variant"> {
  variant: "detail";
  /** Required workspace for detail view */
  workspace: Workspace;
  /** Whether to show workspace switcher in header */
  showWorkspaceSwitcher?: boolean;
}

/**
 * Props for minimal workspace layout
 */
export interface WorkspaceMinimalLayoutProps
  extends Omit<WorkspaceLayoutProps, "variant" | "defaultActions"> {
  variant: "minimal";
}

// ============================================================================
// ACTION HANDLER TYPES
// ============================================================================

/**
 * Context passed to action handlers
 */
export interface WorkspaceActionContext {
  /** Current workspace (if in detail view) */
  workspace?: Workspace;
  /** Layout variant */
  variant: WorkspaceLayoutVariant;
  /** Refresh function to reload data */
  refresh?: () => void;
  /** Navigation function */
  navigate?: (url: string) => void;
}

/**
 * Action handler function signature
 */
export type WorkspaceActionHandler = (
  context: WorkspaceActionContext,
) => void | Promise<void>;

/**
 * Action factory function for creating default actions
 */
export type WorkspaceActionFactory = (
  context: WorkspaceActionContext,
) => WorkspaceAction[];

// ============================================================================
// WORKSPACE LAYOUT STATE
// ============================================================================

/**
 * Internal state for workspace layout component
 */
export interface WorkspaceLayoutState {
  /** Whether actions dropdown is open */
  isActionsOpen: boolean;
  /** Currently loading actions */
  loadingActions: Set<string>;
  /** Last refresh timestamp */
  lastRefresh?: Date;
}

// ============================================================================
// HOOK TYPES
// ============================================================================

/**
 * Return type for useWorkspaceActions hook
 */
export interface UseWorkspaceActionsReturn {
  /** Available actions */
  actions: WorkspaceAction[];
  /** Execute an action by ID */
  executeAction: (actionId: string) => Promise<void>;
  /** Whether any action is loading */
  isLoading: boolean;
  /** Refresh all actions */
  refresh: () => void;
}

/**
 * Return type for useWorkspaceLayout hook
 */
export interface UseWorkspaceLayoutReturn {
  /** Current workspace context */
  context: WorkspaceContext;
  /** Generated breadcrumbs */
  breadcrumbs: WorkspaceBreadcrumb[];
  /** Available actions */
  actions: WorkspaceAction[];
  /** Layout state */
  state: WorkspaceLayoutState;
  /** Action handlers */
  handlers: {
    executeAction: (actionId: string) => Promise<void>;
    refresh: () => void;
    navigate: (url: string) => void;
  };
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/**
 * Global workspace layout configuration
 */
export interface WorkspaceLayoutConfig {
  /** Default actions to show */
  defaultActions: DefaultWorkspaceActions;
  /** Default layout variant */
  defaultVariant: WorkspaceLayoutVariant;
  /** Whether to auto-generate breadcrumbs */
  autoGenerateBreadcrumbs: boolean;
  /** Default back URL for detail views */
  defaultBackUrl: string;
  /** Action placement preferences */
  actionPlacement: {
    /** Maximum actions in header before moving to dropdown */
    maxHeaderActions: number;
    /** Actions that should always be in header */
    alwaysInHeader: WorkspaceActionType[];
    /** Actions that should always be in dropdown */
    alwaysInDropdown: WorkspaceActionType[];
  };
}

/**
 * Default workspace layout configuration
 */
export const DEFAULT_WORKSPACE_LAYOUT_CONFIG: WorkspaceLayoutConfig = {
  defaultActions: {
    edit: true,
    duplicate: true,
    delete: true,
    settings: true,
    refresh: true,
  },
  defaultVariant: "detail",
  autoGenerateBreadcrumbs: true,
  defaultBackUrl: "/workspaces",
  actionPlacement: {
    maxHeaderActions: 2,
    alwaysInHeader: ["refresh"],
    alwaysInDropdown: ["delete"],
  },
} as const;
