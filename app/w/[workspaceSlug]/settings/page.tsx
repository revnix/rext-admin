"use client";

import { Shield } from "lucide-react";
import { PermissionGuard } from "@/components/permission/permission-guard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BrandVoiceSection } from "@/components/workspace-settings/brand-voice-section";
import { DangerZoneSection } from "@/components/workspace-settings/danger-zone-section";
import { GeneralInfoSection } from "@/components/workspace-settings/general-info-section";
import { TeamAccessSection } from "@/components/workspace-settings/team-access-section";
import { WorkspacePreferencesSection } from "@/components/workspace-settings/workspace-preferences-section";
import { WORKSPACE_PERMISSIONS } from "@/lib/permissions";

/**
 * Workspace Settings Page
 *
 * Consolidated workspace settings page located at:
 * /w/[slug]/settings
 *
 * Sections:
 * - General Information
 * - Brand Voice
 * - Team Access
 * - Workspace Preferences
 * - Danger Zone
 *
 * Permission Required: `workspace.update` (Admin or Owner)
 */
export default function WorkspaceSettingsPage() {
  return (
    <PermissionGuard
      permission={WORKSPACE_PERMISSIONS.UPDATE}
      fallback={
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Access Restricted
            </CardTitle>
            <CardDescription>
              Only workspace administrators can access workspace settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Workspace settings allow you to modify workspace name, brand
              voice, team access, and other critical configurations. This page
              is restricted to workspace owners and administrators.
            </p>
            <div className="bg-muted p-3 rounded-md">
              <p className="text-xs font-mono">
                Required permission:{" "}
                <span className="font-semibold">workspace.update</span>
              </p>
            </div>
          </CardContent>
        </Card>
      }
    >
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-medium">General Information</h2>
          <p className="text-sm text-muted-foreground">
            Update your workspace name, slug, and other basic information
          </p>
        </div>
        <GeneralInfoSection />

        <Separator />

        <BrandVoiceSection />

        <Separator />

        <TeamAccessSection />

        <Separator />

        <WorkspacePreferencesSection />

        <Separator />

        <DangerZoneSection />
      </div>
    </PermissionGuard>
  );
}
