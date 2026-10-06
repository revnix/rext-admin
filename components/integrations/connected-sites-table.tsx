"use client";

import { Pause, Play, PlugZap, Settings2, Unplug } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  createDataTableColumnHelper,
  DataTable,
  type DataTableRowAction,
  UNKNOWN,
} from "@/components/ui/data-table";
import { Notice } from "@/components/ui/notice";
import { useSetIntegrationActive } from "@/hooks/use-integrations";
import type { Integration } from "@/lib/api-client/integrations";
import { dateFormat } from "@/lib/formatters/date-formatters";
import { INTEGRATION_MARKS } from "./integration-logos";
import { siteHost } from "./site-host";
import { useSiteTest } from "./use-site-test";

const WordPressMark = INTEGRATION_MARKS.wordpress;

function SiteCell({ site }: { site: Integration }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <WordPressMark aria-hidden className="size-5 shrink-0" />
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{siteHost(site)}</p>
        <p className="truncate text-muted-foreground">WordPress</p>
      </div>
    </div>
  );
}

function StatusBadge({ site }: { site: Integration }) {
  return site.is_active ? (
    <Badge variant="success">Active</Badge>
  ) : (
    <Badge variant="neutral">Paused</Badge>
  );
}

const column = createDataTableColumnHelper<Integration>();
const columns = column.columns([
  column.accessor((row) => siteHost(row), {
    id: "site",
    header: "Site",
    cell: ({ row }) => <SiteCell site={row.original} />,
    sortFn: "text",
    enableHiding: false,
  }),
  column.accessor((row) => (row.is_active ? 0 : 1), {
    id: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge site={row.original} />,
    sortFn: "basic",
    enableGlobalFilter: false,
  }),
  column.accessor((row) => Date.parse(row.created_at) || 0, {
    id: "connected",
    header: "Connected",
    meta: { align: "end", numeric: true },
    cell: ({ row }) => dateFormat.short(row.original.created_at) || UNKNOWN,
    sortFn: "basic",
    enableGlobalFilter: false,
  }),
]);

/**
 * The workspace's connected sites (plans/app/D-pages.md §2.3). A row opens its settings; its menu
 * tests the plugin, pauses or resumes publishing to it, or disconnects it.
 */
export function ConnectedSitesTable({
  workspaceId,
  sites,
  isLoading,
  failed,
  canUpdate,
  canDelete,
  onOpenSettings,
  onDisconnect,
}: {
  workspaceId: string;
  sites: Integration[];
  isLoading: boolean;
  failed: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onOpenSettings: (site: Integration) => void;
  onDisconnect: (site: Integration) => void;
}) {
  const setActive = useSetIntegrationActive(workspaceId);
  const test = useSiteTest(workspaceId);

  const runTest = async (site: Integration) => {
    const host = siteHost(site);
    const id = toast.loading(`Testing ${host}…`);
    const result = await test.run(site);
    if (result.ok) toast.success(`${host}: ${result.message}`, { id });
    else toast.error(`${host}: ${result.message}`, { id });
  };

  const togglePublishing = (site: Integration) => {
    const active = !site.is_active;
    const host = siteHost(site);
    setActive.mutate(
      { siteId: site.id, active },
      {
        onSuccess: () =>
          toast.success(
            active
              ? `Publishing to ${host} again`
              : `Paused: nothing is published to ${host} until you resume`,
          ),
        onError: (error) =>
          toast.error(`${host} didn't change`, {
            description:
              error instanceof Error && error.message
                ? error.message
                : "Try again in a moment.",
          }),
      },
    );
  };

  const rowActions = (site: Integration): DataTableRowAction[] => [
    {
      label: canUpdate ? "Settings" : "View settings",
      icon: Settings2,
      onSelect: () => onOpenSettings(site),
    },
    {
      label: "Test connection",
      icon: PlugZap,
      onSelect: () => void runTest(site),
    },
    ...(canUpdate
      ? [
          site.is_active
            ? {
                label: "Pause publishing",
                icon: Pause,
                onSelect: () => togglePublishing(site),
              }
            : {
                label: "Resume publishing",
                icon: Play,
                onSelect: () => togglePublishing(site),
              },
        ]
      : []),
    ...(canDelete
      ? [
          {
            label: "Disconnect",
            icon: Unplug,
            destructive: true,
            onSelect: () => onDisconnect(site),
          },
        ]
      : []),
  ];

  return (
    <DataTable
      caption="Connected sites"
      columns={columns}
      data={sites}
      getRowId={(row) => row.id}
      getRowLabel={(row) => siteHost(row)}
      isLoading={isLoading}
      skeletonRows={2}
      error={
        failed ? (
          <Notice tone="danger" title="Your sites didn't load">
            Refresh the page to try again.
          </Notice>
        ) : undefined
      }
      rowActions={rowActions}
      onRowClick={onOpenSettings}
      renderCard={(site, { actions }) => (
        <div className="flex items-start gap-3">
          {/* A card is the row on a phone: tapping it opens the settings, as a row's click does. */}
          <button
            type="button"
            onClick={() => onOpenSettings(site)}
            className="flex min-w-0 flex-1 flex-col items-start gap-2 text-left"
          >
            <SiteCell site={site} />
            <span className="flex flex-wrap items-center gap-2 text-muted-foreground">
              <StatusBadge site={site} />
              Connected {dateFormat.short(site.created_at)}
            </span>
          </button>
          {actions}
        </div>
      )}
    />
  );
}
