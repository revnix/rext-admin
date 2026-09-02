"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Ban,
  CheckCircle2,
  Mail,
  PauseCircle,
  Pencil,
  Shield,
  ShieldCheck,
  Trash2,
  User as UserIcon,
  Users as UsersIcon,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { DeleteUserDialog } from "@/components/admin/users/delete-user-dialog";
import { EditUserDialog } from "@/components/admin/users/edit-user-dialog";
import { ManageUserRolesDialog } from "@/components/admin/users/manage-user-roles-dialog";
import { UserStatusDialog } from "@/components/admin/users/user-status-dialog";
import { DataTable } from "@/components/data-table";
import { ImpersonationStartDialog } from "@/components/impersonation/impersonation-start-dialog";
import { PageLayout } from "@/components/page-layout";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorPage } from "@/components/ui/error-states";
import { usePermission } from "@/hooks/use-permission";
import { apiClient } from "@/lib/api-client";
import type { User, UserStatusAction } from "@/lib/api-client/users";
import { USER_PERMISSIONS } from "@/lib/permissions";
import type { Column, RowAction } from "@/types/data-table";

interface UserData extends Record<string, unknown> {
  id: string;
  name: string;
  email: string;
  status: string;
  email_verified: boolean;
  display_name: string | null | undefined;
  full_name: string | null | undefined;
  initials: string;
  avatar_url: string | null | undefined;
  display_role: string;
  last_login_at: string | null | undefined;
  login_count: number;
  created_at: string | null | undefined;
}

type UsersDialogState =
  | { type: "closed" }
  | { type: "impersonate"; user: User }
  | { type: "status"; user: User; action: UserStatusAction }
  | { type: "manageRoles"; user: User }
  | { type: "edit"; user: User }
  | { type: "delete"; user: User };

export default function AdminUsersPage() {
  const [dialogState, setDialogState] = useState<UsersDialogState>({
    type: "closed",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    if (typeof window === "undefined") return 10;
    try {
      const stored = localStorage.getItem("data-table-page-size-admin-users");
      if (stored) {
        const parsed = Number(stored);
        if ([5, 10, 20, 25, 50, 100].includes(parsed)) return parsed;
      }
    } catch {}
    return 10;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const closeDialog = () => setDialogState({ type: "closed" });

  // Row actions are built from permissions rather than wrapped in a
  // PermissionGuard, because RowAction has no way to hide an entry.
  const canImpersonate = usePermission(USER_PERMISSIONS.IMPERSONATE);
  const canUpdateUsers = usePermission(USER_PERMISSIONS.UPDATE);
  const canDeleteUsers = usePermission(USER_PERMISSIONS.DELETE);
  const canManageRoles = usePermission(USER_PERMISSIONS.MANAGE_ROLES);

  // Fetch aggregate user statistics for stat cards
  const { data: statsData } = useQuery({
    queryKey: ["admin-users-stats"],
    queryFn: () => apiClient.users.stats(),
  });

  // Fetch users with server-side pagination, search, and filters
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      "admin-users",
      page,
      pageSize,
      searchQuery,
      statusFilter,
      roleFilter,
    ],
    queryFn: () =>
      apiClient.users.list({
        page,
        per_page: pageSize,
        search: searchQuery || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        role: roleFilter !== "all" ? roleFilter : undefined,
      }),
  });

  const findUser = (userId: string) =>
    data?.users.find((u) => u.id === userId) ?? null;

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        text: string;
      }
    > = {
      active: { variant: "default", text: "Active" },
      inactive: { variant: "secondary", text: "Inactive" },
      suspended: { variant: "destructive", text: "Suspended" },
      banned: { variant: "destructive", text: "Banned" },
      pending: { variant: "outline", text: "Pending" },
    };

    // Never fall back to "Active" — an unrecognised status must read as "Unknown".
    const config = variants[status] || { variant: "outline", text: "Unknown" };
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const getUserInitials = (user: User) => {
    const name = (user.display_name || user.full_name || "").trim();
    if (name) {
      const parts = name.split(/\s+/);
      if (parts.length >= 2 && parts[0]?.[0] && parts[parts.length - 1]?.[0]) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (user.email?.trim()) {
      return user.email.trim().slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Never";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Transform users data for DataTable
  const tableData: UserData[] = (data?.users || []).map((user) => {
    const calculatedInitials = getUserInitials(user);
    const validInitials =
      user.initials && user.initials !== "?"
        ? user.initials
        : calculatedInitials;

    // Use explicit backend status directly (e.g., active, suspended, banned, pending)
    const effectiveStatus = user.status || "active";

    return {
      id: user.id,
      name: user.display_name || user.full_name || user.email,
      email: user.email,
      status: effectiveStatus,
      email_verified: user.email_verified,
      display_name: user.display_name,
      full_name: user.full_name,
      initials: validInitials,
      avatar_url: user.avatar_url,
      display_role: user.display_role || "User",
      last_login_at: user.last_login_at,
      login_count: user.login_count ?? 0,
      created_at: user.created_at,
    };
  });

  // Fetch all system roles to populate role filter dropdown
  const { data: systemRolesData } = useQuery({
    queryKey: ["all-system-roles"],
    queryFn: () => apiClient.roles.list(true),
  });

  const availableRoles = useMemo(() => {
    const rolesFromApi = (systemRolesData?.roles || []).map(
      (r) => r.display_name || r.name,
    );
    const rolesFromUsers = tableData.map((u) => u.display_role);
    const combined = Array.from(
      new Set(
        [...rolesFromApi, ...rolesFromUsers].filter((r): r is string =>
          Boolean(r),
        ),
      ),
    );
    return combined.sort();
  }, [systemRolesData, tableData]);

  // Define columns
  const columns: Column<UserData>[] = [
    {
      key: "name",
      header: "User",
      width: "140px",
      cell: (value, row) => (
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="h-7 w-7 flex-shrink-0">
            {row.avatar_url && (
              <AvatarImage src={row.avatar_url} alt={row.name} />
            )}
            <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">
              {row.initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{value as string}</p>
            {row.full_name &&
              row.display_name &&
              row.full_name !== row.display_name && (
                <p className="text-[10px] text-muted-foreground truncate">
                  {row.full_name}
                </p>
              )}
          </div>
        </div>
      ),
      searchable: true,
    },
    {
      key: "email",
      header: "Email",
      width: "140px",
      cell: (value) => (
        <span className="text-xs text-muted-foreground truncate block min-w-0">
          {value as string}
        </span>
      ),
      searchable: true,
    },
    {
      key: "display_role",
      header: "Role",
      width: "90px",
      cell: (value) => (
        <Badge variant="outline" className="text-xs font-medium px-1.5 py-0.5">
          {(value as string) || "User"}
        </Badge>
      ),
      searchable: true,
    },
    {
      key: "status",
      header: "Status",
      width: "85px",
      cell: (value) => (
        <div className="scale-90 origin-left">
          {getStatusBadge(value as string)}
        </div>
      ),
    },
    {
      key: "email_verified",
      header: "Verified",
      width: "75px",
      cell: (value) => {
        const verified = value as boolean;
        return verified ? (
          <Badge
            variant="outline"
            className="text-[10px] text-green-600 border-green-600 px-1 py-0 h-5"
          >
            <ShieldCheck className="h-2.5 w-2.5 mr-1" />
            Yes
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="text-[10px] text-amber-600 border-amber-600 px-1 py-0 h-5"
          >
            No
          </Badge>
        );
      },
    },
    {
      key: "last_login_at",
      header: "Last Login",
      width: "105px",
      cell: (value, row) => (
        <div className="min-w-0">
          <span className="text-xs text-muted-foreground block truncate">
            {formatDate(value as string | null)}
          </span>
          {row.login_count > 0 && (
            <span className="text-[10px] text-muted-foreground/70 block truncate">
              {row.login_count} {row.login_count === 1 ? "login" : "logins"}
            </span>
          )}
        </div>
      ),
    },
  ];

  // Define row actions.
  // Gated on the same permissions the backend enforces, so nothing renders
  // that would only come back as a 403.
  const rowActions: RowAction<UserData>[] = [
    ...(canImpersonate
      ? [
          {
            label: "Impersonate",
            icon: <UserIcon className="h-4 w-4" />,
            onClick: (row: UserData) => {
              const user = findUser(row.id);
              if (user) setDialogState({ type: "impersonate", user });
            },
            primary: true,
          },
        ]
      : []),
    ...(canManageRoles
      ? [
          {
            label: "Manage roles",
            icon: <Shield className="h-4 w-4" />,
            onClick: (row: UserData) => {
              const user = findUser(row.id);
              if (user) setDialogState({ type: "manageRoles", user });
            },
          },
        ]
      : []),
    ...(canUpdateUsers
      ? [
          {
            label: "Edit details",
            icon: <Pencil className="h-4 w-4" />,
            onClick: (row: UserData) => {
              const user = findUser(row.id);
              if (user) setDialogState({ type: "edit", user });
            },
          },
          {
            label: "Activate",
            icon: <CheckCircle2 className="h-4 w-4" />,
            onClick: (row: UserData) => {
              const user = findUser(row.id);
              if (user)
                setDialogState({ type: "status", user, action: "activate" });
            },
            disabled: (row: UserData) => row.status === "active",
          },
          {
            label: "Suspend",
            icon: <PauseCircle className="h-4 w-4" />,
            onClick: (row: UserData) => {
              const user = findUser(row.id);
              if (user)
                setDialogState({ type: "status", user, action: "suspend" });
            },
            disabled: (row: UserData) =>
              row.status === "suspended" || row.status === "banned",
          },
          {
            label: "Ban",
            icon: <Ban className="h-4 w-4" />,
            onClick: (row: UserData) => {
              const user = findUser(row.id);
              if (user) setDialogState({ type: "status", user, action: "ban" });
            },
            variant: "destructive" as const,
            disabled: (row: UserData) => row.status === "banned",
          },
        ]
      : []),
    ...(canDeleteUsers
      ? [
          {
            label: "Delete user",
            icon: <Trash2 className="h-4 w-4" />,
            onClick: (row: UserData) => {
              const user = findUser(row.id);
              if (user) setDialogState({ type: "delete", user });
            },
            variant: "destructive" as const,
          },
        ]
      : []),
  ];

  if (error) {
    return (
      <ErrorPage
        title="Failed to load users"
        message="There was an error loading the user list. Please try again."
        retry={() => refetch()}
      />
    );
  }

  return (
    <PageLayout
      title="User Management"
      description="Manage system users and impersonation"
    >
      <PermissionGuard
        permission={USER_PERMISSIONS.READ}
        fallback={
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to view user management.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Required permission:{" "}
                <code className="text-xs bg-muted px-1 rounded">user.read</code>
              </p>
            </CardContent>
          </Card>
        }
      >
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsData?.total ?? data?.total_count ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Registered accounts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Users
                </CardTitle>
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsData?.active ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Verified</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsData?.verified ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">Email verified</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <UserIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsData?.unverified ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting verification
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                View and manage user accounts. Click "Impersonate" to view the
                system as that user.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={tableData}
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
                onSearchChange={(search) => {
                  setSearchQuery(search);
                  setPage(1);
                }}
                actions={
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Filter */}
                    <div className="w-[140px]">
                      <Select
                        value={statusFilter}
                        onValueChange={(val) => {
                          setStatusFilter(val);
                          setPage(1);
                        }}
                      >
                        <SelectTrigger className="h-9 text-xs bg-background">
                          <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                          <SelectItem value="banned">Banned</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Role Filter */}
                    <div className="w-[140px]">
                      <Select
                        value={roleFilter}
                        onValueChange={(val) => {
                          setRoleFilter(val);
                          setPage(1);
                        }}
                      >
                        <SelectTrigger className="h-9 text-xs bg-background">
                          <SelectValue placeholder="All Roles" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Roles</SelectItem>
                          {availableRoles.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Clear Filters */}
                    {(statusFilter !== "all" || roleFilter !== "all") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setStatusFilter("all");
                          setRoleFilter("all");
                          setPage(1);
                        }}
                        className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Reset
                      </Button>
                    )}
                  </div>
                }
                emptyTitle="No users found"
                emptyDescription="No registered users match the selected search or filters."
                searchPlaceholder="Search by name or email..."
                pageSize={pageSize}
                pageSizeOptions={[10, 25, 50, 100]}
                tableId="admin-users"
              />
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100">
                About Impersonation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <p>
                <strong>Impersonation</strong> allows you to view the system as
                another user for troubleshooting and support purposes.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>All actions are performed as the impersonated user</li>
                <li>Your session is logged for audit and security purposes</li>
                <li>A yellow banner will display while impersonating</li>
                <li>You can stop impersonation at any time</li>
              </ul>
            </CardContent>
          </Card>

          {/* Dialogs */}
          <ImpersonationStartDialog
            user={dialogState.type === "impersonate" ? dialogState.user : null}
            open={dialogState.type === "impersonate"}
            onOpenChange={closeDialog}
            onStarted={closeDialog}
          />
          <UserStatusDialog
            open={dialogState.type === "status"}
            onOpenChange={closeDialog}
            user={dialogState.type === "status" ? dialogState.user : null}
            action={dialogState.type === "status" ? dialogState.action : null}
          />
          <ManageUserRolesDialog
            open={dialogState.type === "manageRoles"}
            onOpenChange={closeDialog}
            user={dialogState.type === "manageRoles" ? dialogState.user : null}
          />
          <EditUserDialog
            open={dialogState.type === "edit"}
            onOpenChange={closeDialog}
            user={dialogState.type === "edit" ? dialogState.user : null}
          />
          <DeleteUserDialog
            open={dialogState.type === "delete"}
            onOpenChange={closeDialog}
            user={dialogState.type === "delete" ? dialogState.user : null}
          />
        </div>
      </PermissionGuard>
    </PageLayout>
  );
}
