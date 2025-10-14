"use client";

import { PageLayout } from "@/components/page-layout";
import { CanAccess } from "@/components/permissions/can-access";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PERMISSIONS } from "@/lib/permissions";

export default function AdminRolesPage() {
  const breadcrumbs = [
    { label: "Admin", href: "/admin" },
    { label: "Roles & Permissions" },
  ];

  return (
    <PageLayout
      title="Roles & Permissions"
      description="Configure system roles and assign permissions"
      breadcrumbs={breadcrumbs}
    >
      <CanAccess
        anyPermission={[PERMISSIONS.ROLE_READ, PERMISSIONS.PERMISSION_READ]}
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
        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>
              Role and permission management interface will be implemented in a
              future update
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <p className="font-medium">Planned Features:</p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>View all roles and their permissions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Create new roles with custom permissions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Edit existing role configurations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Assign/revoke permissions from roles</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>View permission hierarchy and dependencies</span>
                </li>
              </ul>
              <p className="text-muted-foreground mt-4">
                This page demonstrates permission-based access control. Users
                need either{" "}
                <code className="bg-muted px-1 rounded">role:read</code> OR{" "}
                <code className="bg-muted px-1 rounded">permission:read</code>{" "}
                permission to access this page.
              </p>
            </div>
          </CardContent>
        </Card>
      </CanAccess>
    </PageLayout>
  );
}
