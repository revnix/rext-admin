"use client";

import { Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Workspace Team Settings Page
 *
 * Manages:
 * - Workspace roles and permissions
 * - Default member permissions
 * - Invitation settings
 * - Team collaboration settings
 *
 * Note: For managing individual team members, use the Users page.
 */
export default function WorkspaceTeamSettings() {
  return (
    <div className="space-y-6">
      {/* Quick Access */}
      <Card>
        <CardHeader>
          <CardTitle>Team Management</CardTitle>
          <CardDescription>
            For adding, removing, or managing individual team members, visit the
            Users page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <a href="../users">
              <Link className="h-4 w-4 mr-2" />
              Go to Users Page
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Workspace Roles */}
      <Card>
        <CardHeader>
          <CardTitle>Workspace Roles</CardTitle>
          <CardDescription>
            Define custom roles and their permissions for this workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="text-sm font-medium">Owner</h4>
                <p className="text-sm text-muted-foreground">
                  Full access to all workspace features and settings
                </p>
              </div>
              <span className="text-xs text-muted-foreground">System Role</span>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="text-sm font-medium">Admin</h4>
                <p className="text-sm text-muted-foreground">
                  Can manage members, content, and most settings
                </p>
              </div>
              <span className="text-xs text-muted-foreground">System Role</span>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="text-sm font-medium">Editor</h4>
                <p className="text-sm text-muted-foreground">
                  Can create and edit content
                </p>
              </div>
              <span className="text-xs text-muted-foreground">System Role</span>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="text-sm font-medium">Viewer</h4>
                <p className="text-sm text-muted-foreground">
                  Read-only access to workspace content
                </p>
              </div>
              <span className="text-xs text-muted-foreground">System Role</span>
            </div>

            <p className="text-sm text-muted-foreground">
              Custom workspace roles will be available in a future update.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Default Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Default Permissions</CardTitle>
          <CardDescription>
            Set default permissions for new workspace members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            New members will automatically receive the role selected during
            invitation.
          </p>
        </CardContent>
      </Card>

      {/* Invitation Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Invitation Settings</CardTitle>
          <CardDescription>Configure how team invitations work</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Invitation Expiry</p>
              <p className="text-sm text-muted-foreground">
                Invitations expire after 7 days
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Who Can Invite</p>
              <p className="text-sm text-muted-foreground">
                Owners and Admins can invite new members
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground pt-2">
            Advanced invitation settings will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
