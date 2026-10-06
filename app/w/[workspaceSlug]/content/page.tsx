"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { createContext, type ReactNode, useContext, useMemo } from "react";
import {
  createDataTableColumnHelper,
  DataTable,
  type DataTableRowAction,
  UNKNOWN,
  useDataTableUrlState,
} from "@/components/ui/data-table";
import {
  ContentStatusBadge,
  contentStatusLabel,
} from "@/components/content/content-status-badge";
import { ListPage } from "@/components/layouts";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useConfirmation } from "@/components/ui/confirmation-dialog";
import { Notice } from "@/components/ui/notice";
import { EmptyState } from "@/components/ui/empty-state";
import { useAllContent, useTrashContent } from "@/hooks/use-content";
import { usePersonas } from "@/hooks/use-personas";
import { usePageTitle } from "@/hooks/use-page-title";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { dateFormat } from "@/lib/formatters/date-formatters";
import { CONTENT_PERMISSIONS } from "@/lib/permissions";
import { workspaceRoutes } from "@/lib/routes";
import {
  CONTENT_LIST_FACETS,
  CONTENT_LIST_STATUSES,
  contentListParams,
} from "@/lib/search-params/content";
import { useWorkspace } from "@/providers/workspace-provider";
import type { ContentItem } from "@/types/content";

function ContentTitle({ item }: { item: ContentItem }) {
  const { workspaceSlug } = useWorkspace();
  return (
    <Link
      href={workspaceRoutes.contentDetail(workspaceSlug, item.id) as Route}
      className="line-clamp-2 rounded-sm font-medium text-foreground underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
    >
      {item.title || "Untitled"}
    </Link>
  );
}

/**
 * The sites an article went out to: each publishing result's site by name, the unnamed ones counted by
 * their site id, else WordPress for an older row.
 */
function publishedTo(item: ContentItem): string[] {
  const sent = (item.publishing_results ?? []).filter(
    (result) =>
      result.external_url ||
      result.status === "published" ||
      result.status === "synced",
  );
  const named = new Set(
    sent.flatMap((result) => (result.site_name ? [result.site_name] : [])),
  );
  const unnamed = new Set(
    sent.filter((result) => !result.site_name).map((result) => result.site_id),
  ).size;
  const sites = [...named];
  if (unnamed > 0)
    sites.push(
      unnamed === 1 ? "A connected site" : `${unnamed} connected sites`,
    );
  if (sites.length === 0 && item.wordpress_url) sites.push("WordPress");
  return sites;
}

function updatedAt(item: ContentItem): string {
  return item.updated_at || item.created_at;
}

/** The workspace's persona names by id, for the module-scope columns to read. */
/** `null` until the workspace's personas have loaded, so a missing name isn't taken for a removed one. */
const PersonaNames = createContext<ReadonlyMap<string, string> | null>(null);

function PersonaName({ id }: { id: string }) {
  const names = useContext(PersonaNames);
  if (!id || !names) return UNKNOWN;
  return (
    <span className="truncate">{names.get(id) ?? "A removed persona"}</span>
  );
}

const column = createDataTableColumnHelper<ContentItem>();

const columns = column.columns([
  column.accessor("title", {
    header: "Title",
    cell: ({ row }) => <ContentTitle item={row.original} />,
    sortFn: "text",
    enableHiding: false,
    enableGlobalFilter: true,
  }),
  column.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => <ContentStatusBadge status={getValue()} />,
    filterFn: "arrHas",
    enableGlobalFilter: false,
  }),
  // No Type, Words or Platform column: the backend stopped returning an article's metadata
  // (content_metadata) in February, so they read "—" for every article (D2b #466). The type comes
  // back when the backend stores it.
  column.accessor((item) => item.persona_id ?? "", {
    id: "persona",
    header: "Author persona",
    cell: ({ getValue }) => <PersonaName id={getValue()} />,
    filterFn: "arrHas",
    enableGlobalFilter: false,
  }),
  column.accessor((item) => Date.parse(updatedAt(item)) || 0, {
    id: "updated_at",
    header: "Updated",
    meta: { align: "end", numeric: true },
    cell: ({ row }) => dateFormat.short(updatedAt(row.original)) || UNKNOWN,
    sortFn: "basic",
    enableGlobalFilter: false,
  }),
  column.accessor((item) => publishedTo(item).join(", "), {
    id: "published_to",
    header: "Published to",
    cell: ({ getValue }) => getValue() || UNKNOWN,
    enableGlobalFilter: true,
  }),
  column.accessor(
    (item) => item.seo_data?.seo_score ?? item.seo_data?.content_seo_score,
    {
      id: "seo",
      header: "SEO score",
      meta: { align: "end", numeric: true },
      cell: ({ getValue }) => getValue() ?? UNKNOWN,
      sortUndefined: "last",
      enableGlobalFilter: false,
    },
  ),
  column.accessor((item) => Date.parse(item.created_at) || 0, {
    id: "created_at",
    header: "Created",
    meta: { align: "end", numeric: true },
    cell: ({ row }) => dateFormat.short(row.original.created_at) || UNKNOWN,
    sortFn: "basic",
    enableGlobalFilter: false,
  }),
]);

// A stable empty list while the content loads: a new [] on each render would rebuild the rows.
const NO_CONTENT: ContentItem[] = [];

// The facet offers only the statuses the URL accepts, so a chosen one survives a reload.
const STATUS_FACET = [
  {
    column: "status",
    title: "Status",
    options: CONTENT_LIST_STATUSES.map((value) => ({
      value,
      label: contentStatusLabel(value),
    })),
  },
];

// In the view menu, not on the screen at first: the library's columns are the goal's (D2 #233).
const HIDDEN_COLUMNS = ["seo", "created_at"];

/** A row as a card under 640 px: the title, its status, then when it last changed. */
function ContentRowCard({
  item,
  actions,
  select,
}: {
  item: ContentItem;
  actions: ReactNode;
  select: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      {select}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <ContentTitle item={item} />
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
          <ContentStatusBadge status={item.status} />
          <span className="num">{dateFormat.short(updatedAt(item))}</span>
        </div>
      </div>
      {actions}
    </div>
  );
}

/**
 * The workspace's content list. The page's header stays while it loads: the loader and the errors
 * render inside the list layout, and permissions and the workspace are checked before the list.
 */
export default function WorkspaceContentPage() {
  const { workspace, workspaceSlug } = useWorkspace();
  // The search, the statuses, the sort and the page live in the URL (?q=…&status=draft&page=2).
  const tableState = useDataTableUrlState(contentListParams, {
    facets: CONTENT_LIST_FACETS,
  });

  // Canonical workspace UUID for query keys and mutation payloads — the
  // content editor invalidates ["content", <uuid>]; keying these queries by
  // the URL slug meant the invalidation never matched (finding #10).
  const workspaceId = workspace?.id || "";

  // Workspace permissions
  const { hasPermission: canCreateContent, isLoading: isCreateLoading } =
    useWorkspacePermission(CONTENT_PERMISSIONS.CREATE, workspaceId);
  const { isLoading: isUpdateLoading } = useWorkspacePermission(
    CONTENT_PERMISSIONS.UPDATE,
    workspaceId,
  );
  const { hasPermission: canDeleteContent, isLoading: isDeleteLoading } =
    useWorkspacePermission(CONTENT_PERMISSIONS.DELETE, workspaceId);

  const isPermissionLoading =
    isCreateLoading || isUpdateLoading || isDeleteLoading;

  // Update page title and description
  usePageTitle(
    `Content Library - ${workspace?.name || "Workspace"}`,
    `Manage published and scheduled content for ${
      workspace?.name || "this workspace"
    }.`,
  );

  // Every item: the table searches, filters and sorts them in the browser.
  const {
    data: content = NO_CONTENT,
    isLoading: isContentLoading,
    error,
  } = useAllContent(workspaceId);

  const { data: personaList, isSuccess: personasLoaded } = usePersonas(
    workspaceId || null,
  );
  const personaNames = useMemo(
    () =>
      new Map(
        (personaList?.personas ?? [])
          .filter((persona) => persona.id)
          .map((persona) => [persona.id as string, persona.name]),
      ),
    [personaList],
  );

  // Status from the backend's list; persona from the workspace.
  const facets = useMemo(() => {
    return [
      ...STATUS_FACET,
      {
        column: "persona",
        title: "Persona",
        options: [...personaNames].map(([value, label]) => ({
          value,
          label,
        })),
      },
    ];
  }, [personaNames]);

  const trashContentMutation = useTrashContent();
  const { confirm, ConfirmationComponent } = useConfirmation();

  // Asks first: there is no undo until the backend can restore from the trash (G45 #397).
  const moveToTrash = async (items: ContentItem[], done?: () => void) => {
    const one = items.length === 1;
    const confirmed = await confirm({
      title: one
        ? "Move this article to the trash?"
        : `Move ${items.length} articles to the trash?`,
      description: one
        ? `"${items[0].title || "Untitled"}" leaves the library.`
        : "They leave the library.",
      confirmText: "Move to trash",
      cancelText: one ? "Keep article" : "Keep them",
      variant: "destructive",
    });
    if (!confirmed) return;
    const { failed } = await trashContentMutation.mutateAsync({
      workspaceId,
      contentIds: items.map((item) => item.id),
    });
    // Keep the selection when some failed, so the toast's "try them again" is one click away.
    if (failed === 0) done?.();
  };

  const rowActions = (item: ContentItem): DataTableRowAction[] => [
    {
      label: "Open",
      href: workspaceRoutes.contentDetail(workspaceSlug, item.id),
    },
    ...(canDeleteContent
      ? [
          {
            label: "Move to trash",
            icon: Trash2,
            destructive: true,
            onSelect: () => void moveToTrash([item]),
          },
        ]
      : []),
  ];

  const bulkActions = canDeleteContent
    ? (selected: ContentItem[], clearSelection: () => void) => (
        <Button
          size="sm"
          variant="outline"
          disabled={trashContentMutation.isPending}
          onClick={() => void moveToTrash(selected, clearSelection)}
        >
          <Trash2 />
          Move to trash
        </Button>
      )
    : undefined;

  const generateLink = canCreateContent ? (
    <Button asChild>
      <Link href={workspaceRoutes.generate_content(workspaceSlug) as Route}>
        <Plus />
        Generate content
      </Link>
    </Button>
  ) : null;

  return (
    <ListPage
      title="Content"
      description={`Every article in ${workspace?.name || "this workspace"}: drafts, scheduled and published.`}
      actions={generateLink}
    >
      {/* Inline loader inside the layout */}
      {isPermissionLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <PermissionGuard
          permission={CONTENT_PERMISSIONS.READ}
          fallback={
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">
                  Access Denied
                </CardTitle>
                <CardDescription>
                  You don't have permission to view content in this workspace.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Required permission:{" "}
                  <code className="text-xs bg-muted px-1 rounded-md">
                    content:read
                  </code>
                </p>
              </CardContent>
            </Card>
          }
        >
          <PersonaNames.Provider value={personasLoaded ? personaNames : null}>
            <DataTable
              caption="Content"
              columns={columns}
              data={content}
              getRowId={(item) => item.id}
              getRowLabel={(item) => item.title || "Untitled"}
              state={tableState}
              isLoading={isContentLoading}
              error={
                error ? (
                  <Notice tone="danger" title="Content didn't load">
                    Reload the page to try again.
                  </Notice>
                ) : undefined
              }
              emptyState={
                <EmptyState
                  title="No content yet"
                  description="Articles you generate in this workspace appear here."
                  action={
                    canCreateContent
                      ? {
                          label: "Generate content",
                          href: workspaceRoutes.generate_content(workspaceSlug),
                        }
                      : undefined
                  }
                />
              }
              search={{ placeholder: "Search content" }}
              facets={facets}
              viewOptions
              hiddenColumns={HIDDEN_COLUMNS}
              rowActions={rowActions}
              bulkActions={bulkActions}
              renderCard={(item, { actions, select }) => (
                <ContentRowCard item={item} actions={actions} select={select} />
              )}
            />
          </PersonaNames.Provider>
          {ConfirmationComponent}
        </PermissionGuard>
      )}
    </ListPage>
  );
}
