/**
 * The account trash's two actions on a deleted workspace (D13a): restore it, or delete it for good.
 * Each toasts its outcome with the workspace's name and refreshes the lists it changes; a failure
 * is toasted and rethrown, so a caller awaiting `mutateAsync` (the trash's confirmation) can stay
 * open.
 *
 * @module hooks/mutations/use-workspace-trash
 */

import { apiClient } from "@/lib/api-client";
import { workspaceQueries } from "@/lib/query-keys";
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
