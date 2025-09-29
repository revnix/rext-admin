"use client";

import {
  ArrowLeft,
  Building2,
  Copy,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Settings,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type {
  WorkspaceAction,
  WorkspaceActionContext,
  WorkspaceBreadcrumb,
  WorkspaceDetailLayoutProps,
  WorkspaceLayoutProps,
  WorkspaceListLayoutProps,
  WorkspaceMinimalLayoutProps,
} from "@/types/workspace-layout";

/**
 * WorkspaceLayout Component
 *
 * A specialized layout wrapper for workspace-related pages that extends PageLayout
 * with workspace-specific features including:
 * - Automatic breadcrumb generation
 * - Built-in workspace action buttons (edit, duplicate, delete, settings)
 * - Workspace context handling
 * - Consistent header patterns
 * - Error boundaries for workspace operations
 *
 * Supports three variants:
 * - "list": For workspace listing pages
 * - "detail": For individual workspace pages
 * - "minimal": For focused workspace views
 */

// ============================================================================
// ACTION FACTORIES
// ============================================================================

/**
 * Create default workspace actions based on context
 */
function createDefaultActions(
  context: WorkspaceActionContext,
  enabledActions: {
    edit?: boolean;
    duplicate?: boolean;
    delete?: boolean;
    settings?: boolean;
    refresh?: boolean;
  } = {},
): WorkspaceAction[] {
  const actions: WorkspaceAction[] = [];
  const { workspace, variant, refresh, navigate } = context;

  // Refresh action (available in all variants)
  if (enabledActions.refresh) {
    actions.push({
      id: "refresh",
      label: "Refresh",
      icon: RefreshCw,
      onClick: () => refresh?.(),
      variant: "outline",
      tooltip: "Refresh workspace data",
      placement: "header",
    });
  }

  // Workspace-specific actions (only for detail variant with workspace)
  if (variant === "detail" && workspace) {
    if (enabledActions.edit) {
      actions.push({
        id: "edit",
        label: "Edit Workspace",
        icon: Settings,
        onClick: () => {
          // This will be handled by the workspace store
          const openWorkspaceForm =
            useWorkspaceStore.getState().openWorkspaceForm;
          openWorkspaceForm("edit", workspace);
        },
        variant: "outline",
        tooltip: "Edit workspace details",
        placement: "dropdown",
      });
    }

    if (enabledActions.duplicate) {
      actions.push({
        id: "duplicate",
        label: "Duplicate Workspace",
        icon: Copy,
        onClick: async () => {
          try {
            const duplicateWorkspace =
              useWorkspaceStore.getState().duplicateWorkspace;
            const duplicated = await duplicateWorkspace(workspace.id);
            toast.success(
              `Workspace "${duplicated.title}" created successfully`,
            );
            navigate?.(`/workspaces/${duplicated.id}`);
          } catch (error) {
            console.error("Failed to duplicate workspace:", error);
            toast.error("Failed to duplicate workspace. Please try again.");
          }
        },
        variant: "outline",
        tooltip: "Create a copy of this workspace",
        placement: "dropdown",
      });
    }

    if (enabledActions.settings) {
      actions.push({
        id: "settings",
        label: "Workspace Settings",
        icon: Settings,
        onClick: () => {
          navigate?.(`/workspaces/${workspace.id}?tab=settings`);
        },
        variant: "outline",
        tooltip: "Configure workspace settings",
        placement: "dropdown",
      });
    }

    if (enabledActions.delete) {
      actions.push({
        id: "delete",
        label: "Delete Workspace",
        icon: Trash2,
        onClick: () => {
          // This would typically open a confirmation dialog
          toast.info("Delete confirmation dialog would appear here");
        },
        variant: "destructive",
        tooltip: "Permanently delete this workspace",
        placement: "dropdown",
        confirmation: {
          title: "Delete Workspace",
          message: `Are you sure you want to delete "${workspace.title}"? This action cannot be undone.`,
          confirmLabel: "Delete",
          cancelLabel: "Cancel",
        },
      });
    }
  }

  // List variant actions
  if (variant === "list") {
    actions.push({
      id: "create",
      label: "New Workspace",
      icon: Plus,
      onClick: () => {
        const openWorkspaceForm =
          useWorkspaceStore.getState().openWorkspaceForm;
        openWorkspaceForm("create");
      },
      variant: "default",
      tooltip: "Create a new workspace",
      placement: "header",
    });
  }

  return actions;
}

/**
 * Generate automatic breadcrumbs based on variant and workspace
 */
function generateBreadcrumbs(
  variant: WorkspaceLayoutProps["variant"],
  workspace?: WorkspaceLayoutProps["workspace"],
): WorkspaceBreadcrumb[] {
  const breadcrumbs: WorkspaceBreadcrumb[] = [
    { label: "Workspaces", href: "/workspaces" },
  ];

  if (variant === "detail" && workspace) {
    breadcrumbs.push({
      label: workspace.title,
      isActive: true,
    });
  }

  return breadcrumbs;
}

// ============================================================================
// LAYOUT COMPONENT
// ============================================================================

/**
 * Main WorkspaceLayout component with automatic action handling
 */
function WorkspaceLayoutBase({
  title,
  description,
  variant = "detail",
  workspace,
  breadcrumbs: customBreadcrumbs,
  showBackButton = false,
  backUrl = "/workspaces",
  backLabel = "Back to Workspaces",
  headerActions,
  actions: customActions = [],
  defaultActions = {
    edit: true,
    duplicate: true,
    delete: true,
    settings: true,
    refresh: true,
  },
  error,
  className,
  contentClassName,
  children,
}: WorkspaceLayoutProps) {
  const router = useRouter();
  const [loadingStates, setLoadingStates] = useState<Set<string>>(new Set());

  // Create action context
  const actionContext: WorkspaceActionContext = useMemo(
    () => ({
      workspace,
      variant: variant || "detail",
      refresh: () => {
        // This would typically trigger a refetch
        window.location.reload();
      },
      navigate: (url: string) => router.push(url),
    }),
    [workspace, variant, router],
  );

  // Generate default actions
  const defaultActionList = useMemo(
    () => createDefaultActions(actionContext, defaultActions),
    [actionContext, defaultActions],
  );

  // Combine default and custom actions
  const allActions = useMemo(
    () => [...defaultActionList, ...customActions],
    [defaultActionList, customActions],
  );

  // Execute action with loading state
  const executeAction = useCallback(
    async (actionId: string) => {
      const action = allActions.find((a) => a.id === actionId);
      if (!action) return;

      setLoadingStates((prev) => new Set(prev).add(actionId));
      try {
        await action.onClick();
      } catch (error) {
        console.error(`Failed to execute action ${actionId}:`, error);
        toast.error(`Failed to execute ${action.label}`);
      } finally {
        setLoadingStates((prev) => {
          const next = new Set(prev);
          next.delete(actionId);
          return next;
        });
      }
    },
    [allActions],
  );

  // Generate breadcrumbs
  const breadcrumbs = useMemo(() => {
    if (customBreadcrumbs) {
      return customBreadcrumbs.map((crumb) => ({
        label: crumb.label,
        href: crumb.href,
      }));
    }
    return generateBreadcrumbs(variant, workspace).map((crumb) => ({
      label: crumb.label,
      href: crumb.href,
    }));
  }, [customBreadcrumbs, variant, workspace]);

  // Separate actions by placement
  const headerActionList = allActions.filter(
    (action) => action.placement === "header" || !action.placement,
  );
  const dropdownActionList = allActions.filter(
    (action) => action.placement === "dropdown",
  );

  // Build page actions
  const pageActions = (
    <div className="flex items-center gap-2">
      {/* Custom header actions */}
      {headerActions}

      {/* Header actions */}
      {headerActionList.map((action) => (
        <Button
          key={action.id}
          variant={action.variant || "outline"}
          onClick={() => executeAction(action.id)}
          disabled={action.disabled || loadingStates.has(action.id)}
          title={action.tooltip}
        >
          {loadingStates.has(action.id) ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <action.icon className="h-4 w-4 mr-2" />
          )}
          {loadingStates.has(action.id) ? "Loading..." : action.label}
        </Button>
      ))}

      {/* Dropdown actions */}
      {dropdownActionList.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {dropdownActionList.map((action, index) => (
              <div key={action.id}>
                {index > 0 && action.variant === "destructive" && (
                  <DropdownMenuSeparator />
                )}
                <DropdownMenuItem
                  onClick={() => executeAction(action.id)}
                  disabled={action.disabled || loadingStates.has(action.id)}
                  className={
                    action.variant === "destructive" ? "text-destructive" : ""
                  }
                >
                  {loadingStates.has(action.id) ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <action.icon className="h-4 w-4 mr-2" />
                  )}
                  {loadingStates.has(action.id) ? "Loading..." : action.label}
                </DropdownMenuItem>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Back button */}
      {showBackButton && (
        <Button asChild variant="outline" size="sm">
          <Link href={backUrl}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {backLabel}
          </Link>
        </Button>
      )}
    </div>
  );

  // Handle error state
  if (error) {
    const errorMessage = typeof error === "string" ? error : error.message;
    return (
      <PageLayout
        title="Workspace Error"
        description="Failed to load workspace"
        breadcrumbs={breadcrumbs}
        className={className}
      >
        <div className="flex flex-col items-center justify-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Something went wrong</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            {errorMessage || "Failed to load workspace. Please try again."}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button asChild variant="outline">
              <Link href="/workspaces">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Workspaces
              </Link>
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={title}
      description={description}
      breadcrumbs={breadcrumbs}
      actions={pageActions}
      className={className}
    >
      <div className={contentClassName}>{children}</div>
    </PageLayout>
  );
}

// ============================================================================
// TYPED VARIANTS
// ============================================================================

/**
 * Workspace List Layout - for workspace listing pages
 */
export function WorkspaceListLayout(props: WorkspaceListLayoutProps) {
  return <WorkspaceLayoutBase {...props} variant="list" />;
}

/**
 * Workspace Detail Layout - for individual workspace pages
 */
export function WorkspaceDetailLayout(props: WorkspaceDetailLayoutProps) {
  return (
    <WorkspaceLayoutBase
      {...props}
      variant="detail"
      showBackButton={props.showBackButton ?? true}
    />
  );
}

/**
 * Workspace Minimal Layout - for focused workspace views
 */
export function WorkspaceMinimalLayout(props: WorkspaceMinimalLayoutProps) {
  return (
    <WorkspaceLayoutBase
      {...props}
      variant="minimal"
      defaultActions={{}} // Minimal layout has no default actions
    />
  );
}

/**
 * Main WorkspaceLayout component - automatically selects variant based on props
 */
export function WorkspaceLayout(props: WorkspaceLayoutProps) {
  return <WorkspaceLayoutBase {...props} />;
}

// Export the base component
export { WorkspaceLayoutBase };

// Export types for external use
export type {
  WorkspaceAction,
  WorkspaceDetailLayoutProps,
  WorkspaceLayoutProps,
  WorkspaceListLayoutProps,
  WorkspaceMinimalLayoutProps,
} from "@/types/workspace-layout";
