"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Edit,
  Eye,
  Key,
  LockKeyhole,
  Network,
  Plus,
  Settings,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { BulkAssignPermissionsDialog } from "@/components/admin/roles/bulk-assign-permissions-dialog";

import { CreateRoleDialog } from "@/components/admin/roles/create-role-dialog";
import { DeleteRoleDialog } from "@/components/admin/roles/delete-role-dialog";
import { EditPermissionDialog } from "@/components/admin/roles/edit-permission-dialog";
import { EditRoleDialog } from "@/components/admin/roles/edit-role-dialog";
import { ManageRolePermissionsDialog } from "@/components/admin/roles/manage-role-permissions-dialog";
import { PermissionBadge } from "@/components/admin/roles/permission-badge";
import { PermissionDependencyView } from "@/components/admin/roles/permission-dependency-view";
import { RoleBadge } from "@/components/admin/roles/role-badge";
import { ListPage } from "@/components/layouts";
import { PermissionGuard } from "@/components/permission/permission-guard";
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
  createDataTableColumnHelper,
  DataTable,
  type DataTableRowAction,
} from "@/components/ui/data-table";
import { ErrorPage } from "@/components/ui/error-states";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api-client";
import { usePermission } from "@/hooks/use-permission";
import {
  ROLE_PERMISSIONS,
  isProtectedRole,
  isWorkspaceAssignablePermission,
} from "@/lib/permissions";
import type { PermissionWithRoles, RoleWithPermissions } from "@/types/role";

interface RoleTableData {
  id: string;
  name: string;
  display_name: string;
  is_system_role: boolean;
  permissions_count: number;
  description?: string;
}

interface PermissionTableData {
  id: string;
  name: string;
  display_name: string;
  resource: string;
  action: string;
  roles_count: number;
  description?: string;
  is_system: boolean;
}

// Permissions offerable to custom roles: platform-scoped resources (user, role,
// permission, audit, support, billing, security) are excluded — the same filter
// CreateRoleDialog applies — but built-in roles still show them (read-only)
// via the unfiltered list below.

// The platform-wide `user` floor role has been removed from the backend
// (own-account routes are authentication-gated; signup no longer assigns a
// global role). This filter stays as transition safety so the role never
// reappears on this page if this frontend deploys before the cleanup
// migration runs; it becomes a no-op once the role is gone.
const PLATFORM_FLOOR_ROLE = "user";

type RolesDialogState =
  | { type: "closed" }
  | { type: "createRole" }
  | { type: "editRole"; role: RoleWithPermissions }
  | { type: "deleteRole"; role: RoleWithPermissions }
  | { type: "manageRolePermissions"; role: RoleWithPermissions }
  | { type: "editPermission"; permission: PermissionWithRoles }
  | { type: "bulkAssign" }
  | { type: "dependencyView"; permission: PermissionWithRoles };

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? "" : "s"}`;

const roleColumn = createDataTableColumnHelper<RoleTableData>();

const roleColumns = roleColumn.columns([
  roleColumn.accessor("display_name", {
    header: "Role",
    cell: ({ row, getValue }) => (
      <div className="flex items-center gap-2">
        <span className="font-medium text-foreground">{getValue()}</span>
        <RoleBadge
          isSystemRole={row.original.is_system_role}
          isBuiltIn={isProtectedRole(row.original)}
        />
      </div>
    ),
  }),
  roleColumn.accessor("name", {
    header: "Internal name",
    cell: ({ getValue }) => (
      <code className="rounded-sm bg-muted px-1.5 py-0.5 text-xs">
        {getValue()}
      </code>
    ),
  }),
  roleColumn.accessor("permissions_count", {
    header: "Permissions",
    meta: { align: "end", numeric: true },
    cell: ({ getValue }) => plural(getValue(), "permission"),
    enableGlobalFilter: false,
  }),
  roleColumn.accessor((role) => role.description ?? "", {
    id: "description",
    header: "Description",
    cell: ({ getValue }) => (
      <span className="line-clamp-2 text-muted-foreground">
        {getValue() || "—"}
      </span>
    ),
    enableSorting: false,
  }),
]);

const permissionColumn = createDataTableColumnHelper<PermissionTableData>();

const permissionColumns = permissionColumn.columns([
  permissionColumn.accessor("display_name", {
    header: "Permission",
    cell: ({ getValue }) => (
      <span className="font-medium text-foreground">{getValue()}</span>
    ),
  }),
  permissionColumn.accessor("name", {
    header: "Key",
    cell: ({ row }) => (
      <PermissionBadge
        resource={row.original.resource}
        action={row.original.action}
      />
    ),
  }),
  permissionColumn.accessor("resource", {
    header: "Resource",
    cell: ({ getValue }) => (
      <Badge variant="neutral" className="capitalize">
        {getValue()}
      </Badge>
    ),
    filterFn: "arrHas",
  }),
  permissionColumn.accessor("action", {
    header: "Action",
    cell: ({ getValue }) => <span className="capitalize">{getValue()}</span>,
    filterFn: "arrHas",
    enableGlobalFilter: false,
  }),
  permissionColumn.accessor("roles_count", {
    header: "Roles",
    meta: { align: "end", numeric: true },
    cell: ({ getValue }) => plural(getValue(), "role"),
    enableGlobalFilter: false,
  }),
]);

// Resources and actions are read from the permissions themselves, so a new one shows up by itself.
const PERMISSION_FACETS = [
  { column: "resource", title: "Resource" },
  { column: "action", title: "Action" },
];

export default function AdminRolesPage() {
  // Unified Dialog state
  const [dialogState, setDialogState] = useState<RolesDialogState>({
    type: "closed",
  });

  const closeDialog = () => setDialogState({ type: "closed" });

  // Row actions are gated on the same permissions the backend enforces on the
  // corresponding routes, so the UI never offers an action that would 403.
  // Declared before the early error return below to keep hook order stable.
  const canUpdateRole = usePermission(ROLE_PERMISSIONS.UPDATE);
  const canDeleteRole = usePermission(ROLE_PERMISSIONS.DELETE);
  const canManageRolePermissions = usePermission(
    ROLE_PERMISSIONS.MANAGE_PERMISSIONS,
  );
  // Viewing a role's permissions is a read; editing them needs manage_permissions.
  const canReadRole = usePermission(ROLE_PERMISSIONS.READ);
  const canUpdatePermission = usePermission(
    ROLE_PERMISSIONS.MANAGE_PERMISSIONS,
  );

  // Fetch roles with permissions
  const {
    data: rolesData,
    isLoading: rolesLoading,
    error: rolesError,
    refetch: refetchRoles,
  } = useQuery({
    queryKey: ["roles"],
    queryFn: () => apiClient.roles.list(true),
  });

  // Fetch permissions with roles
  const {
    data: permissionsData,
    isLoading: permissionsLoading,
    error: permissionsError,
    refetch: refetchPermissions,
  } = useQuery({
    queryKey: ["permissions"],
    queryFn: () => apiClient.roles.listPermissions(undefined, true),
  });
  const allPermissions = permissionsData?.permissions || [];
  const customRolePermissions = allPermissions.filter(
    isWorkspaceAssignablePermission,
  );

  // Roles shown in the table and passed to this page's dialogs. Excludes the
  // platform floor role (see PLATFORM_FLOOR_ROLE above).
  const visibleRoles = (rolesData?.roles || []).filter(
    (role) => role.name !== PLATFORM_FLOOR_ROLE,
  );

  if (rolesError || permissionsError) {
    return (
      <ErrorPage
        title="Failed to load roles and permissions"
        message="We could not load role and permission data. Please retry."
        retry={() => {
          void refetchRoles();
          void refetchPermissions();
        }}
      />
    );
  }

  // Transform roles data for DataTable
  // Only count permissions that are present in the permissionsData and common across the app
  const allPermissionIds = new Set(allPermissions.map((p) => p.id));
  const customRolePermissionIds = new Set(
    customRolePermissions.map((p) => p.id),
  );

  const rolesTableData: RoleTableData[] = visibleRoles.map((role) => {
    const visibleIds = isProtectedRole(role)
      ? allPermissionIds
      : customRolePermissionIds;
    const validPermissions =
      role.permissions?.filter((p) => visibleIds.has(p.id)) || [];

    return {
      id: role.id,
      name: role.name,
      display_name: role.display_name,
      is_system_role: role.is_system_role,
      permissions_count: validPermissions.length,
      description: role.description,
    };
  });

  // Transform permissions data for DataTable
  const permissionsTableData: PermissionTableData[] = allPermissions.map(
    (permission) => ({
      id: permission.id,
      name: permission.name,
      display_name: permission.display_name,
      resource: permission.resource,
      action: permission.action,
      roles_count: permission.roles?.length || 0,
      description: permission.description,
      is_system: permission.is_system,
    }),
  );

  // Role actions
  //
  // Hidden entirely when the user lacks the backend permission for them, and
  // disabled on protected roles — the backend rejects update/delete for system
  // roles AND standard workspace roles, which carry is_system_role = false.
  const roleActions = (row: RoleTableData): DataTableRowAction[] => {
    const role = visibleRoles.find((r) => r.id === row.id);
    if (!role) return [];
    const isProtected = isProtectedRole(row);
    const lockedReason = (verb: string) =>
      isProtected
        ? row.is_system_role
          ? `System roles cannot be ${verb}`
          : `Standard workspace roles cannot be ${verb}`
        : false;
    const readOnly = isProtected || !canManageRolePermissions;
    return [
      ...(canManageRolePermissions || canReadRole
        ? [
            {
              label: readOnly ? "View permissions" : "Manage permissions",
              icon: readOnly ? Eye : Settings,
              onSelect: () =>
                setDialogState({ type: "manageRolePermissions", role }),
            },
          ]
        : []),
      ...(canUpdateRole
        ? [
            {
              label: "Edit",
              icon: Edit,
              disabled: lockedReason("edited"),
              onSelect: () => setDialogState({ type: "editRole", role }),
            },
          ]
        : []),
      ...(canDeleteRole
        ? [
            {
              label: "Delete",
              icon: Trash2,
              destructive: true,
              disabled: lockedReason("deleted"),
              onSelect: () => setDialogState({ type: "deleteRole", role }),
            },
          ]
        : []),
    ];
  };

  // Permission actions — Edit hidden without the matching backend
  // permission. View Dependencies is derived from already-loaded data and
  // needs nothing beyond the permission.read this page already requires.
  const permissionActions = (
    row: PermissionTableData,
  ): DataTableRowAction[] => {
    const permission = permissionsData?.permissions.find(
      (p) => p.id === row.id,
    );
    if (!permission) return [];
    return [
      {
        label: "View dependencies",
        icon: Network,
        onSelect: () => setDialogState({ type: "dependencyView", permission }),
      },
      ...(canUpdatePermission
        ? [
            {
              label: "Edit",
              icon: Edit,
              onSelect: () =>
                setDialogState({ type: "editPermission", permission }),
            },
          ]
        : []),
    ];
  };

  // Three buckets, not two. The seeded workspace roles (workspace_owner,
  // workspace_admin, editor, viewer) carry is_system_role = false because that
  // flag means "platform-scoped", not "built-in" — the backend still refuses to
  // edit or delete them (RoleService._is_protected_role). Deriving custom as
  // "everything that isn't a system role" therefore reported those four seeded
  // roles as user-created ones that nobody ever created.
  // Counts come from visibleRoles so they match the table; the platform floor
  // role is excluded from all of them.
  const systemRolesCount =
    visibleRoles.filter((r) => r.is_system_role).length || 0;
  const builtInRolesCount =
    visibleRoles.filter((r) => isProtectedRole(r) && !r.is_system_role)
      .length || 0;
  const customRolesCount =
    visibleRoles.filter((r) => !isProtectedRole(r)).length || 0;

  return (
    <ListPage
      title="Roles & Permissions"
      description="Configure system roles and assign permissions"
    >
      <PermissionGuard
        permission={ROLE_PERMISSIONS.READ}
        fallback={
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to view roles and permissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Required permissions:{" "}
                <code className="text-xs bg-muted px-1 rounded-md">
                  role:read
                </code>{" "}
                OR{" "}
                <code className="text-xs bg-muted px-1 rounded-md">
                  permission:read
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
                  Total Roles
                </CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{visibleRoles.length}</div>
                <p className="text-xs text-muted-foreground">
                  {systemRolesCount} system, {builtInRolesCount} built-in,{" "}
                  {customRolesCount} custom
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Permissions
                </CardTitle>
                <Key className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {permissionsData?.count || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Available permissions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  System Roles
                </CardTitle>
                <LockKeyhole className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemRolesCount}</div>
                <p className="text-xs text-muted-foreground">Platform roles</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Custom Roles
                </CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customRolesCount}</div>
                <p className="text-xs text-muted-foreground">
                  User-created roles
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="roles" className="space-y-4">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="roles">
                  <Shield className="h-4 w-4" />
                  Roles
                </TabsTrigger>
                <TabsTrigger value="permissions">
                  <Key className="h-4 w-4" />
                  Permissions
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Roles Tab */}
            <TabsContent value="roles" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start gap-2 sm:items-center sm:justify-between">
                    <div>
                      <CardTitle>Roles</CardTitle>
                      <CardDescription>
                        Manage system and custom roles
                      </CardDescription>
                    </div>
                    <div className="w-full sm:w-auto flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <PermissionGuard permission={ROLE_PERMISSIONS.CREATE}>
                        <Button
                          onClick={() => setDialogState({ type: "createRole" })}
                          className="w-full sm:w-auto"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Role
                        </Button>
                      </PermissionGuard>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <DataTable
                    caption="Roles"
                    columns={roleColumns}
                    data={rolesTableData}
                    getRowId={(role) => role.id}
                    getRowLabel={(role) => role.display_name}
                    isLoading={rolesLoading}
                    surface="plain"
                    search={{ placeholder: "Search roles" }}
                    rowActions={roleActions}
                    pageSizeOptions={[10, 25, 50]}
                    emptyState={
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        No roles yet: create the first custom role.
                      </p>
                    }
                    renderCard={(role, { actions }) => (
                      <div className="flex items-start gap-3">
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <p className="flex items-center gap-2 font-medium text-foreground">
                            <span className="truncate">
                              {role.display_name}
                            </span>
                            <RoleBadge
                              isSystemRole={role.is_system_role}
                              isBuiltIn={isProtectedRole(role)}
                            />
                          </p>
                          <p className="num text-muted-foreground">
                            {plural(role.permissions_count, "permission")}
                          </p>
                        </div>
                        {actions}
                      </div>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Permissions Tab */}
            <TabsContent value="permissions" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start gap-3 sm:items-center justify-between">
                    <div>
                      <CardTitle>Permissions</CardTitle>
                      <CardDescription>
                        Manage system permissions
                      </CardDescription>
                    </div>
                    <PermissionGuard permission={ROLE_PERMISSIONS.CREATE}>
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => setDialogState({ type: "bulkAssign" })}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Bulk Assign
                      </Button>
                    </PermissionGuard>
                  </div>
                </CardHeader>
                <CardContent>
                  <DataTable
                    caption="Permissions"
                    columns={permissionColumns}
                    data={permissionsTableData}
                    getRowId={(permission) => permission.id}
                    getRowLabel={(permission) => permission.display_name}
                    isLoading={permissionsLoading}
                    surface="plain"
                    search={{ placeholder: "Search permissions" }}
                    facets={PERMISSION_FACETS}
                    rowActions={permissionActions}
                    pageSizeOptions={[10, 25, 50, 100]}
                    emptyState={
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        No permissions: they are the building blocks of roles.
                      </p>
                    }
                    renderCard={(permission, { actions }) => (
                      <div className="flex items-start gap-3">
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                          <p className="truncate font-medium text-foreground">
                            {permission.display_name}
                          </p>
                          <PermissionBadge
                            resource={permission.resource}
                            action={permission.action}
                          />
                        </div>
                        {actions}
                      </div>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Dialogs */}
        <CreateRoleDialog
          open={dialogState.type === "createRole"}
          onOpenChange={closeDialog}
          permissions={customRolePermissions}
        />
        <EditRoleDialog
          open={dialogState.type === "editRole"}
          onOpenChange={closeDialog}
          role={dialogState.type === "editRole" ? dialogState.role : null}
        />
        <DeleteRoleDialog
          open={dialogState.type === "deleteRole"}
          onOpenChange={closeDialog}
          role={dialogState.type === "deleteRole" ? dialogState.role : null}
          roles={visibleRoles}
        />
        <ManageRolePermissionsDialog
          open={dialogState.type === "manageRolePermissions"}
          onOpenChange={closeDialog}
          role={
            dialogState.type === "manageRolePermissions"
              ? dialogState.role
              : null
          }
          allPermissions={
            dialogState.type === "manageRolePermissions" &&
            isProtectedRole(dialogState.role)
              ? allPermissions
              : customRolePermissions
          }
          canManage={canManageRolePermissions}
        />

        <EditPermissionDialog
          open={dialogState.type === "editPermission"}
          onOpenChange={closeDialog}
          permission={
            dialogState.type === "editPermission"
              ? dialogState.permission
              : null
          }
        />
        <BulkAssignPermissionsDialog
          open={dialogState.type === "bulkAssign"}
          onOpenChange={closeDialog}
          roles={visibleRoles}
          allPermissions={customRolePermissions}
        />
        <PermissionDependencyView
          open={dialogState.type === "dependencyView"}
          onOpenChange={closeDialog}
          permission={
            dialogState.type === "dependencyView"
              ? dialogState.permission
              : null
          }
          allPermissions={allPermissions}
        />
      </PermissionGuard>
    </ListPage>
  );
}
