"use client";

import { Info, Network, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PermissionWithRoles } from "@/types/role";

interface PermissionDependencyViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permission: PermissionWithRoles | null;
  allPermissions: PermissionWithRoles[];
}

import { PERMISSION_DEPENDENCIES } from "@/lib/permission-dependencies";

export function PermissionDependencyView({
  open,
  onOpenChange,
  permission,
  allPermissions,
}: PermissionDependencyViewProps) {
  if (!permission) return null;

  // Get dependencies for this permission
  const dependencies = PERMISSION_DEPENDENCIES[permission.name] || [];

  // Find permissions that depend on this one
  const dependents = Object.entries(PERMISSION_DEPENDENCIES)
    .filter(([_, deps]) => deps.includes(permission.name))
    .map(([permName]) => permName);

  // Find related permissions (same resource)
  const relatedPermissions = allPermissions.filter(
    (p) => p.resource === permission.resource && p.id !== permission.id,
  );

  // Group by hierarchy
  const hierarchyGroups = {
    read: relatedPermissions.filter((p) => p.action === "read"),
    write: relatedPermissions.filter((p) =>
      ["create", "update"].includes(p.action),
    ),
    delete: relatedPermissions.filter((p) => p.action === "delete"),
    manage: relatedPermissions.filter((p) =>
      ["manage", "approve", "publish"].includes(p.action),
    ),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Permission Dependencies & Relationships
          </DialogTitle>
          <DialogDescription>
            Understanding how <strong>{permission.display_name}</strong> relates
            to other permissions
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6 py-4">
            {/* Current Permission Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Current Permission</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {permission.name}
                    </Badge>
                    <Badge variant="secondary" className="capitalize">
                      {permission.action}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {permission.description || "No description available"}
                  </p>
                  {permission.roles && permission.roles.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs font-medium mb-1">
                        Assigned to {permission.roles.length} role(s):
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {permission.roles.map((role) => (
                          <Badge
                            key={role.id}
                            variant="outline"
                            className="text-xs"
                          >
                            {role.display_name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Required Dependencies */}
            {dependencies.length > 0 && (
              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                <CardHeader>
                  <CardTitle className="text-base text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Required Dependencies
                  </CardTitle>
                  <CardDescription className="text-blue-800 dark:text-blue-200">
                    These permissions should also be granted when granting this
                    permission
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dependencies.map((depName) => {
                      const depPerm = allPermissions.find(
                        (p) => p.name === depName,
                      );
                      return (
                        <div
                          key={depName}
                          className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded-md"
                        >
                          <div>
                            <div className="font-mono text-sm">{depName}</div>
                            {depPerm && (
                              <div className="text-xs text-muted-foreground">
                                {depPerm.display_name}
                              </div>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Required
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dependent Permissions */}
            {dependents.length > 0 && (
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                <CardHeader>
                  <CardTitle className="text-base text-orange-900 dark:text-orange-100 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Dependent Permissions
                  </CardTitle>
                  <CardDescription className="text-orange-800 dark:text-orange-200">
                    These permissions require this permission as a prerequisite
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dependents.map((depName) => {
                      const depPerm = allPermissions.find(
                        (p) => p.name === depName,
                      );
                      return (
                        <div
                          key={depName}
                          className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded-md"
                        >
                          <div>
                            <div className="font-mono text-sm">{depName}</div>
                            {depPerm && (
                              <div className="text-xs text-muted-foreground">
                                {depPerm.display_name}
                              </div>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Depends on this
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Related Permissions by Hierarchy */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Related Permissions ({permission.resource})
                </CardTitle>
                <CardDescription>
                  Other permissions for the same resource, grouped by hierarchy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Read Permissions */}
                  {hierarchyGroups.read.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-green-700 dark:text-green-400">
                        📖 Read Permissions (Base Level)
                      </h4>
                      <div className="space-y-1">
                        {hierarchyGroups.read.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between text-sm p-2 bg-green-50 dark:bg-green-950/20 rounded-md"
                          >
                            <span className="font-mono">{p.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {p.display_name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Write Permissions */}
                  {hierarchyGroups.write.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-blue-700 dark:text-blue-400">
                        ✏️ Write Permissions (Intermediate Level)
                      </h4>
                      <div className="space-y-1">
                        {hierarchyGroups.write.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between text-sm p-2 bg-blue-50 dark:bg-blue-950/20 rounded-md"
                          >
                            <span className="font-mono">{p.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {p.display_name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Manage Permissions */}
                  {hierarchyGroups.manage.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-purple-700 dark:text-purple-400">
                        ⚙️ Management Permissions (Advanced Level)
                      </h4>
                      <div className="space-y-1">
                        {hierarchyGroups.manage.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between text-sm p-2 bg-purple-50 dark:bg-purple-950/20 rounded-md"
                          >
                            <span className="font-mono">{p.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {p.display_name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Delete Permissions */}
                  {hierarchyGroups.delete.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-red-700 dark:text-red-400">
                        🗑️ Delete Permissions (Destructive)
                      </h4>
                      <div className="space-y-1">
                        {hierarchyGroups.delete.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between text-sm p-2 bg-red-50 dark:bg-red-950/20 rounded-md"
                          >
                            <span className="font-mono">{p.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {p.display_name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Best Practices Alert */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Best Practice:</strong> When assigning permissions,
                always ensure dependent permissions are also assigned. For
                example, before granting delete permissions, ensure read
                permissions are already granted.
              </AlertDescription>
            </Alert>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
