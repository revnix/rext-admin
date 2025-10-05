/**
 * Example: Workspace Mutations using new DRY utilities
 *
 * Demonstrates usage of:
 * - Split workspace services (workspace-service, knowledge-service, members-service)
 * - useMutationWithToast for CRUD operations
 * - useOptimisticMutation for instant UI updates
 * - withRetry for resilient API calls
 */

"use client";

import { useMutationWithToast, useOptimisticMutation } from "@/hooks/mutations";
import { RetryPresets, withRetry } from "@/lib/api";
import {
  knowledgeService,
  membersService,
  workspaceService,
} from "@/services/workspace";
import type {
  AddWebKnowledgeRequest,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  Workspace,
} from "@/types/workspace";

/**
 * Hook for creating workspaces
 *
 * Features:
 * - Automatic toast notifications
 * - Query invalidation
 * - Loading toast
 */
export function useCreateWorkspaceMutation() {
  return useMutationWithToast<
    Awaited<ReturnType<typeof workspaceService.createWorkspace>>,
    CreateWorkspaceRequest
  >({
    mutationFn: (data) => workspaceService.createWorkspace(data),
    successMessage: (data) => `Workspace "${data.workspace.title}" created!`,
    errorMessage: "Failed to create workspace",
    invalidateQueries: [["workspaces"]],
    showLoadingToast: true,
    loadingMessage: "Creating workspace...",
  });
}

/**
 * Hook for updating workspaces with optimistic updates
 *
 * Features:
 * - Instant UI update
 * - Automatic rollback on error
 * - Toast notifications
 */
export function useUpdateWorkspaceMutation() {
  return useOptimisticMutation<
    Awaited<ReturnType<typeof workspaceService.updateWorkspace>>,
    { id: string; data: UpdateWorkspaceRequest },
    Workspace[]
  >({
    mutationFn: ({ id, data }) => workspaceService.updateWorkspace(id, data),
    queryKey: ["workspaces"],
    optimisticUpdater: (oldWorkspaces, { id, data }) =>
      oldWorkspaces.map((ws) =>
        ws.id === id ? { ...ws, ...data } : ws,
      ) as Workspace[],
    successMessage: "Workspace updated successfully",
    errorMessage: "Failed to update workspace",
  });
}

/**
 * Hook for deleting workspaces with optimistic removal
 */
export function useDeleteWorkspaceMutation() {
  return useOptimisticMutation<
    Awaited<ReturnType<typeof workspaceService.deleteWorkspace>>,
    string, // workspace ID
    Workspace[]
  >({
    mutationFn: (workspaceId) => workspaceService.deleteWorkspace(workspaceId),
    queryKey: ["workspaces"],
    optimisticUpdater: (oldWorkspaces, workspaceId) =>
      oldWorkspaces.filter((ws) => ws.id !== workspaceId),
    successMessage: "Workspace deleted successfully",
    errorMessage: "Failed to delete workspace",
  });
}

/**
 * Hook for duplicating workspaces
 */
export function useDuplicateWorkspaceMutation() {
  return useMutationWithToast<
    Awaited<ReturnType<typeof workspaceService.duplicateWorkspace>>,
    string // source workspace ID
  >({
    mutationFn: (sourceId) => workspaceService.duplicateWorkspace(sourceId),
    successMessage: (data) =>
      `Workspace "${data.workspace.title}" duplicated successfully`,
    errorMessage: "Failed to duplicate workspace",
    invalidateQueries: [["workspaces"]],
    showLoadingToast: true,
    loadingMessage: "Duplicating workspace...",
  });
}

/**
 * Hook for adding web knowledge
 */
export function useAddWebKnowledgeMutation(workspaceId: string) {
  return useMutationWithToast<
    Awaited<ReturnType<typeof knowledgeService.addWebKnowledge>>,
    AddWebKnowledgeRequest
  >({
    mutationFn: (data) => knowledgeService.addWebKnowledge(data),
    successMessage: "Web knowledge added successfully",
    errorMessage: "Failed to add web knowledge",
    invalidateQueries: [
      ["workspace", workspaceId, "knowledge"],
      ["workspace", workspaceId, "web-knowledge"],
    ],
    showLoadingToast: true,
    loadingMessage: "Adding web knowledge...",
  });
}

/**
 * Hook for adding workspace members
 */
export function useAddMemberMutation(workspaceId: string) {
  return useMutationWithToast<
    Awaited<ReturnType<typeof membersService.addWorkspaceMember>>,
    string // email
  >({
    mutationFn: (email) =>
      membersService.addWorkspaceMember(workspaceId, email),
    successMessage: (data) => `Added ${data.member.display_name} to workspace`,
    errorMessage: "Failed to add member",
    invalidateQueries: [["workspace", workspaceId, "members"]],
  });
}

/**
 * Helper function to fetch workspace with retry logic
 *
 * Demonstrates withRetry utility for resilient API calls
 */
export async function fetchWorkspaceWithRetry(workspaceId: string) {
  return withRetry(() => workspaceService.getWorkspace(workspaceId), {
    ...RetryPresets.standard,
    operationName: "fetch workspace",
    component: "WorkspaceDetails",
    onRetry: (_error, _attempt, _delay) => {},
  });
}

/**
 * Example usage in a component:
 *
 * ```tsx
 * function WorkspaceManager({ workspaceId }: { workspaceId: string }) {
 *   const createMutation = useCreateWorkspaceMutation();
 *   const updateMutation = useUpdateWorkspaceMutation();
 *   const deleteMutation = useDeleteWorkspaceMutation();
 *   const addMemberMutation = useAddMemberMutation(workspaceId);
 *
 *   const handleCreate = () => {
 *     createMutation.mutate({
 *       title: "New Workspace",
 *       url: "https://example.com",
 *       description: "My workspace",
 *     });
 *   };
 *
 *   const handleUpdate = () => {
 *     updateMutation.mutate({
 *       id: workspaceId,
 *       data: { title: "Updated Title" },
 *     });
 *   };
 *
 *   const handleDelete = () => {
 *     deleteMutation.mutate(workspaceId);
 *   };
 *
 *   const handleAddMember = () => {
 *     addMemberMutation.mutate("user@example.com");
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleCreate} disabled={createMutation.isPending}>
 *         Create Workspace
 *       </button>
 *
 *       <button onClick={handleUpdate} disabled={updateMutation.isPending}>
 *         Update Workspace
 *       </button>
 *
 *       <button onClick={handleDelete} disabled={deleteMutation.isPending}>
 *         Delete Workspace
 *       </button>
 *
 *       <button onClick={handleAddMember} disabled={addMemberMutation.isPending}>
 *         Add Member
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 *
 * BENEFITS:
 * - Consistent mutation patterns across all workspace operations
 * - Automatic error handling and user feedback
 * - Optimistic updates for better UX
 * - Built-in retry logic for resilience
 * - Type-safe with full TypeScript support
 * - Easy to test and maintain
 */
