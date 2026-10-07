"use client";

import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { SettingsGroup } from "@/components/settings/settings-group";
import { TrashTable, type TrashItem } from "@/components/trash/trash-table";
import { Button } from "@/components/ui/button";
import {
  type TrashedWorkspaceItem,
  useDeleteTrashItemForever,
  useRestoreTrashItem,
} from "@/hooks/mutations/use-workspace-trash";
import { useAwaitingData } from "@/hooks/use-awaiting-data";
import { useWorkspacePermission } from "@/hooks/use-permission";
import type { WorkspaceTrashKind } from "@/lib/api-client/workspaces";
import { CONTENT_PERMISSIONS, PERSONA_PERMISSIONS } from "@/lib/permissions";
import { workspaceQueries } from "@/lib/query-keys";
import { useWorkspace } from "@/providers/workspace-provider";

const KIND_LABEL: Record<WorkspaceTrashKind, string> = {
  article: "Article",
  persona: "Persona",
};

/** The purge in plain words, from the backend's retention. */
function purgeWords(days: number | undefined) {
  return days
    ? `Deleted articles and personas stay here for ${days} days, then they're deleted for good.`
    : "Deleted articles and personas stay here for a while, then they're deleted for good.";
}

/**
 * Workspace settings, Trash (D13b, plans/app/D-pages.md §2.11): the workspace's deleted articles
 * and personas on the one trash table, each restorable or deleted for good by whoever may delete
 * its kind (content.delete, persona.delete; the backend lists only the kinds the person may read).
 * The backend purges an item when its retention ends (G45).
 */
export function WorkspaceTrashSection() {
  // The provider's workspaceId is the address's slug; the content and persona lists key their
  // caches by the workspace's own id, so the trash and its refreshes use that.
  const { workspaceId: workspaceRef, workspace } = useWorkspace();
  const workspaceId = workspace?.id;
  const trash = useQuery({
    ...workspaceQueries.trash(workspaceId ?? ""),
    enabled: Boolean(workspaceId),
  });
  const awaiting = useAwaitingData(trash);
  const { hasPermission: canDeleteArticles } = useWorkspacePermission(
    CONTENT_PERMISSIONS.DELETE,
    workspaceRef,
  );
  const { hasPermission: canDeletePersonas } = useWorkspacePermission(
    PERSONA_PERMISSIONS.DELETE,
    workspaceRef,
  );
  const restoreItem = useRestoreTrashItem(workspaceId ?? "");
  const deleteItemForever = useDeleteTrashItemForever(workspaceId ?? "");

  // The table's rows, and each row's kind as the backend names it, for its actions.
  const { items, kinds } = useMemo(() => {
    const entries = trash.data?.items ?? [];
    return {
      items: entries.map<TrashItem>((entry) => ({
        id: entry.id,
        name: entry.name,
        kind: KIND_LABEL[entry.kind],
        deletedAt: entry.deleted_at,
        daysLeft: entry.days_remaining,
      })),
      kinds: new Map(entries.map((entry) => [entry.id, entry.kind])),
    };
  }, [trash.data]);

  const asTrashed = (item: TrashItem): TrashedWorkspaceItem => ({
    kind: kinds.get(item.id) ?? "article",
    id: item.id,
    name: item.name,
  });

  const canAct = (item: TrashItem) =>
    kinds.get(item.id) === "persona" ? canDeletePersonas : canDeleteArticles;

  const restore = async (item: TrashItem) => {
    // The mutation toasts a failure; the row's menu is free again either way.
    await restoreItem.mutateAsync(asTrashed(item)).catch(() => undefined);
  };

  const deleteForever = async (item: TrashItem) => {
    // A failure is toasted and rethrown, so the table keeps its confirmation open.
    await deleteItemForever.mutateAsync(asTrashed(item));
  };

  return (
    <SettingsGroup
      title="Trash"
      description={`${purgeWords(trash.data?.retention_days)} Restore one before then, or delete it for good now.`}
      action={
        <Button
          variant="outline"
          size="icon"
          onClick={() => void trash.refetch()}
          disabled={trash.isFetching}
          aria-label="Refresh the trash"
        >
          <RefreshCw
            className={trash.isFetching ? "animate-spin" : undefined}
          />
        </Button>
      }
    >
      <TrashTable
        caption="Deleted articles and personas"
        items={items}
        awaiting={awaiting && !trash.error}
        error={trash.error}
        onRetry={() => void trash.refetch()}
        onRestore={restore}
        onDeleteForever={deleteForever}
        canAct={canAct}
        emptyDescription={purgeWords(trash.data?.retention_days)}
        // What G45's delete for good removes (rext-backend's workspace_trash_service).
        deleteForeverWarning={(item) =>
          kinds.get(item.id) === "persona"
            ? "The persona and its photo go. Articles written as this persona stay, without its byline."
            : "The article goes, with its SEO data and publishing results."
        }
      />
    </SettingsGroup>
  );
}
