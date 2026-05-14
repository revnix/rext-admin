"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Edit,
  History,
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
import { CreatePermissionDialog } from "@/components/admin/roles/create-permission-dialog";
import { CreateRoleDialog } from "@/components/admin/roles/create-role-dialog";
import { DeletePermissionDialog } from "@/components/admin/roles/delete-permission-dialog";
import { DeleteRoleDialog } from "@/components/admin/roles/delete-role-dialog";
import { EditPermissionDialog } from "@/components/admin/roles/edit-permission-dialog";
import { EditRoleDialog } from "@/components/admin/roles/edit-role-dialog";
import { ManageRolePermissionsDialog } from "@/components/admin/roles/manage-role-permissions-dialog";
import { PermissionBadge } from "@/components/admin/roles/permission-badge";
import { PermissionDependencyView } from "@/components/admin/roles/permission-dependency-view";
import { RoleBadge } from "@/components/admin/roles/role-badge";
import { RolePermissionAuditLog } from "@/components/admin/roles/role-permission-audit-log";
import { DataTable } from "@/components/data-table";
import { PageLayout } from "@/components/page-layout";
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
import { ErrorPage } from "@/components/ui/error-states";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api-client";
import { ADMIN_PERMISSIONS } from "@/lib/permissions";
import type { Column, RowAction } from "@/types/data-table";
import type { PermissionWithRoles, RoleWithPermissions } from "@/types/role";

interface RoleTableData extends Record<string, unknown> {
  id: string;
  name: string;
  display_name: string;
  hierarchy_level: number;
  is_system_role: boolean;
  permissions_count: number;
  description?: string;
}

interface PermissionTableData extends Record<string, unknown> {
  id: string;
  name: string;
  display_name: string;
  resource: string;
  action: string;
  roles_count: number;
  description?: string;
}

type RolesDialogState =
  | { type: "closed" }
  | { type: "createRole" }
  | { type: "editRole"; role: RoleWithPermissions }
  | { type: "deleteRole"; role: RoleWithPermissions }
  | { type: "manageRolePermissions"; role: RoleWithPermissions }
  | { type: "createPermission" }
  | { type: "editPermission"; permission: PermissionWithRoles }
  | { type: "deletePermission"; permission: PermissionWithRoles }
  | { type: "bulkAssign" }
  | { type: "dependencyView"; permission: PermissionWithRoles }
  | { type: "auditLog" };

export default function AdminRolesPage() {
  // Unified Dialog state
  const [dialogState, setDialogState] = useState<RolesDialogState>({
    type: "closed",
  });

  const closeDialog = () => setDialogState({ type: "closed" });

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
  const systemPermissionIds = new Set(
    (permissionsData?.permissions || []).map((p) => p.id),
  );

  const rolesTableData: RoleTableData[] = (rolesData?.roles || []).map(
    (role) => {
      const validPermissions =
        role.permissions?.filter((p) => systemPermissionIds.has(p.id)) || [];

      return {
        id: role.id,
        name: role.name,
        display_name: role.display_name,
        hierarchy_level: role.hierarchy_level,
        is_system_role: role.is_system_role,
        permissions_count: Math.min(validPermissions.length, 50),
        description: role.description,
      };
    },
  );

  // Transform permissions data for DataTable
  const permissionsTableData: PermissionTableData[] = (
    permissionsData?.permissions || []
  ).map((permission) => ({
    id: permission.id,
    name: permission.name,
    display_name: permission.display_name,
    resource: permission.resource,
    action: permission.action,
    roles_count: permission.roles?.length || 0,
    description: permission.description,
  }));

  // Role columns
  const roleColumns: Column<RoleTableData>[] = [
    {
      key: "display_name",
      header: "Role Name",
      width: "200px",
      cell: (value, row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{value as string}</span>
          <RoleBadge isSystemRole={row.is_system_role} />
        </div>
      ),
      searchable: true,
    },
    {
      key: "name",
      header: "Internal Name",
      width: "180px",
      cell: (value) => (
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
          {value as string}
        </code>
      ),
      searchable: true,
    },
    {
      key: "hierarchy_level",
      header: "Level",
      width: "100px",
      cell: (value) => (
        <Badge variant="outline" className="font-mono">
          {value as number}
        </Badge>
      ),
    },
    {
      key: "permissions_count",
      header: "Permissions",
      width: "120px",
      cell: (value) => (
        <Badge variant="secondary">
          {value as number} permission{value !== 1 ? "s" : ""}
        </Badge>
      ),
    },
    {
      key: "description",
      header: "Description",
      cell: (value) => (
        <span className="text-sm text-muted-foreground line-clamp-1">
          {value as string}
        </span>
      ),
    },
  ];

  // Role actions
  const roleActions: RowAction<RoleTableData>[] = [
    {
      label: "Manage Permissions",
      icon: <Settings className="h-4 w-4" />,
      onClick: (row) => {
        const role = rolesData?.roles.find((r) => r.id === row.id);
        if (role) {
          setDialogState({ type: "manageRolePermissions", role });
        }
      },
      primary: true,
    },
    {
      label: "Edit",
      icon: <Edit className="h-4 w-4" />,
      onClick: (row) => {
        const role = rolesData?.roles.find((r) => r.id === row.id);
        if (role) {
          setDialogState({ type: "editRole", role });
        }
      },
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row) => {
        const role = rolesData?.roles.find((r) => r.id === row.id);
        if (role && !role.is_system_role) {
          setDialogState({ type: "deleteRole", role });
        }
      },
      variant: "destructive",
      disabled: (row) => row.is_system_role,
    },
  ];

  // Permission columns
  const permissionColumns: Column<PermissionTableData>[] = [
    {
      key: "display_name",
      header: "Permission Name",
      width: "220px",
      cell: (value) => <span className="font-medium">{value as string}</span>,
      searchable: true,
    },
    {
      key: "name",
      header: "Permission",
      width: "200px",
      cell: (_value, row) => (
        <PermissionBadge resource={row.resource} action={row.action} />
      ),
      searchable: true,
    },
    {
      key: "resource",
      header: "Resource",
      width: "150px",
      cell: (value) => (
        <Badge variant="outline" className="capitalize">
          {value as string}
        </Badge>
      ),
    },
    {
      key: "action",
      header: "Action",
      width: "120px",
      cell: (value) => (
        <Badge variant="secondary" className="capitalize">
          {value as string}
        </Badge>
      ),
    },
    {
      key: "roles_count",
      header: "Roles",
      width: "100px",
      cell: (value) => (
        <Badge variant="outline">
          {value as number} role{value !== 1 ? "s" : ""}
        </Badge>
      ),
    },
  ];

  // Permission actions
  const permissionActions: RowAction<PermissionTableData>[] = [
    {
      label: "View Dependencies",
      icon: <Network className="h-4 w-4" />,
      onClick: (row) => {
        const permission = permissionsData?.permissions.find(
          (p) => p.id === row.id,
        );
        if (permission) {
          setDialogState({ type: "dependencyView", permission });
        }
      },
      primary: true,
    },
    {
      label: "Edit",
      icon: <Edit className="h-4 w-4" />,
      onClick: (row) => {
        const permission = permissionsData?.permissions.find(
          (p) => p.id === row.id,
        );
        if (permission) {
          setDialogState({ type: "editPermission", permission });
        }
      },
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row) => {
        const permission = permissionsData?.permissions.find(
          (p) => p.id === row.id,
        );
        if (permission) {
          setDialogState({ type: "deletePermission", permission });
        }
      },
      variant: "destructive",
    },
  ];

  const systemRolesCount =
    rolesData?.roles?.filter((r) => r.is_system_role).length || 0;
  const customRolesCount = (rolesData?.count || 0) - systemRolesCount;

  return (
    <PageLayout
      title="Roles & Permissions"
      description="Configure system roles and assign permissions"
    >
      <PermissionGuard
        anyPermission={[
          ADMIN_PERMISSIONS.ROLE_READ,
          ADMIN_PERMISSIONS.PERMISSION_READ,
        ]}
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
                <code className="text-xs bg-muted px-1 rounded">role:read</code>{" "}
                OR{" "}
                <code className="text-xs bg-muted px-1 rounded">
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
                <div className="text-2xl font-bold">
                  {rolesData?.count || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {systemRolesCount} system, {customRolesCount} custom
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
                <p className="text-xs text-muted-foreground">Protected roles</p>
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
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => setDialogState({ type: "auditLog" })}
                      >
                        <History className="h-4 w-4 mr-2" />
                        Audit Log
                      </Button>
                      <PermissionGuard
                        permission={ADMIN_PERMISSIONS.ROLE_CREATE}
                      >
                        <Button
                          variant="outline"
                          className="w-full sm:w-auto"
                          onClick={() => setDialogState({ type: "bulkAssign" })}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Bulk Assign
                        </Button>
                      </PermissionGuard>
                      <PermissionGuard
                        permission={ADMIN_PERMISSIONS.ROLE_CREATE}
                      >
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
                    columns={roleColumns}
                    data={rolesTableData}
                    isLoading={rolesLoading}
                    rowActions={roleActions}
                    emptyTitle="No roles found"
                    emptyDescription="Create your first custom role to get started"
                    searchPlaceholder="Search by role name..."
                    searchFields={["display_name", "name"]}
                    pageSize={10}
                    pageSizeOptions={[10, 25, 50]}
                    tableId="admin-roles"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Permissions Tab */}
            <TabsContent value="permissions" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Permissions</CardTitle>
                      <CardDescription>
                        Manage system permissions
                      </CardDescription>
                    </div>
                    <PermissionGuard
                      permission={ADMIN_PERMISSIONS.PERMISSION_CREATE}
                    >
                      <Button
                        onClick={() =>
                          setDialogState({ type: "createPermission" })
                        }
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Permission
                      </Button>
                    </PermissionGuard>
                  </div>
                </CardHeader>
                <CardContent>
                  <DataTable
                    columns={permissionColumns}
                    data={permissionsTableData}
                    isLoading={permissionsLoading}
                    rowActions={permissionActions}
                    emptyTitle="No permissions found"
                    emptyDescription="Permissions are the building blocks of roles"
                    searchPlaceholder="Search by name or resource..."
                    searchFields={["display_name", "name", "resource"]}
                    pageSize={10}
                    pageSizeOptions={[10, 25, 50, 100]}
                    tableId="admin-permissions"
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
          permissions={permissionsData?.permissions || []}
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
        />
        <ManageRolePermissionsDialog
          open={dialogState.type === "manageRolePermissions"}
          onOpenChange={closeDialog}
          role={
            dialogState.type === "manageRolePermissions"
              ? dialogState.role
              : null
          }
          allPermissions={permissionsData?.permissions || []}
        />
        <CreatePermissionDialog
          open={dialogState.type === "createPermission"}
          onOpenChange={closeDialog}
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
        <DeletePermissionDialog
          open={dialogState.type === "deletePermission"}
          onOpenChange={closeDialog}
          permission={
            dialogState.type === "deletePermission"
              ? dialogState.permission
              : null
          }
        />
        <BulkAssignPermissionsDialog
          open={dialogState.type === "bulkAssign"}
          onOpenChange={closeDialog}
          roles={rolesData?.roles || []}
          allPermissions={permissionsData?.permissions || []}
        />
        <PermissionDependencyView
          open={dialogState.type === "dependencyView"}
          onOpenChange={closeDialog}
          permission={
            dialogState.type === "dependencyView"
              ? dialogState.permission
              : null
          }
          allPermissions={permissionsData?.permissions || []}
        />
        <RolePermissionAuditLog
          open={dialogState.type === "auditLog"}
          onOpenChange={closeDialog}
        />
      </PermissionGuard>
    </PageLayout>
  );
}
