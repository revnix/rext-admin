"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import {
  RecoveryReviewDialog,
  type RecoveryReviewAction,
} from "@/components/admin/users/recovery-review-dialog";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createDataTableColumnHelper,
  DataTable,
  type DataTableRowAction,
  UNKNOWN,
  useDataTableLocalState,
} from "@/components/ui/data-table";
import { ErrorPage } from "@/components/ui/error-states";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermission } from "@/hooks/use-permission";
import { apiClient } from "@/lib/api-client";
import type {
  AccountRecoveryRequest,
  RecoveryRequestStatus,
} from "@/lib/api-client/account-recovery";
import { dateFormat } from "@/lib/formatters/date-formatters";
import { USER_PERMISSIONS } from "@/lib/permissions";

interface AccountRecoveryTableProps {
  active: boolean;
}

type StatusFilter = RecoveryRequestStatus | "all";

type RecoveryDialogState =
  | { type: "closed" }
  | {
      type: "review";
      request: AccountRecoveryRequest;
      action: RecoveryReviewAction;
    };

const STATUS: Record<
  RecoveryRequestStatus,
  { variant: BadgeProps["variant"]; text: string }
> = {
  pending: { variant: "warning", text: "Pending" },
  approved: { variant: "success", text: "Approved" },
  rejected: { variant: "neutral", text: "Rejected" },
};

const requesterName = (r: AccountRecoveryRequest) =>
  r.user?.display_name || r.user?.full_name || r.email;

const column = createDataTableColumnHelper<AccountRecoveryRequest>();

// The backend pages these requests and sorts them itself (newest first), so no column sorts.
const columns = column.columns([
  column.accessor(requesterName, {
    id: "name",
    header: "Requester",
    cell: ({ row, getValue }) => (
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{getValue()}</p>
        <p className="truncate text-muted-foreground">{row.original.email}</p>
      </div>
    ),
    enableSorting: false,
  }),
  column.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => {
      const status = STATUS[getValue()];
      return <Badge variant={status.variant}>{status.text}</Badge>;
    },
    enableSorting: false,
  }),
  column.accessor("created_at", {
    header: "Requested",
    meta: { align: "end", numeric: true },
    cell: ({ getValue }) => dateFormat.short(getValue()) || UNKNOWN,
    enableSorting: false,
  }),
  column.accessor("reviewed_at", {
    header: "Reviewed",
    meta: { align: "end", numeric: true },
    cell: ({ row, getValue }) => {
      const reviewer =
        row.original.reviewed_by?.full_name || row.original.reviewed_by?.email;
      return (
        <div className="min-w-0">
          <span className="block">
            {dateFormat.short(getValue()) || UNKNOWN}
          </span>
          {reviewer && (
            <span className="block truncate text-xs text-muted-foreground">
              by {reviewer}
            </span>
          )}
        </div>
      );
    },
    enableSorting: false,
  }),
]);

const NO_REQUESTS: AccountRecoveryRequest[] = [];

export function AccountRecoveryTable({ active }: AccountRecoveryTableProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const tableState = useDataTableLocalState({ pageSize: 10 });
  const { pageIndex, pageSize } = tableState.pagination;
  const [dialogState, setDialogState] = useState<RecoveryDialogState>({
    type: "closed",
  });

  const canReview = usePermission(USER_PERMISSIONS.UPDATE);

  // The server pages and filters this list: the table shows one page and its total.
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-account-recovery", statusFilter, pageIndex + 1, pageSize],
    queryFn: () =>
      apiClient.accountRecovery.list({
        status: statusFilter,
        page: pageIndex + 1,
        per_page: pageSize,
      }),
    enabled: active,
  });

  const requests = data?.requests ?? NO_REQUESTS;
  const counts = data?.counts;
  const closeDialog = () => setDialogState({ type: "closed" });

  const rowActions = (
    request: AccountRecoveryRequest,
  ): DataTableRowAction[] => {
    if (!canReview) return [];
    const decided =
      request.status === "pending" ? false : "This request is already decided";
    return [
      {
        label: "Approve",
        icon: CheckCircle2,
        disabled: decided,
        onSelect: () =>
          setDialogState({ type: "review", request, action: "approve" }),
      },
      {
        label: "Reject",
        icon: XCircle,
        destructive: true,
        disabled: decided,
        onSelect: () =>
          setDialogState({ type: "review", request, action: "reject" }),
      },
    ];
  };

  const tabCount = (key: StatusFilter) => {
    if (!counts) return null;
    const n = key === "all" ? counts.all : counts[key];
    return typeof n === "number" ? ` (${n})` : null;
  };

  if (error) {
    return (
      <ErrorPage
        title="Failed to load recovery requests"
        message="There was an error loading account recovery requests. Please try again."
        retry={() => refetch()}
      />
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Account Recovery</CardTitle>
          <CardDescription>
            Recovery requests from deleted or deactivated accounts. Approving
            restores the account; the requester is emailed either outcome.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as StatusFilter);
              tableState.onPaginationChange((p) => ({ ...p, pageIndex: 0 }));
            }}
          >
            <TabsList>
              <TabsTrigger value="pending">
                Pending{tabCount("pending")}
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved{tabCount("approved")}
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected{tabCount("rejected")}
              </TabsTrigger>
              <TabsTrigger value="all">All{tabCount("all")}</TabsTrigger>
            </TabsList>
          </Tabs>

          <DataTable
            caption="Account recovery requests"
            columns={columns}
            data={requests}
            getRowId={(request) => request.id}
            getRowLabel={requesterName}
            state={tableState}
            manual={{ rowCount: data?.pagination?.total ?? 0 }}
            isLoading={isLoading}
            surface="plain"
            rowActions={rowActions}
            emptyState={
              <p className="py-8 text-center text-sm text-muted-foreground">
                No recovery requests: nothing to review in this view.
              </p>
            }
            renderCard={(request, { actions }) => (
              <div className="flex items-start gap-3">
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <p className="truncate font-medium text-foreground">
                    {requesterName(request)}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                    <Badge variant={STATUS[request.status].variant}>
                      {STATUS[request.status].text}
                    </Badge>
                    <span className="num">
                      {dateFormat.short(request.created_at) || UNKNOWN}
                    </span>
                  </div>
                </div>
                {actions}
              </div>
            )}
          />
        </CardContent>
      </Card>

      <RecoveryReviewDialog
        open={dialogState.type === "review"}
        onOpenChange={closeDialog}
        request={dialogState.type === "review" ? dialogState.request : null}
        action={dialogState.type === "review" ? dialogState.action : null}
      />
    </>
  );
}
