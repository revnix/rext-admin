"use client";

import { Eye } from "lucide-react";
import { useState } from "react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  createDataTableColumnHelper,
  DataTable,
  type DataTableFacet,
  type DataTableRowAction,
  type DataTableState,
  UNKNOWN,
} from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { dateFormat } from "@/lib/formatters/date-formatters";
import {
  AUDIT_LOG_ACTION_AREAS,
  AUDIT_LOG_RESOURCE_TYPES,
} from "@/lib/search-params/admin-audit-logs";

export interface AuditLog {
  id: string;
  user_id?: string | null;
  full_name?: string | null;
  user_email?: string | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  workspace_id?: string | null;
  ip_address?: string | null;
  status?: string | null;
  created_at: string;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

interface AuditLogsTableProps {
  /** The current page of entries. */
  logs: AuditLog[];
  /** Every entry the search and the filters match, across the pages. */
  total: number;
  isLoading: boolean;
  /** The search, the filters and the page, from the URL; the server applies them. */
  state: DataTableState;
}

// The outcome as a word. Success is the norm and stays neutral; only an outcome that needs a second look
// takes a status tint.
const STATUS_TINT: Readonly<Record<string, BadgeProps["variant"]>> = {
  failed: "danger",
  partial: "warning",
};

// Most actions are routine and read as a neutral word; colour only for what needs a second look.
const ACTION_TINT: Readonly<Record<string, BadgeProps["variant"]>> = {
  cancel: "danger",
  cancelled: "danger",
  delete: "danger",
  deleted: "danger",
  failed: "danger",
  rejected: "danger",
  impersonate: "warning",
};

function StatusBadge({ status }: { status?: string | null }) {
  const value = status || "unknown";
  return (
    <Badge variant={STATUS_TINT[value] ?? "neutral"}>
      {value.charAt(0).toUpperCase() + value.slice(1)}
    </Badge>
  );
}

function ActionBadge({ action }: { action: string }) {
  const actionType = action.split(".").pop() || "";
  return <Badge variant={ACTION_TINT[actionType] ?? "neutral"}>{action}</Badge>;
}

function UserCell({ log }: { log: AuditLog }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-medium text-foreground">
        {log.full_name || "System"}
      </p>
      {log.user_email && (
        <p className="truncate text-muted-foreground">{log.user_email}</p>
      )}
    </div>
  );
}

const ACTION_AREA_LABELS: Record<
  (typeof AUDIT_LOG_ACTION_AREAS)[number],
  string
> = {
  user: "User actions",
  workspace: "Workspace actions",
  content: "Content actions",
  subscription: "Subscription actions",
};

const RESOURCE_TYPE_LABELS: Record<
  (typeof AUDIT_LOG_RESOURCE_TYPES)[number],
  string
> = {
  user: "User",
  workspace: "Workspace",
  content: "Content",
  subscription: "Subscription",
  role: "Role",
};

// One action area and one resource type at a time, as the backend takes them.
const FACETS: readonly DataTableFacet[] = [
  {
    column: "action",
    title: "Action",
    single: true,
    options: AUDIT_LOG_ACTION_AREAS.map((value) => ({
      value,
      label: ACTION_AREA_LABELS[value],
    })),
  },
  {
    column: "resource",
    title: "Resource",
    single: true,
    options: AUDIT_LOG_RESOURCE_TYPES.map((value) => ({
      value,
      label: RESOURCE_TYPE_LABELS[value],
    })),
  },
];

const column = createDataTableColumnHelper<AuditLog>();

// The server searches, filters and pages; the table only draws the page.
const columns = column.columns([
  column.accessor("created_at", {
    header: "Timestamp",
    cell: ({ getValue }) => (
      <span className="whitespace-nowrap">
        {dateFormat.shortWithTime(getValue()) || UNKNOWN}
      </span>
    ),
    enableSorting: false,
  }),
  column.accessor((log) => log.user_email ?? "", {
    id: "user",
    header: "User",
    cell: ({ row }) => <UserCell log={row.original} />,
    enableSorting: false,
  }),
  column.accessor("action", {
    header: "Action",
    cell: ({ getValue }) => <ActionBadge action={getValue()} />,
    enableSorting: false,
  }),
  column.accessor("resource_type", {
    id: "resource",
    header: "Resource",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p>{row.original.resource_type}</p>
        {row.original.resource_id && (
          <p className="num font-mono text-muted-foreground">
            {row.original.resource_id.slice(0, 8)}…
          </p>
        )}
      </div>
    ),
    enableSorting: false,
  }),
  column.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => <StatusBadge status={getValue()} />,
    enableSorting: false,
  }),
  column.accessor("ip_address", {
    header: "IP address",
    cell: ({ getValue }) => (
      <span className="num font-mono text-muted-foreground">
        {getValue() || UNKNOWN}
      </span>
    ),
    enableSorting: false,
  }),
]);

export function AuditLogsTable({
  logs,
  total,
  isLoading,
  state,
}: AuditLogsTableProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const rowActions = (log: AuditLog): DataTableRowAction[] => [
    {
      label: "View details",
      icon: Eye,
      onSelect: () => setSelectedLog(log),
    },
  ];

  return (
    <>
      <DataTable
        caption="Audit trail"
        columns={columns}
        data={logs}
        getRowId={(log) => log.id}
        getRowLabel={(log) =>
          `${log.action} by ${log.user_email || "System"}, ${dateFormat.shortWithTime(log.created_at)}`
        }
        state={state}
        manual={{ rowCount: total }}
        isLoading={isLoading}
        surface="plain"
        search={{ placeholder: "Search by user email" }}
        facets={FACETS}
        rowActions={rowActions}
        emptyState={
          <EmptyState
            title="No audit logs yet"
            description="Admin actions and system events show here."
          />
        }
        renderCard={(log, { actions }) => (
          <div className="flex items-start gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <UserCell log={log} />
              <div className="flex flex-wrap items-center gap-2">
                <ActionBadge action={log.action} />
                <StatusBadge status={log.status} />
              </div>
              <p className="text-muted-foreground">
                {dateFormat.shortWithTime(log.created_at) || UNKNOWN} ·{" "}
                {log.resource_type}
              </p>
            </div>
            {actions}
          </div>
        )}
      />

      {/* Detail Dialog */}
      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Audit Log Details</DialogTitle>
              <DialogDescription>
                {dateFormat.shortWithTime(selectedLog.created_at)} •{" "}
                {selectedLog.user_email || "System"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium">Action</div>
                  <div className="mt-1">
                    <ActionBadge action={selectedLog.action} />
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Status</div>
                  <div className="mt-1">
                    <StatusBadge status={selectedLog.status} />
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Resource Type</div>
                  <p className="mt-1 text-sm">{selectedLog.resource_type}</p>
                </div>
                <div>
                  <div className="text-sm font-medium">Resource ID</div>
                  <p className="mt-1 text-sm font-mono text-muted-foreground">
                    {selectedLog.resource_id || UNKNOWN}
                  </p>
                </div>
                <div>
                  <div className="text-sm font-medium">IP Address</div>
                  <p className="mt-1 text-sm font-mono">
                    {selectedLog.ip_address || UNKNOWN}
                  </p>
                </div>
                <div>
                  <div className="text-sm font-medium">Workspace ID</div>
                  <p className="mt-1 text-sm font-mono text-muted-foreground">
                    {selectedLog.workspace_id || UNKNOWN}
                  </p>
                </div>
              </div>

              {selectedLog.metadata &&
                Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <div className="text-sm font-medium">Metadata</div>
                    <pre className="mt-1 p-4 bg-muted rounded-md text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}

              {selectedLog.old_values &&
                Object.keys(selectedLog.old_values).length > 0 && (
                  <div>
                    <div className="text-sm font-medium">Old Values</div>
                    <pre className="mt-1 p-4 bg-muted rounded-md text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.old_values, null, 2)}
                    </pre>
                  </div>
                )}

              {selectedLog.new_values &&
                Object.keys(selectedLog.new_values).length > 0 && (
                  <div>
                    <div className="text-sm font-medium">New Values</div>
                    <pre className="mt-1 p-4 bg-muted rounded-md text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.new_values, null, 2)}
                    </pre>
                  </div>
                )}

              <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={() => setSelectedLog(null)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
