"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import {
  RecoveryReviewDialog,
  type RecoveryReviewAction,
} from "@/components/admin/users/recovery-review-dialog";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorPage } from "@/components/ui/error-states";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermission } from "@/hooks/use-permission";
import { apiClient } from "@/lib/api-client";
import type {
  AccountRecoveryRequest,
  RecoveryRequestStatus,
} from "@/lib/api-client/account-recovery";
import { USER_PERMISSIONS } from "@/lib/permissions";
import type { Column, RowAction } from "@/types/data-table";

interface AccountRecoveryTableProps {
  active: boolean;
}

type StatusFilter = RecoveryRequestStatus | "all";

interface RecoveryRow extends Record<string, unknown> {
  id: string;
  email: string;
  name: string;
  status: RecoveryRequestStatus;
  created_at: string | null;
  reviewed_at: string | null;
  reviewer: string | null;
}

type RecoveryDialogState =
  | { type: "closed" }
  | {
      type: "review";
      request: AccountRecoveryRequest;
      action: RecoveryReviewAction;
    };

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function statusBadge(status: RecoveryRequestStatus) {
  const map: Record<
    RecoveryRequestStatus,
    {
      variant: "default" | "secondary" | "destructive" | "outline";
      text: string;
    }
  > = {
    pending: { variant: "outline", text: "Pending" },
    approved: { variant: "default", text: "Approved" },
    rejected: { variant: "destructive", text: "Rejected" },
  };
  const cfg = map[status];
  return <Badge variant={cfg.variant}>{cfg.text}</Badge>;
}

export function AccountRecoveryTable({ active }: AccountRecoveryTableProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dialogState, setDialogState] = useState<RecoveryDialogState>({
    type: "closed",
  });

  const canReview = usePermission(USER_PERMISSIONS.UPDATE);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-account-recovery", statusFilter, page, pageSize],
    queryFn: () =>
      apiClient.accountRecovery.list({
        status: statusFilter,
        page,
        per_page: pageSize,
      }),
    enabled: active,
  });

  const requests = data?.requests ?? [];
  const counts = data?.counts;
  const findRequest = (id: string) => requests.find((r) => r.id === id) ?? null;
  const closeDialog = () => setDialogState({ type: "closed" });

  const rows: RecoveryRow[] = requests.map((r) => ({
    id: r.id,
    email: r.email,
    name: r.user?.display_name || r.user?.full_name || r.email,
    status: r.status,
    created_at: r.created_at,
    reviewed_at: r.reviewed_at,
    reviewer: r.reviewed_by?.full_name || r.reviewed_by?.email || null,
  }));

  const columns: Column<RecoveryRow>[] = [
    {
      key: "name",
      header: "Requester",
      cell: (value, row) => (
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{value as string}</p>
          <p className="text-[11px] text-muted-foreground truncate">
            {row.email}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "110px",
      cell: (value) => statusBadge(value as RecoveryRequestStatus),
    },
    {
      key: "created_at",
      header: "Requested",
      width: "120px",
      cell: (value) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(value as string | null)}
        </span>
      ),
    },
    {
      key: "reviewed_at",
      header: "Reviewed",
      width: "150px",
      cell: (value, row) => (
        <div className="min-w-0">
          <span className="text-xs text-muted-foreground block">
            {formatDate(value as string | null)}
          </span>
          {row.reviewer && (
            <span className="text-[10px] text-muted-foreground/70 block truncate">
              by {row.reviewer}
            </span>
          )}
        </div>
      ),
    },
  ];

  const rowActions: RowAction<RecoveryRow>[] = canReview
    ? [
        {
          label: "Approve",
          icon: <CheckCircle2 className="h-4 w-4" />,
          primary: true,
          disabled: (row: RecoveryRow) => row.status !== "pending",
          onClick: (row: RecoveryRow) => {
            const request = findRequest(row.id);
            if (request)
              setDialogState({ type: "review", request, action: "approve" });
          },
        },
        {
          label: "Reject",
          icon: <XCircle className="h-4 w-4" />,
          variant: "destructive" as const,
          disabled: (row: RecoveryRow) => row.status !== "pending",
          onClick: (row: RecoveryRow) => {
            const request = findRequest(row.id);
            if (request)
              setDialogState({ type: "review", request, action: "reject" });
          },
        },
      ]
    : [];

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
              setPage(1);
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
            columns={columns}
            data={rows}
            isLoading={isLoading}
            rowActions={rowActions}
            mobileCards
            manualPagination
            page={page}
            totalCount={data?.pagination?.total ?? 0}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            showSearch={false}
            emptyTitle="No recovery requests"
            emptyDescription="Nothing to review in this view."
            pageSize={pageSize}
            pageSizeOptions={[10, 25, 50, 100]}
            tableId="admin-account-recovery"
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
