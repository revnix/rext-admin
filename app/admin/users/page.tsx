"use client";

import { UserCog } from "lucide-react";
import { CanAccess } from "@/components/permissions/can-access";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PERMISSIONS } from "@/lib/permissions";

export default function AdminUsersPage() {
  return (
    <CanAccess
      permission={PERMISSIONS.USER_READ}
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
              <code className="text-xs bg-muted px-1 rounded">user:read</code>
            </p>
          </CardContent>
        </Card>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <UserCog className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">User Management</h2>
            <p className="text-muted-foreground">
              Manage system users and their accounts
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>
              User management interface will be implemented in a future update
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <p className="font-medium">Planned Features:</p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>View all users with filtering and search</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Edit user details and profiles</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Assign roles to users</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Suspend or activate user accounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>View user activity and login history</span>
                </li>
              </ul>
              <p className="text-muted-foreground mt-4">
                This page demonstrates admin-only access control. Only users
                with the{" "}
                <code className="bg-muted px-1 rounded">user:read</code>{" "}
                permission can view this page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </CanAccess>
  );
}
