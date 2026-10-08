"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Ban,
  CalendarPlus,
  CheckCircle2,
  Coins,
  CreditCard,
  Mail,
  PauseCircle,
  Pencil,
  Shield,
  ShieldCheck,
  Trash2,
  User as UserIcon,
  Users as UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DeleteUserDialog } from "@/components/admin/users/delete-user-dialog";
import { EditUserDialog } from "@/components/admin/users/edit-user-dialog";
import { ManageUserRolesDialog } from "@/components/admin/users/manage-user-roles-dialog";
import { UserCreditsDialog } from "@/components/admin/users/user-credits-dialog";
import { UserPlanDialog } from "@/components/admin/users/user-plan-dialog";
import { UserStatusDialog } from "@/components/admin/users/user-status-dialog";
import { AccountRecoveryTable } from "@/components/admin/users/account-recovery-table";
import { DeletedUsersTable } from "@/components/admin/users/deleted-users-table";
import { ImpersonationStartDialog } from "@/components/impersonation/impersonation-start-dialog";
import { ListPage } from "@/components/layouts";
import { AdminGuard } from "@/components/permission/admin-guard";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  useDataTableUrlState,
} from "@/components/ui/data-table";
import { Notice } from "@/components/ui/notice";
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
import { useDebounce } from "@/hooks/useDebounce";
import {
  planActionLabel,
  planCell,
  planWords,
} from "@/lib/billing/plan-changes";
import { dateFormat } from "@/lib/formatters/date-formatters";
import { ROLES, USER_PERMISSIONS } from "@/lib/permissions";
import { adminPlanKeys } from "@/lib/query-keys";
import {
  ADMIN_USER_STATUSES,
  ADMIN_USERS_FACETS,
  adminUsersParams,
} from "@/lib/search-params/admin-users";

interface UserData {
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
  plan_display_name: string | null | undefined;
  is_trial: boolean | undefined;
  billing_period: User["billing_period"];
}

type UsersTab = "all" | "deleted" | "recovery";
const USERS_TAB_STORAGE_KEY = "admin-users-active-tab";

type UsersDialogState =
  | { type: "closed" }
  | { type: "impersonate"; user: User }
  | { type: "status"; user: User; action: UserStatusAction }
  | { type: "manageRoles"; user: User }
  | { type: "edit"; user: User }
  | { type: "credits"; user: User }
  | { type: "plan"; user: User }
  | { type: "delete"; user: User };

// Never "Active" for a status the page doesn't know: it reads Unknown.
const STATUS_BADGE: Record<
  string,
  { variant: BadgeProps["variant"]; text: string }
> = {
  active: { variant: "success", text: "Active" },
  inactive: { variant: "neutral", text: "Inactive" },
  suspended: { variant: "warning", text: "Suspended" },
  banned: { variant: "danger", text: "Banned" },
  pending: { variant: "info", text: "Pending" },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_BADGE[status] ?? {
    variant: "neutral",
    text: "Unknown",
  };
  return <Badge variant={config.variant}>{config.text}</Badge>;
}

function getUserInitials(user: User) {
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
}

function UserCell({ row }: { row: UserData }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar className="size-7 shrink-0">
        {row.avatar_url && <AvatarImage src={row.avatar_url} alt="" />}
        <AvatarFallback className="text-xs">{row.initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{row.name}</p>
        <p className="truncate text-muted-foreground">{row.email}</p>
      </div>
    </div>
  );
}

/** One badge per role, not per grant; the workspaces are in the tooltip. */
function RoleBadges({ roles }: { roles: UserRoleSummary[] }) {
  if (roles.length === 0) return <Badge variant="neutral">User</Badge>;
  const platformRoles = roles.filter((r) => r.is_platform);
  // A user owning five workspaces holds five workspace_owner rows and used to
  // render five identical badges. Collapse by role.
  const workspaceRoles = Array.from(
    roles
      .filter((r) => !r.is_platform)
      .reduce((acc, r) => {
        const entry = acc.get(r.role_id);
        if (entry) entry.workspaces.push(r.workspace_name || "Unknown");
        else
          acc.set(r.role_id, {
            role: r,
            workspaces: [r.workspace_name || "Unknown"],
          });
        return acc;
      }, new Map<string, { role: UserRoleSummary; workspaces: string[] }>())
      .values(),
  );
  return (
    <div className="flex flex-wrap items-center gap-1">
      {platformRoles.map((r) => (
        <Tooltip key={`platform-${r.role_id}`}>
          <TooltipTrigger asChild>
            <Badge variant="neutral" className="cursor-default">
              {r.display_name}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>Platform-wide role</TooltipContent>
        </Tooltip>
      ))}
      {workspaceRoles.map(({ role: r, workspaces }) => (
        <Tooltip key={`ws-${r.role_id}`}>
          <TooltipTrigger asChild>
            <Badge variant="neutral" className="cursor-default">
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
      ))}
    </div>
  );
}

/**
 * The plan that grants the user access (FB2.29), with the trial or the billing period under it.
 * A row whose plan the API didn't send is not known, which is not "No plan".
 */
function PlanCell({ row }: { row: UserData }) {
  const plan = planCell(row);
  if (plan === "unknown")
    return <span className="text-muted-foreground">Not known</span>;
  if (plan === "none")
    return <span className="text-muted-foreground">No plan</span>;
  return (
    <div className="min-w-0">
      <p className="wrap-anywhere">{plan.name}</p>
      {plan.detail && <p className="text-muted-foreground">{plan.detail}</p>}
    </div>
  );
}

const column = createDataTableColumnHelper<UserData>();

// The server searches, filters and pages; the table only draws the page.
const columns = column.columns([
  column.accessor("name", {
    header: "User",
    cell: ({ row }) => <UserCell row={row.original} />,
    enableSorting: false,
    enableHiding: false,
  }),
  column.accessor("display_role", {
    id: "role",
    header: "Role",
    cell: ({ row }) => <RoleBadges roles={row.original.roles} />,
    enableSorting: false,
  }),
  column.accessor("plan_display_name", {
    id: "plan",
    header: "Plan",
    cell: ({ row }) => <PlanCell row={row.original} />,
    enableSorting: false,
  }),
  column.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => <StatusBadge status={getValue()} />,
    enableSorting: false,
  }),
  column.accessor("email_verified", {
    header: "Verified",
    cell: ({ getValue }) =>
      getValue() ? (
        <Badge variant="success">Yes</Badge>
      ) : (
        <Badge variant="warning">No</Badge>
      ),
    enableSorting: false,
  }),
  column.accessor("last_login_at", {
    header: "Last login",
    meta: { align: "end", numeric: true },
    cell: ({ row, getValue }) => (
      <div className="min-w-0">
        {/* One line: with the Plan column the date would otherwise break at 1024 px. */}
        <p className="whitespace-nowrap">
          {dateFormat.short(getValue()) || "Never"}
        </p>
        {row.original.login_count > 0 && (
          <p className="text-muted-foreground">
            {row.original.login_count}{" "}
            {row.original.login_count === 1 ? "login" : "logins"}
          </p>
        )}
      </div>
    ),
    enableSorting: false,
  }),
]);

export default function AdminUsersPage() {
  const [dialogState, setDialogState] = useState<UsersDialogState>({
    type: "closed",
  });
  // The search, the filters and the page live in the URL; the server applies them.
  const tableState = useDataTableUrlState(adminUsersParams, {
    facets: ADMIN_USERS_FACETS,
  });
  const { pageIndex, pageSize } = tableState.pagination;
  const searchQuery = useDebounce(tableState.globalFilter, 300);
  const facetValue = (id: string) => {
    const value = tableState.columnFilters.find((f) => f.id === id)?.value;
    return Array.isArray(value) ? (value[0] as string | undefined) : undefined;
  };
  const statusFilter = facetValue("status");
  const roleFilter = facetValue("role");
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
  // Deleted tab greys that one action out for everyone else. The Credits and
  // the plan row actions are theirs alone, too.
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
      ...adminPlanKeys.usersList(),
      pageIndex + 1,
      pageSize,
      searchQuery,
      statusFilter,
      roleFilter,
    ],
    queryFn: () =>
      apiClient.users.list({
        page: pageIndex + 1,
        per_page: pageSize,
        search: searchQuery || undefined,
        status: statusFilter,
        role: roleFilter,
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
      plan_display_name: user.plan_display_name,
      is_trial: user.is_trial,
      billing_period: user.billing_period,
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

  // Super Admin accounts stay in the list but are shielded from every
  // management action, for everyone — the backend enforces the same rule, this
  // just greys the buttons out with a reason rather than letting them 403.
  const protectedReason = (row: UserData): string | null =>
    row.is_super_admin ? "Super Admin accounts are protected" : null;

  // Impersonation is for verified users only — the backend rejects unverified
  // targets, this greys the button out with the reason instead of a 403.
  const impersonateDisabledReason = (row: UserData): string | null =>
    protectedReason(row) ??
    (row.email_verified
      ? null
      : "User hasn't verified their email address yet");

  // Row actions, gated on the same permissions the backend enforces, so
  // nothing shows that would only come back as a 403.
  const rowActions = (row: UserData): DataTableRowAction[] => {
    const user = findUser(row.id);
    if (!user) return [];
    const locked = protectedReason(row) ?? false;
    const open = (state: UsersDialogState) => () => setDialogState(state);
    return [
      ...(canImpersonate
        ? [
            {
              label: "Impersonate",
              icon: UserIcon,
              disabled: impersonateDisabledReason(row) ?? false,
              onSelect: open({ type: "impersonate", user }),
            },
          ]
        : []),
      ...(canManageRoles
        ? [
            {
              label: "Manage roles",
              icon: Shield,
              disabled: locked,
              onSelect: open({ type: "manageRoles", user }),
            },
          ]
        : []),
      ...(canManageUsers
        ? [
            {
              // SEC-RBAC-04: Super Admin rows are locked for edit too — the
              // dialog can change email/password, and the backend refuses it.
              label: "Edit details",
              icon: Pencil,
              disabled: locked,
              onSelect: open({ type: "edit", user }),
            },
            {
              label: "Activate",
              icon: CheckCircle2,
              disabled:
                locked || (row.status === "active" ? "Already active" : false),
              onSelect: open({ type: "status", user, action: "activate" }),
            },
            {
              label: "Suspend",
              icon: PauseCircle,
              disabled:
                locked ||
                (row.status === "suspended" || row.status === "banned"
                  ? "Already suspended or banned"
                  : false),
              onSelect: open({ type: "status", user, action: "suspend" }),
            },
            {
              label: "Ban",
              icon: Ban,
              destructive: true,
              disabled:
                locked || (row.status === "banned" ? "Already banned" : false),
              onSelect: open({ type: "status", user, action: "ban" }),
            },
          ]
        : []),
      ...(viewerIsSuperAdmin
        ? [
            {
              // The backend lets only a super admin add, deduct or reset
              // credits, and never on a Super Admin's own account.
              label: "Credits",
              icon: Coins,
              disabled: locked,
              onSelect: open({ type: "credits", user }),
            },
            {
              // Theirs alone as well: another plan, or for a trial a later
              // end. The dialog reads what the backend allows for this user.
              label: planActionLabel(user),
              icon: user.is_trial ? CalendarPlus : CreditCard,
              disabled: locked,
              onSelect: open({ type: "plan", user }),
            },
          ]
        : []),
      ...(canDeleteUsers
        ? [
            {
              label: "Delete user",
              icon: Trash2,
              destructive: true,
              disabled: locked,
              onSelect: open({ type: "delete", user }),
            },
          ]
        : []),
    ];
  };

  const userFacets = [
    {
      column: "status",
      title: "Status",
      single: true,
      options: ADMIN_USER_STATUSES.map((value) => ({
        value,
        label: STATUS_BADGE[value].text,
      })),
    },
    {
      column: "role",
      title: "Role",
      single: true,
      options: availableRoles.map((role) => ({ value: role, label: role })),
    },
  ];

  // Error page only for an idle error — while a refetch is running the
  // loading skeleton below shows instead of a failure screen (see
  // isRecovering).
  if (error && !isFetching) {
    return (
      <ListPage
        title="User Management"
        description="Manage system users and impersonation"
      >
        <Notice
          tone="danger"
          title="Failed to load users"
          action={
            <Button size="sm" variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        >
          There was an error loading the user list. Please try again.
        </Notice>
      </ListPage>
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
                    caption="All users"
                    columns={columns}
                    data={tableData}
                    getRowId={(user) => user.id}
                    getRowLabel={(user) => user.name}
                    state={tableState}
                    manual={{ rowCount: data?.total_count ?? 0 }}
                    // isLoading is false while recovering from a cached
                    // error (v5: isPending && isFetching, and an errored
                    // query is not pending) — include isRecovering so the
                    // skeleton shows instead of an empty table flash.
                    isLoading={isLoading || isRecovering}
                    surface="plain"
                    search={{ placeholder: "Search by name or email" }}
                    facets={userFacets}
                    rowActions={rowActions}
                    emptyState={
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        No registered users yet.
                      </p>
                    }
                    renderCard={(user, { actions }) => (
                      <div className="flex items-start gap-3">
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                          <UserCell row={user} />
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge status={user.status} />
                            <RoleBadges roles={user.roles} />
                          </div>
                          {planWords(user) && (
                            <p className="wrap-anywhere text-muted-foreground">
                              Plan: {planWords(user)}
                            </p>
                          )}
                        </div>
                        {actions}
                      </div>
                    )}
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
          <UserCreditsDialog
            open={dialogState.type === "credits"}
            onOpenChange={closeDialog}
            user={dialogState.type === "credits" ? dialogState.user : null}
          />
          <UserPlanDialog
            open={dialogState.type === "plan"}
            onOpenChange={closeDialog}
            user={dialogState.type === "plan" ? dialogState.user : null}
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
