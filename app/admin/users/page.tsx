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
import Link from "next/link";
import { useMemo, useState } from "react";
import { DeleteUserDialog } from "@/components/admin/users/delete-user-dialog";
import { EditUserDialog } from "@/components/admin/users/edit-user-dialog";
import { ManageUserRolesDialog } from "@/components/admin/users/manage-user-roles-dialog";
import { UserStatusDialog } from "@/components/admin/users/user-status-dialog";
import { DataTable } from "@/components/data-table";
import { AccountRecoveryTable } from "@/components/admin/users/account-recovery-table";
import { DeletedUsersTable } from "@/components/admin/users/deleted-users-table";
import { ImpersonationStartDialog } from "@/components/impersonation/impersonation-start-dialog";
import { ListPage } from "@/components/layouts";
import { AdminGuard } from "@/components/permission/admin-guard";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useIsSuperAdmin, usePermission } from "@/hooks/use-permission";
import { apiClient } from "@/lib/api-client";
import type {
  User,
  UserRoleSummary,
  UserStatusAction,
} from "@/lib/api-client/users";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ROLES, USER_PERMISSIONS } from "@/lib/permissions";
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
  roles: UserRoleSummary[];
  is_super_admin: boolean;
  last_login_at: string | null | undefined;
  login_count: number;
  created_at: string | null | undefined;
}

type UsersTab = "all" | "deleted" | "recovery";
const USERS_TAB_STORAGE_KEY = "admin-users-active-tab";

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
  const [activeTab, setActiveTab] = useState<UsersTab>(() => {
    if (typeof window === "undefined") return "all";
    try {
      const stored = localStorage.getItem(USERS_TAB_STORAGE_KEY);
      if (stored === "deleted" || stored === "recovery" || stored === "all") {
        return stored;
      }
    } catch {}
    return "all";
  });

  // Only Super Admins can permanently delete a soft-deleted user; the Soft
  // Deleted tab greys that one action out for everyone else.
  const viewerIsSuperAdmin = useIsSuperAdmin();

  const handleTabChange = (value: string) => {
    const next = value as UsersTab;
    setActiveTab(next);
    try {
      localStorage.setItem(USERS_TAB_STORAGE_KEY, next);
    } catch {}
  };

  const closeDialog = () => setDialogState({ type: "closed" });

  // Row actions are built from permissions rather than wrapped in a
  // PermissionGuard, because RowAction has no way to hide an entry.
  const canImpersonate = usePermission(USER_PERMISSIONS.IMPERSONATE);
  // Cross-user admin actions (edit/suspend/ban) require user.manage, NOT the
  // self-service user.update every account holds (SEC-RBAC-01/02).
  const canManageUsers = usePermission(USER_PERMISSIONS.MANAGE);
  const canDeleteUsers = usePermission(USER_PERMISSIONS.DELETE);
  const canManageRoles = usePermission(USER_PERMISSIONS.MANAGE_ROLES);

  // Fetch aggregate user statistics for stat cards
  const { data: statsData } = useQuery({
    queryKey: ["admin-users-stats"],
    queryFn: () => apiClient.users.stats(),
  });

  // Fetch users with server-side pagination, search, and filters
  const { data, isLoading, error, refetch, isFetching } = useQuery({
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

  // A cached error from a previous visit replays on mount (status stays
  // "error" in TanStack Query v5) while refetchOnMount already refires the
  // query in the background. Treating that in-flight state as "failed" made
  // a sub-second "Failed to load users" flash before the fresh data landed.
  // Only an idle error is terminal; a refetching one is "recovering".
  const isRecovering = !!error && isFetching;

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
      roles: user.roles || [],
      is_super_admin:
        user.is_super_admin ??
        (user.roles || []).some(
          (r) => r.is_platform && r.hierarchy_level >= 100,
        ),
      last_login_at: user.last_login_at,
      login_count: user.login_count ?? 0,
      created_at: user.created_at,
    };
  });

  // Fetch all system roles to populate role filter dropdown
  const { data: systemRolesData } = useQuery({
    // Same key as /admin/roles — one endpoint, one cache entry (finding #15:
    // the old ["all-system-roles"] key refetched the same data per page).
    queryKey: ["roles"],
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
            <AvatarFallback className="bg-muted text-foreground text-[11px] font-semibold">
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
      width: "180px",
      cell: (_value, row) => {
        const roles = (row.roles as UserRoleSummary[]) || [];
        if (roles.length === 0) {
          return (
            <Badge
              variant="outline"
              className="text-xs font-medium px-1.5 py-0.5"
            >
              User
            </Badge>
          );
        }

        const platformRoles = roles.filter((r) => r.is_platform);
        // One badge per role, not per grant. A user owning five workspaces holds
        // five workspace_owner rows and used to render five identical badges,
        // blowing the column into a vertical wall. Collapse by role and put the
        // workspace names in the tooltip.
        const workspaceRoles = Array.from(
          roles
            .filter((r) => !r.is_platform)
            .reduce((acc, r) => {
              const entry = acc.get(r.role_id);
              if (entry) {
                entry.workspaces.push(r.workspace_name || "Unknown");
              } else {
                acc.set(r.role_id, {
                  role: r,
                  workspaces: [r.workspace_name || "Unknown"],
                });
              }
              return acc;
            }, new Map<
              string,
              { role: UserRoleSummary; workspaces: string[] }
            >())
            .values(),
        );

        return (
          <div className="flex flex-wrap items-center gap-1">
            {platformRoles.map((r) => (
              <Tooltip key={`platform-${r.role_id}`}>
                <TooltipTrigger asChild>
                  <Badge
                    variant="secondary"
                    className="text-[11px] font-medium px-1.5 py-0.5 cursor-default"
                  >
                    {r.display_name}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Platform-wide role</TooltipContent>
              </Tooltip>
            ))}
            {workspaceRoles.map(({ role: r, workspaces }) => {
              return (
                <Tooltip key={`ws-${r.role_id}`}>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="secondary"
                      className={`text-[11px] font-medium px-1.5 py-0.5`}
                    >
                      {r.display_name}
                      {workspaces.length > 1
                        ? ` in ${workspaces.length} workspaces`
                        : ""}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    {workspaces.length > 1
                      ? `${r.display_name} in ${workspaces.length} workspaces: ${workspaces.join(", ")}`
                      : `${r.display_name} in workspace: ${workspaces[0]}`}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        );
      },
      searchable: true,
    },
    {
      key: "status",
      header: "Status",
      width: "130px",
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

  // Super Admin accounts stay in the list but are shielded from every
  // management action, for everyone — the backend enforces the same rule, this
  // just greys the buttons out with a reason rather than letting them 403.
  const protectedReason = (row: UserData): string | null =>
    row.is_super_admin ? "Super Admin accounts are protected" : null;
  const isProtected = (row: UserData) => protectedReason(row) !== null;

  // Impersonation is for verified users only — the backend rejects unverified
  // targets, this greys the button out with the reason instead of a 403.
  const impersonateDisabledReason = (row: UserData): string | null =>
    protectedReason(row) ??
    (row.email_verified
      ? null
      : "User hasn't verified their email address yet");

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
            disabled: (row: UserData) =>
              impersonateDisabledReason(row) !== null,
            disabledReason: impersonateDisabledReason,
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
            disabled: isProtected,
            disabledReason: protectedReason,
          },
        ]
      : []),
    ...(canManageUsers
      ? [
          {
            // SEC-RBAC-04: Super Admin rows are locked for edit too — the
            // dialog can change email/password, and the backend refuses it.
            label: "Edit details",
            icon: <Pencil className="h-4 w-4" />,
            onClick: (row: UserData) => {
              const user = findUser(row.id);
              if (user) setDialogState({ type: "edit", user });
            },
            disabled: isProtected,
            disabledReason: protectedReason,
          },
          {
            label: "Activate",
            icon: <CheckCircle2 className="h-4 w-4" />,
            onClick: (row: UserData) => {
              const user = findUser(row.id);
              if (user)
                setDialogState({ type: "status", user, action: "activate" });
            },
            disabled: (row: UserData) =>
              row.status === "active" || isProtected(row),
            disabledReason: protectedReason,
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
              row.status === "suspended" ||
              row.status === "banned" ||
              isProtected(row),
            disabledReason: protectedReason,
          },
          {
            label: "Ban",
            icon: <Ban className="h-4 w-4" />,
            onClick: (row: UserData) => {
              const user = findUser(row.id);
              if (user) setDialogState({ type: "status", user, action: "ban" });
            },
            variant: "destructive" as const,
            disabled: (row: UserData) =>
              row.status === "banned" || isProtected(row),
            disabledReason: protectedReason,
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
            disabled: isProtected,
            disabledReason: protectedReason,
          },
        ]
      : []),
  ];

  // Error page only for an idle error — while a refetch is running the
  // loading skeleton below shows instead of a failure screen (see
  // isRecovering).
  if (error && !isFetching) {
    return (
      <ErrorPage
        title="Failed to load users"
        message="There was an error loading the user list. Please try again."
        retry={() => refetch()}
      />
    );
  }

  return (
    <ListPage
      title="User Management"
      description="Manage system users and impersonation"
      actions={
        // Platform admins are invited, not created here; the invitations page is super admin only.
        <AdminGuard superAdminOnly>
          <Button variant="outline" asChild>
            <Link href="/admin/platform/invitations">
              <Mail className="h-4 w-4 mr-2" />
              Admin invitations
            </Link>
          </Button>
        </AdminGuard>
      }
    >
      <PermissionGuard
        // user.manage is held only by admin/super_admin; the global support
        // role additionally gets read-only visibility (list + view details).
        // Write actions below stay gated on their own permissions.
        anyRole={[ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.SUPPORT]}
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
                <code className="text-xs bg-muted px-1 rounded-md">
                  user.read
                </code>
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

          {/* Tabs: All Users / Soft Deleted Users / Account Recovery */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="all">All Users</TabsTrigger>
              <TabsTrigger value="deleted">Soft Deleted Users</TabsTrigger>
              <TabsTrigger value="recovery">Account Recovery</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6 mt-4">
              {/* Users Table */}
              <Card>
                <CardHeader>
                  <CardTitle>All Users</CardTitle>
                  <CardDescription>
                    View and manage user accounts. Click "Impersonate" to view
                    the system as that user.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DataTable
                    columns={columns}
                    data={tableData}
                    // isLoading is false while recovering from a cached
                    // error (v5: isPending && isFetching, and an errored
                    // query is not pending) — include isRecovering so the
                    // skeleton shows instead of an empty table flash.
                    isLoading={isLoading || isRecovering}
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
                            <SelectTrigger className="h-9 text-xs bg-card">
                              <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Statuses</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="suspended">
                                Suspended
                              </SelectItem>
                              <SelectItem value="banned">Banned</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Role Filter */}
                        <div>
                          <Select
                            value={roleFilter}
                            onValueChange={(val) => {
                              setRoleFilter(val);
                              setPage(1);
                            }}
                          >
                            <SelectTrigger className="h-9 text-xs bg-card">
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
              <Card className="border-border bg-muted/40">
                <CardHeader>
                  <CardTitle className="text-foreground">
                    About Impersonation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-foreground">
                  <p>
                    <strong>Impersonation</strong> allows you to view the system
                    as another user for troubleshooting and support purposes.
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>All actions are performed as the impersonated user</li>
                    <li>
                      Your session is logged for audit and security purposes
                    </li>
                    <li>A yellow banner will display while impersonating</li>
                    <li>You can stop impersonation at any time</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="deleted" className="mt-4">
              <DeletedUsersTable
                active={activeTab === "deleted"}
                viewerIsSuperAdmin={viewerIsSuperAdmin}
              />
            </TabsContent>

            <TabsContent value="recovery" className="mt-4">
              <AccountRecoveryTable active={activeTab === "recovery"} />
            </TabsContent>
          </Tabs>

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
    </ListPage>
  );
}
