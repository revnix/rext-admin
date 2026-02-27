"use client";

import { PermissionGuard } from "@/components/permission/permission-guard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WORKSPACE_PERMISSIONS } from "@/lib/permissions";

export function WorkspacePreferencesSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace Preferences</CardTitle>
        <CardDescription>
          Configure default settings and preferences for this workspace
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PermissionGuard
          permission={WORKSPACE_PERMISSIONS.UPDATE}
          fallback={
            <p className="text-sm text-muted-foreground">
              You don't have permission to edit workspace preferences.
            </p>
          }
        >
          <div className="space-y-4">
            {/* Default Timezone */}
            <div className="space-y-2">
              <Label htmlFor="timezone">Default Timezone</Label>
              <Select defaultValue="utc" disabled>
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utc">UTC</SelectItem>
                  <SelectItem value="america/new_york">
                    America/New York (EST)
                  </SelectItem>
                  <SelectItem value="america/los_angeles">
                    America/Los Angeles (PST)
                  </SelectItem>
                  <SelectItem value="europe/london">
                    Europe/London (GMT)
                  </SelectItem>
                  <SelectItem value="asia/tokyo">Asia/Tokyo (JST)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Default timezone for content scheduling and timestamps
              </p>
            </div>

            {/* Future Settings Placeholders */}
            <div className="pt-4 space-y-3">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium text-muted-foreground">
                  Working Hours
                </p>
                <p className="text-xs text-muted-foreground">
                  Coming soon: Set default working hours for content scheduling
                </p>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium text-muted-foreground">
                  Content Defaults
                </p>
                <p className="text-xs text-muted-foreground">
                  Coming soon: Configure default content settings and templates
                </p>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium text-muted-foreground">
                  Visibility Settings
                </p>
                <p className="text-xs text-muted-foreground">
                  Coming soon: Control workspace visibility and discoverability
                </p>
              </div>
            </div>
          </div>
        </PermissionGuard>
      </CardContent>
    </Card>
  );
}
