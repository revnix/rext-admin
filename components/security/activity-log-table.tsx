"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { DownloadAuditLog } from "@/components/security/download-audit-log";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  createDataTableColumnHelper,
  DataTable,
  type DataTableFacet,
  UNKNOWN,
  useDataTableLocalState,
} from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { apiClient } from "@/lib/api-client";
import { dateFormat } from "@/lib/formatters/date-formatters";
import { AuditActions, getActionDisplayName } from "@/types/audit-log";

const PAGE_SIZE = 25;

interface ActivityRow {
  id: string;
  action: string;
  resource_type: string;
  ip_address: string | null;
  user_agent: string | null;
  status?: string;
  created_at: string;
}

/** The events a person can narrow the log to; the backend filters by one at a time. */
const EVENTS = [
  AuditActions.AUTH_LOGIN,
  AuditActions.AUTH_LOGOUT,
  AuditActions.AUTH_PASSWORD_CHANGE,
  AuditActions.AUTH_PASSWORD_RESET,
  AuditActions.USER_CREATE,
  AuditActions.USER_UPDATE,
  AuditActions.USER_DEACTIVATE,
  AuditActions.WORKSPACE_CREATE,
  AuditActions.WORKSPACE_UPDATE,
  AuditActions.WORKSPACE_DELETE,
  AuditActions.INVITATION_CREATE,
  AuditActions.INVITATION_ACCEPT,
  AuditActions.SUBSCRIPTION_CREATED,
  AuditActions.SUBSCRIPTION_UPDATED,
  AuditActions.SUBSCRIPTION_UPGRADED,
  AuditActions.SUBSCRIPTION_DOWNGRADED,
  AuditActions.SUBSCRIPTION_CANCELLED,
  AuditActions.SUBSCRIPTION_RESUMED,
  AuditActions.SUBSCRIPTION_PAUSED,
  AuditActions.SUBSCRIPTION_EXPIRED,
  AuditActions.SUBSCRIPTION_RENEWED,
  AuditActions.PAYMENT_SUCCEEDED,
  AuditActions.PAYMENT_FAILED,
  AuditActions.PAYMENT_RECOVERED,
  AuditActions.PAYMENT_REFUNDED,
  AuditActions.REFUND_REQUESTED,
  AuditActions.REFUND_APPROVED,
  AuditActions.REFUND_REJECTED,
  AuditActions.REFUND_PROCESSED,
  AuditActions.REFUND_FAILED,
  AuditActions.REFUND_CANCELLED,
];

const FACETS: readonly DataTableFacet[] = [
  {
    column: "action",
    title: "What",
    single: true,
    options: EVENTS.map((value) => ({
      value,
      label: getActionDisplayName(value),
    })),
  },
];

function EventName({ row }: { row: ActivityRow }) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="font-medium text-foreground">
        {getActionDisplayName(row.action)}
      </span>
      {row.status === "failed" && <Badge variant="danger">Failed</Badge>}
    </span>
  );
}

const column = createDataTableColumnHelper<ActivityRow>();

// The server sorts (newest first) and pages; the table only shows its page.
const columns = column.columns([
  column.accessor("created_at", {
    id: "created_at",
    header: "When",
    cell: ({ getValue }) => dateFormat.shortWithTime(getValue()) || UNKNOWN,
    enableSorting: false,
    enableHiding: false,
  }),
  column.accessor("action", {
    header: "What",
    cell: ({ row }) => <EventName row={row.original} />,
    enableSorting: false,
    enableHiding: false,
  }),
  column.accessor("ip_address", {
    header: "Where",
    cell: ({ getValue }) => (
      <span className="num">{getValue() || UNKNOWN}</span>
    ),
    enableSorting: false,
  }),
  column.accessor("user_agent", {
    header: "Browser",
    cell: ({ getValue }) => (
      <span className="line-clamp-1 break-all text-muted-foreground">
        {getValue() || UNKNOWN}
      </span>
    ),
    enableSorting: false,
  }),
]);

/**
 * The account's activity log (D8, plans/app/D-pages.md §2.8): what was done, when and from where, 25
 * rows a page, newest first. The backend pages it and narrows it to one kind of event.
 */
export function ActivityLogTable() {
  const state = useDataTableLocalState({ pageSize: PAGE_SIZE });
  const { pageIndex, pageSize } = state.pagination;
  const chosen = state.columnFilters.find((filter) => filter.id === "action")
    ?.value as string[] | undefined;
  const action = chosen?.[0];

  const query = useQuery({
    queryKey: ["audit-logs", "mine", action ?? null, pageIndex, pageSize],
    queryFn: () =>
      apiClient.auditLogs.getMyLogs({
        action,
        limit: pageSize,
        offset: pageIndex * pageSize,
      }),
    placeholderData: keepPreviousData,
    refetchInterval: 60000,
  });

  const rows = useMemo<ActivityRow[]>(
    () => (query.data?.logs ?? []) as ActivityRow[],
    [query.data],
  );

  return (
    <DataTable
      caption="Activity on your account"
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      getRowLabel={(row) =>
        `${getActionDisplayName(row.action)}, ${dateFormat.shortWithTime(row.created_at)}`
      }
      state={state}
      manual={{ rowCount: query.data?.total ?? 0 }}
      isLoading={query.isLoading}
      error={
        query.error ? (
          <div className="flex flex-col items-center gap-3">
            <p>Your activity didn't load.</p>
            <Button variant="outline" size="sm" onClick={() => query.refetch()}>
              Try again
            </Button>
          </div>
        ) : undefined
      }
      emptyState={
        <EmptyState
          title="No activity yet"
          description="Sign-ins, changes to your account and billing events show here."
        />
      }
      facets={FACETS}
      viewOptions
      hiddenColumns={["user_agent"]}
      actions={<DownloadAuditLog filters={{ action }} />}
      pageSizeOptions={[PAGE_SIZE, 50, 100]}
      renderCard={(row) => (
        <div className="flex flex-col gap-1">
          <EventName row={row} />
          <p className="text-sm text-muted-foreground">
            {dateFormat.shortWithTime(row.created_at)}
            {row.ip_address && (
              <>
                {" · "}
                <span className="num">{row.ip_address}</span>
              </>
            )}
          </p>
        </div>
      )}
    />
  );
}
