"use client";

import { Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useWorkspace } from "@/providers/workspace-provider";

export function TeamAccessSection() {
  const { workspaceSlug } = useWorkspace();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team & Access</CardTitle>
        <CardDescription>
          Manage team members, roles, and permissions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Link to Members Page */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Team Management</h4>
          <p className="text-sm text-muted-foreground">
            Add, remove, or manage individual team members and their roles
          </p>
          <Button variant="outline" asChild>
            <Link href={`/workspaces/${workspaceSlug}/members`}>
              <Users className="h-4 w-4 mr-2" />
              Manage Team Members
            </Link>
          </Button>
        </div>

        {/* Role Overview */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Workspace Roles</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h5 className="text-sm font-medium">Owner</h5>
                <p className="text-sm text-muted-foreground">
                  Full access to all workspace features and settings
                </p>
              </div>
              <span className="text-xs text-muted-foreground">System Role</span>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h5 className="text-sm font-medium">Admin</h5>
                <p className="text-sm text-muted-foreground">
                  Can manage members, content, and most settings
                </p>
              </div>
              <span className="text-xs text-muted-foreground">System Role</span>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h5 className="text-sm font-medium">Editor</h5>
                <p className="text-sm text-muted-foreground">
                  Can create and edit content
                </p>
              </div>
              <span className="text-xs text-muted-foreground">System Role</span>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h5 className="text-sm font-medium">Viewer</h5>
                <p className="text-sm text-muted-foreground">
                  Read-only access to workspace content
                </p>
              </div>
              <span className="text-xs text-muted-foreground">System Role</span>
            </div>
          </div>
        </div>

        {/* Invitation Settings */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Invitation Settings</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-medium">Invitation Expiry</p>
                <p className="text-sm text-muted-foreground">
                  Invitations expire after 7 days
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-medium">Who Can Invite</p>
                <p className="text-sm text-muted-foreground">
                  Owners and Admins can invite new members
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
