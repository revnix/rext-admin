/**
 * The trash's two actions, restore and delete for good: on a deleted workspace in the account's
 * trash (D13a), and on a deleted article or persona in a workspace's trash (D13b, G45). Each
 * toasts its outcome with the item's name and refreshes the lists it changes; a failure is toasted
 * and rethrown, so a caller awaiting `mutateAsync` (the trash's confirmation) can stay open.
 *
 * @module hooks/mutations/use-workspace-trash
 */

import { apiClient } from "@/lib/api-client";
import type { WorkspaceTrashKind } from "@/lib/api-client/workspaces";
import { personaQueries, workspaceQueries } from "@/lib/query-keys";
import { useMutationWithToast } from "./useMutationWithToast";

/** A deleted workspace, as the trash names it. */
export interface TrashedWorkspace {
  id: string;
  name: string;
}

function messageOf(error: Error, fallback: string) {
  return error.message || fallback;
}

/** Restores a deleted workspace: it's back in the workspace list and out of the trash. */
export function useRestoreWorkspace() {
  return useMutationWithToast<string, TrashedWorkspace>({
    mutationKey: [...workspaceQueries.all(), "restore"],
    mutationFn: async ({ id, name }) => {
      await apiClient.workspaces.restore(id);
      return name;
    },
    successMessage: (name) => `"${name}" was restored`,
    errorMessage: (error) =>
      messageOf(error, "The workspace couldn't be restored"),
    // The workspace list and the trash share this key's prefix.
    invalidateQueries: [workspaceQueries.all()],
  });
}

/** Deletes a workspace in the trash for good, and everything in it. */
export function useDeleteWorkspaceForever() {
  return useMutationWithToast<string, TrashedWorkspace>({
    mutationKey: [...workspaceQueries.all(), "delete-forever"],
    mutationFn: async ({ id, name }) => {
      await apiClient.workspaces.deletePermanently(id);
      return name;
    },
    successMessage: (name) => `"${name}" was deleted for good`,
    errorMessage: (error) =>
      messageOf(error, "The workspace couldn't be deleted"),
    invalidateQueries: [workspaceQueries.deleted().queryKey],
  });
}

/** A deleted article or persona, as the workspace's trash names it. */
export interface TrashedWorkspaceItem {
  kind: WorkspaceTrashKind;
  id: string;
  name: string;
}

/** What a change to the workspace's trash refreshes: the trash, and the list the item belongs to. */
function trashLists(workspaceId: string) {
  return [
    workspaceQueries.trash(workspaceId).queryKey,
    ["content", workspaceId],
    personaQueries.all(workspaceId),
  ];
}

/** Restores a deleted article or persona: it's back in its list and out of the trash. */
export function useRestoreTrashItem(workspaceId: string) {
  return useMutationWithToast<string, TrashedWorkspaceItem>({
    mutationKey: [...workspaceQueries.trash(workspaceId).queryKey, "restore"],
    mutationFn: async ({ kind, id, name }) => {
      await apiClient.workspaces.restoreTrashItem(workspaceId, kind, id);
      return name;
    },
    successMessage: (name) => `"${name}" was restored`,
    errorMessage: (error) => messageOf(error, "It couldn't be restored"),
    invalidateQueries: trashLists(workspaceId),
  });
}

/** Deletes an article or persona in the trash for good. */
export function useDeleteTrashItemForever(workspaceId: string) {
  return useMutationWithToast<string, TrashedWorkspaceItem>({
    mutationKey: [
      ...workspaceQueries.trash(workspaceId).queryKey,
      "delete-forever",
    ],
    mutationFn: async ({ kind, id, name }) => {
      await apiClient.workspaces.deleteTrashItemForever(workspaceId, kind, id);
      return name;
    },
    successMessage: (name) => `"${name}" was deleted for good`,
    errorMessage: (error) => messageOf(error, "It couldn't be deleted"),
    invalidateQueries: [workspaceQueries.trash(workspaceId).queryKey],
  });
}
