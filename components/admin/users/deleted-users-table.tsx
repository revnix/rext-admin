"use client";

import { useQuery } from "@tanstack/react-query";
import { RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { RestoreUserDialog } from "@/components/admin/users/restore-user-dialog";
import { PermanentDeleteUserDialog } from "@/components/admin/users/permanent-delete-user-dialog";
import { Badge } from "@/components/ui/badge";
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
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { usePermission } from "@/hooks/use-permission";
import { apiClient } from "@/lib/api-client";
import type { User } from "@/lib/api-client/users";
import { dateFormat } from "@/lib/formatters/date-formatters";
import { USER_PERMISSIONS } from "@/lib/permissions";

interface DeletedUsersTableProps {
  active: boolean;
  viewerIsSuperAdmin: boolean;
}

type DeletedDialogState =
  | { type: "closed" }
  | { type: "restore"; user: User }
  | { type: "permanentDelete"; user: User };

const column = createDataTableColumnHelper<User>();

const columns = column.columns([
  column.accessor((u) => u.display_name || u.full_name || u.email, {
    id: "name",
    header: "User",
    cell: ({ row, getValue }) => (
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{getValue()}</p>
        <p className="truncate text-muted-foreground">{row.original.email}</p>
      </div>
    ),
    enableSorting: false,
  }),
  column.accessor((u) => u.display_role || "User", {
    id: "role",
    header: "Role",
    cell: ({ getValue }) => <Badge variant="neutral">{getValue()}</Badge>,
    enableSorting: false,
  }),
  column.accessor("deleted_at", {
    header: "Deleted",
    meta: { align: "end", numeric: true },
    cell: ({ getValue }) => dateFormat.short(getValue()) || UNKNOWN,
    enableSorting: false,
  }),
]);

const NO_USERS: User[] = [];

export function DeletedUsersTable({
  active,
  viewerIsSuperAdmin,
}: DeletedUsersTableProps) {
  const tableState = useDataTableLocalState({ pageSize: 10 });
  const { pageIndex, pageSize } = tableState.pagination;
  const [dialogState, setDialogState] = useState<DeletedDialogState>({
    type: "closed",
  });

  const canRestore = usePermission(USER_PERMISSIONS.UPDATE);
  const canPermanentlyDelete = usePermission(USER_PERMISSIONS.DELETE);

  // The server pages this list: the table shows one page and its total.
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-users-deleted", pageIndex + 1, pageSize],
    queryFn: () =>
      apiClient.users.listDeleted({ page: pageIndex + 1, per_page: pageSize }),
    enabled: active,
  });
  const users = data?.users ?? NO_USERS;
  const closeDialog = () => setDialogState({ type: "closed" });

  // Both recovering and permanently deleting a soft-deleted account are
  // Super Admin only — the backend enforces it, this greys the items out for
  // everyone else rather than letting them 403.
  const superAdminOnly = (verb: string) =>
    viewerIsSuperAdmin ? false : `Only a Super Admin can ${verb}`;

  const rowActions = (user: User): DataTableRowAction[] => [
    ...(canRestore
      ? [
          {
            label: "Restore",
            icon: RotateCcw,
            disabled: superAdminOnly("restore a deleted user"),
            onSelect: () => setDialogState({ type: "restore", user }),
          },
        ]
      : []),
    ...(canPermanentlyDelete
      ? [
          {
            label: "Delete permanently",
            icon: Trash2,
            destructive: true,
            disabled: superAdminOnly("permanently delete a user"),
            onSelect: () => setDialogState({ type: "permanentDelete", user }),
          },
        ]
      : []),
  ];

  if (error) {
    return (
      <Notice
        tone="danger"
        title="Failed to load deleted users"
        action={
          <Button size="sm" variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        }
      >
        There was an error loading soft-deleted users. Please try again.
      </Notice>
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
            caption="Soft deleted users"
            columns={columns}
            data={users}
            getRowId={(user) => user.id}
            getRowLabel={(user) => user.display_name || user.email}
            state={tableState}
            manual={{ rowCount: data?.total_count ?? 0 }}
            isLoading={isLoading}
            surface="plain"
            rowActions={rowActions}
            emptyState={
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nothing in the trash: no users have been soft-deleted.
              </p>
            }
            renderCard={(user, { actions }) => (
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">
                    {user.display_name || user.full_name || user.email}
                  </p>
                  <p className="truncate text-muted-foreground">
                    {user.email} · deleted{" "}
                    {dateFormat.short(user.deleted_at) || UNKNOWN}
                  </p>
                </div>
                {actions}
              </div>
            )}
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
