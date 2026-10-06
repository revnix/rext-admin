"use client";

import { AlertCircle, Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import {
  createDataTableColumnHelper,
  DataTable,
  type DataTableRowAction,
  UNKNOWN,
  useDataTableUrlState,
} from "@/components/ui/data-table";
import { ListPage } from "@/components/layouts";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useConfirmation } from "@/components/ui/confirmation-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useAllContent, useDeleteContent } from "@/hooks/use-content";
import { usePageTitle } from "@/hooks/use-page-title";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { dateFormat } from "@/lib/formatters/date-formatters";
import { CONTENT_PERMISSIONS } from "@/lib/permissions";
import { workspaceRoutes } from "@/lib/routes";
import {
  CONTENT_LIST_FACETS,
  CONTENT_LIST_STATUS_LABELS,
  CONTENT_LIST_STATUSES,
  contentListParams,
} from "@/lib/search-params/content";
import { useWorkspace } from "@/providers/workspace-provider";
import type { ContentItem } from "@/types/content";

// The words for every status a row can hold: the backend's, and the older ones still in its data.
const STATUS_LABELS: Readonly<Record<string, string>> = {
  ...CONTENT_LIST_STATUS_LABELS,
  generated: "Generated",
  cancelled: "Cancelled",
};

// A tint only for a status worth noticing (design/app-language.md §2); the rest stay neutral.
const STATUS_TINT: Readonly<Record<string, BadgeProps["variant"]>> = {
  published: "success",
  scheduled: "info",
  review: "warning",
  failed: "danger",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_TINT[status] ?? "neutral"}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

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
    cell: ({ getValue }) => <StatusBadge status={getValue()} />,
    filterFn: "arrHas",
    enableGlobalFilter: false,
  }),
  column.accessor((item) => item.content_metadata?.content_type ?? "", {
    id: "type",
    header: "Type",
    enableGlobalFilter: true,
  }),
  // Hidden at first, and searched: the old library found an article by its platform.
  column.accessor((item) => item.content_metadata?.target_platform ?? "", {
    id: "platform",
    header: "Platform",
    enableGlobalFilter: true,
  }),
  column.accessor((item) => item.content_metadata?.content_word_count, {
    id: "words",
    header: "Words",
    meta: { align: "end", numeric: true },
    cell: ({ getValue }) => getValue()?.toLocaleString("en-US") ?? UNKNOWN,
    sortUndefined: "last",
    enableGlobalFilter: false,
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
      label: STATUS_LABELS[value],
    })),
  },
];

const HIDDEN_COLUMNS = ["platform"];

/** A row as a card under 640 px: the title, its status, then what it is and when it was made. */
function ContentRowCard({
  item,
  actions,
}: {
  item: ContentItem;
  actions: ReactNode;
}) {
  const words = item.content_metadata?.content_word_count;
  const details = [
    item.content_metadata?.content_type,
    words ? `${words.toLocaleString("en-US")} words` : null,
    dateFormat.short(item.created_at),
  ].filter(Boolean);
  return (
    <div className="flex items-start gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <ContentTitle item={item} />
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
          <StatusBadge status={item.status} />
          <span className="num">{details.join(" · ")}</span>
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

  const deleteContentMutation = useDeleteContent();
  const { confirm, ConfirmationComponent } = useConfirmation();

  const handleDelete = async (item: ContentItem) => {
    const confirmed = await confirm({
      title: "Delete this article?",
      description: `"${item.title || "Untitled"}" is removed from the library.`,
      confirmText: "Delete",
      variant: "destructive",
    });
    if (!confirmed) return;
    await deleteContentMutation.mutateAsync({
      workspaceId,
      contentId: item.id,
    });
  };

  const rowActions = (item: ContentItem): DataTableRowAction[] => [
    {
      label: "Open",
      href: workspaceRoutes.contentDetail(workspaceSlug, item.id),
    },
    ...(canDeleteContent
      ? [
          {
            label: "Delete",
            icon: Trash2,
            destructive: true,
            onSelect: () => void handleDelete(item),
          },
        ]
      : []),
  ];

  const generateLink = canCreateContent ? (
    <Button asChild>
      <Link href={workspaceRoutes.generate_content(workspaceSlug) as Route}>
        <Plus />
        Generate Content
      </Link>
    </Button>
  ) : null;

  return (
    <ListPage
      title="Generated Content"
      description={`View, edit, and manage AI-generated content for ${
        workspace?.name || "this workspace"
      }.`}
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
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to load content. Please try again.
                  </AlertDescription>
                </Alert>
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
            facets={STATUS_FACET}
            viewOptions
            hiddenColumns={HIDDEN_COLUMNS}
            rowActions={rowActions}
            renderCard={(item, { actions }) => (
              <ContentRowCard item={item} actions={actions} />
            )}
          />
          {ConfirmationComponent}
        </PermissionGuard>
      )}
    </ListPage>
  );
}
