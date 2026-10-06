"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Trash2 } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  type KeywordRow,
  KeywordTable,
} from "@/components/keywords/keyword-table";
import { useConfirmation } from "@/components/ui/confirmation-dialog";
import type { DataTableRowAction } from "@/components/ui/data-table";
import { useDataTableUrlState } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { useToast } from "@/hooks/use-toast";
import {
  deleteLibraryItem,
  libraryStartQuery,
} from "@/lib/generate-content/library-item";
import { keywordMetrics } from "@/lib/keywords/keyword-metrics";
import { log } from "@/lib/logger";
import { CONTENT_PERMISSIONS } from "@/lib/permissions";
import { libraryQueries } from "@/lib/query-keys";
import { workspaceRoutes } from "@/lib/routes";
import { keywordLibraryParams } from "@/lib/search-params/keyword-library";
import { awaitingData } from "@/lib/query-state";
import { useWorkspace } from "@/providers/workspace-provider";

const libraryLogger = log.forComponent("library-view");

/**
 * The keyword library (plans/app/E-workflow.md §4, the library): the keywords the user researched in
 * this workspace, newest first, in the keyword table the Select keyword step uses. "Use" starts an
 * article from the saved research (no new analysis); a row opens the keyword's page; its menu
 * removes it.
 */
export function LibraryView() {
  const { workspace, workspaceSlug } = useWorkspace();
  const { user } = useAuthSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { confirm, ConfirmationComponent } = useConfirmation();
  const tableState = useDataTableUrlState(keywordLibraryParams);
  const workspaceId = workspace?.id ?? "";
  const userId = user?.id ?? "";
  // The research is read only by someone who may read the workspace's content, as on Generate.
  const { hasPermission: canRead, isLoading: isPermissionLoading } =
    useWorkspacePermission(CONTENT_PERMISSIONS.READ, workspaceId);
  const { hasPermission: canGenerate } = useWorkspacePermission(
    CONTENT_PERMISSIONS.CREATE,
    workspaceId,
  );

  const query = libraryQueries.list(workspaceId, userId);
  const library = useQuery({ ...query, enabled: query.enabled && canRead });

  const rows = useMemo<KeywordRow[]>(
    () =>
      (library.data ?? []).map((entry) => ({
        id: entry.key,
        keyword: entry.value.original_query,
        metrics: keywordMetrics(entry.value.seo_state),
        researchedAt: entry.value.timestamp,
      })),
    [library.data],
  );

  const remove = useMutation({
    mutationFn: (row: KeywordRow) =>
      deleteLibraryItem(row.id, userId, workspaceId),
    onSuccess: (_, row) => {
      toast.success(`"${row.keyword}" was removed from your library.`);
      return queryClient.invalidateQueries({
        queryKey: libraryQueries.list(workspaceId, userId).queryKey,
      });
    },
    onError: (error, row) => {
      libraryLogger.error("Failed to delete keyword", { error });
      toast.error(`"${row.keyword}" couldn't be removed. Try again.`);
    },
  });

  const open = (row: KeywordRow) =>
    router.push(
      workspaceRoutes.keywordLibraryItem(workspaceSlug, row.id) as Route,
    );

  const rowActions = (row: KeywordRow): DataTableRowAction[] => [
    {
      label: "Open",
      icon: Eye,
      href: workspaceRoutes.keywordLibraryItem(workspaceSlug, row.id),
    },
    {
      label: "Remove from library",
      icon: Trash2,
      destructive: true,
      onSelect: async () => {
        const confirmed = await confirm({
          title: `Remove "${row.keyword}"?`,
          description:
            "Its saved research is deleted for good. Articles already written from it keep their text.",
          confirmText: "Remove keyword",
          cancelText: "Keep keyword",
          variant: "destructive",
        });
        if (confirmed) remove.mutate(row);
      },
    },
  ];

  if (!isPermissionLoading && workspaceId && !canRead) {
    return (
      <EmptyState
        title="You can't see this workspace's keywords"
        description="Ask a workspace admin for access to its content."
      />
    );
  }

  return (
    <>
      {ConfirmationComponent}
      <KeywordTable
        caption="Researched keywords"
        rows={rows}
        state={tableState}
        search={{ placeholder: "Search keywords" }}
        // The list waits for the signed-in user (D16a); without the right to read it never runs.
        isLoading={isPermissionLoading || awaitingData(library, canRead)}
        error={
          library.error ? (
            <Notice tone="danger" title="Your keywords didn't load">
              Refresh the page to try again.
            </Notice>
          ) : undefined
        }
        emptyState={
          <EmptyState
            title="No keywords yet"
            description="Every keyword you analyze is saved here, so you can start an article from it later."
            action={
              canGenerate
                ? {
                    label: "Analyze a keyword",
                    href: workspaceRoutes.generate_content(workspaceSlug),
                  }
                : undefined
            }
          />
        }
        onUse={
          canGenerate
            ? (row) =>
                router.push(
                  `${workspaceRoutes.generate_content(workspaceSlug)}?${libraryStartQuery(row.id)}` as Route,
                )
            : undefined
        }
        onRowClick={open}
        rowActions={rowActions}
      />
    </>
  );
}
