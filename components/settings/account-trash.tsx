"use client";

import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { TrashTable, type TrashItem } from "@/components/trash/trash-table";
import { Button } from "@/components/ui/button";
import {
  useDeleteWorkspaceForever,
  useRestoreWorkspace,
} from "@/hooks/mutations/use-workspace-trash";
import { awaitingData } from "@/hooks/use-awaiting-data";
import { workspaceQueries } from "@/lib/query-keys";
import { SettingsGroup } from "./settings-group";

/** The account's trash has no workspace to wait for: only its own list (D16a's rule). */
const ACCOUNT_SCOPE = { id: "account", error: null };

/**
 * The account's Trash, in Data and trash (D13a): the workspaces deleted and still restorable, on
 * the one trash table. A workspace is deleted for good only after its name is typed: everything in
 * it goes with it.
 */
export function AccountTrash() {
  const deleted = useQuery(workspaceQueries.deleted());
  const restoreWorkspace = useRestoreWorkspace();
  const deleteWorkspaceForever = useDeleteWorkspaceForever();

  const items = useMemo<TrashItem[]>(
    () =>
      (deleted.data?.workspaces ?? []).map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        kind: "Workspace",
        deletedAt: workspace.deleted_at,
        daysLeft: workspace.days_remaining,
      })),
    [deleted.data],
  );

  const restore = async (item: TrashItem) => {
    // The mutation toasts a failure; the row's menu is free again either way.
    await restoreWorkspace.mutateAsync(item).catch(() => undefined);
  };

  const deleteForever = async (item: TrashItem) => {
    // A failure is toasted and rethrown, so the table keeps its confirmation open.
    await deleteWorkspaceForever.mutateAsync(item);
  };

  return (
    <SettingsGroup
      title="Trash"
      description="Workspaces you deleted. Restore one while it's still restorable, or delete it for good."
      action={
        <Button
          variant="outline"
          size="icon"
          onClick={() => void deleted.refetch()}
          disabled={deleted.isFetching}
          aria-label="Refresh the trash"
        >
          <RefreshCw
            className={deleted.isFetching ? "animate-spin" : undefined}
          />
        </Button>
      }
    >
      <TrashTable
        caption="Deleted workspaces"
        items={items}
        awaiting={awaitingData(deleted, ACCOUNT_SCOPE) && !deleted.error}
        error={deleted.error}
        onRetry={() => void deleted.refetch()}
        onRestore={restore}
        onDeleteForever={deleteForever}
        emptyDescription="Workspaces you delete stay here while they can still be restored."
        confirmByTypingName
        deleteForeverWarning={() =>
          "Everything in it goes: articles, personas, the brand voice and its connections."
        }
      />
    </SettingsGroup>
  );
}
