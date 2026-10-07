"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { TrashTable, type TrashItem } from "@/components/trash/trash-table";
import { Button } from "@/components/ui/button";
import { awaitingData } from "@/hooks/use-awaiting-data";
import { apiClient } from "@/lib/api-client";
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
  const queryClient = useQueryClient();
  const deleted = useQuery(workspaceQueries.deleted());

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
    try {
      await apiClient.workspaces.restore(item.id);
      toast.success(`"${item.name}" was restored`);
      // The workspace list and the trash share this key's prefix.
      await queryClient.invalidateQueries({ queryKey: workspaceQueries.all() });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "The workspace couldn't be restored",
      );
    }
  };

  const deleteForever = async (item: TrashItem) => {
    try {
      await apiClient.workspaces.deletePermanently(item.id);
      toast.success(`"${item.name}" was deleted for good`);
      await queryClient.invalidateQueries({
        queryKey: workspaceQueries.deleted().queryKey,
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "The workspace couldn't be deleted",
      );
      throw error;
    }
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
        confirmByTypingName
        deleteForeverWarning={() =>
          "Everything in it goes: articles, personas, the brand voice and its connections."
        }
      />
    </SettingsGroup>
  );
}
