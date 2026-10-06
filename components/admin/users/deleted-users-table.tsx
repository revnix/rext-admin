"use client";

import { useQuery } from "@tanstack/react-query";
import { RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { RestoreUserDialog } from "@/components/admin/users/restore-user-dialog";
import { PermanentDeleteUserDialog } from "@/components/admin/users/permanent-delete-user-dialog";
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
import { usePermission } from "@/hooks/use-permission";
import { apiClient } from "@/lib/api-client";
import type { User } from "@/lib/api-client/users";
import { USER_PERMISSIONS } from "@/lib/permissions";
import type { Column, RowAction } from "@/types/data-table";

interface DeletedUserRow extends Record<string, unknown> {
  id: string;
  name: string;
  email: string;
  display_role: string;
  deleted_at: string | null | undefined;
}

interface DeletedUsersTableProps {
  active: boolean;
  viewerIsSuperAdmin: boolean;
}

type DeletedDialogState =
  | { type: "closed" }
  | { type: "restore"; user: User }
  | { type: "permanentDelete"; user: User };

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

export function DeletedUsersTable({
  active,
  viewerIsSuperAdmin,
}: DeletedUsersTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dialogState, setDialogState] = useState<DeletedDialogState>({
    type: "closed",
  });

  const canRestore = usePermission(USER_PERMISSIONS.UPDATE);
  const canPermanentlyDelete = usePermission(USER_PERMISSIONS.DELETE);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-users-deleted", page, pageSize],
    queryFn: () => apiClient.users.listDeleted({ page, per_page: pageSize }),
    enabled: active,
  });

  const users = data?.users ?? [];
  const findUser = (id: string) => users.find((u) => u.id === id) ?? null;
  const closeDialog = () => setDialogState({ type: "closed" });

  const rows: DeletedUserRow[] = users.map((u) => ({
    id: u.id,
    name: u.display_name || u.full_name || u.email,
    email: u.email,
    display_role: u.display_role || "User",
    deleted_at: u.deleted_at,
  }));

  const columns: Column<DeletedUserRow>[] = [
    {
      key: "name",
      header: "User",
      cell: (value, row) => (
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{value as string}</p>
          <p className="text-caption text-muted-foreground truncate">
            {row.email}
          </p>
        </div>
      ),
    },
    {
      key: "display_role",
      header: "Role",
      width: "140px",
      cell: (value) => <Badge variant="outline">{value as string}</Badge>,
    },
    {
      key: "deleted_at",
      header: "Deleted",
      width: "130px",
      cell: (value) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(value as string | null)}
        </span>
      ),
    },
  ];

  // Both recovering and permanently deleting a soft-deleted account are
  // Super Admin only — the backend enforces it, this greys the buttons out for
  // everyone else rather than letting them 403.
  const superAdminOnlyReason = (verb: string) => () =>
    viewerIsSuperAdmin ? null : `Only a Super Admin can ${verb}`;

  const rowActions: RowAction<DeletedUserRow>[] = [
    ...(canRestore
      ? [
          {
            label: "Restore",
            icon: <RotateCcw className="h-4 w-4" />,
            primary: true,
            disabled: () => !viewerIsSuperAdmin,
            disabledReason: superAdminOnlyReason("restore a deleted user"),
            onClick: (row: DeletedUserRow) => {
              const user = findUser(row.id);
              if (user) setDialogState({ type: "restore", user });
            },
          },
        ]
      : []),
    ...(canPermanentlyDelete
      ? [
          {
            label: "Delete permanently",
            icon: <Trash2 className="h-4 w-4" />,
            variant: "destructive" as const,
            disabled: () => !viewerIsSuperAdmin,
            disabledReason: superAdminOnlyReason("permanently delete a user"),
            onClick: (row: DeletedUserRow) => {
              const user = findUser(row.id);
              if (user) setDialogState({ type: "permanentDelete", user });
            },
          },
        ]
      : []),
  ];

  if (error) {
    return (
      <ErrorPage
        title="Failed to load deleted users"
        message="There was an error loading soft-deleted users. Please try again."
        retry={() => refetch()}
      />
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Soft Deleted Users</CardTitle>
          <CardDescription>
            Users deleted from All Users. Only a Super Admin can restore an
            account or permanently delete it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={rows}
            isLoading={isLoading}
            rowActions={rowActions}
            mobileCards
            manualPagination
            page={page}
            totalCount={data?.total_count ?? 0}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            showSearch={false}
            emptyTitle="Nothing in trash"
            emptyDescription="No users have been soft-deleted."
            pageSize={pageSize}
            pageSizeOptions={[10, 25, 50, 100]}
            tableId="admin-users-deleted"
          />
        </CardContent>
      </Card>

      <RestoreUserDialog
        open={dialogState.type === "restore"}
        onOpenChange={closeDialog}
        user={dialogState.type === "restore" ? dialogState.user : null}
      />
      <PermanentDeleteUserDialog
        open={dialogState.type === "permanentDelete"}
        onOpenChange={closeDialog}
        user={dialogState.type === "permanentDelete" ? dialogState.user : null}
      />
    </>
  );
}
