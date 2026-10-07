"use client";

import { Info, Network, Shield } from "lucide-react";
import { Notice } from "@/components/ui/notice";
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
              <Card className="border-border bg-muted/40">
                <CardHeader>
                  <CardTitle className="text-base text-foreground flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Required Dependencies
                  </CardTitle>
                  <CardDescription className="text-foreground">
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
                          className="flex items-center justify-between p-2 bg-card rounded-md"
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
              <Card className="border-warning-200 bg-warning-50">
                <CardHeader>
                  <CardTitle className="text-base text-warning-700 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Dependent Permissions
                  </CardTitle>
                  <CardDescription className="text-warning-700">
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
                          className="flex items-center justify-between p-2 bg-card rounded-md"
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
                      <h4 className="text-sm font-semibold mb-2 text-foreground">
                        📖 Read Permissions (Base Level)
                      </h4>
                      <div className="space-y-1">
                        {hierarchyGroups.read.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between text-sm p-2 bg-surface-inset rounded-md"
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
                      <h4 className="text-sm font-semibold mb-2 text-foreground">
                        ✏️ Write Permissions (Intermediate Level)
                      </h4>
                      <div className="space-y-1">
                        {hierarchyGroups.write.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between text-sm p-2 bg-surface-inset rounded-md"
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
                      <h4 className="text-sm font-semibold mb-2 text-foreground">
                        ⚙️ Management Permissions (Advanced Level)
                      </h4>
                      <div className="space-y-1">
                        {hierarchyGroups.manage.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between text-sm p-2 bg-surface-inset rounded-md"
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
                      <h4 className="text-sm font-semibold mb-2 text-danger-700">
                        🗑️ Delete Permissions (Destructive)
                      </h4>
                      <div className="space-y-1">
                        {hierarchyGroups.delete.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between text-sm p-2 bg-danger-50 rounded-md"
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
            <Notice title="Best practice">
              When assigning permissions, always ensure dependent permissions
              are also assigned. For example, before granting delete
              permissions, ensure read permissions are already granted.
            </Notice>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
