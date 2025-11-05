"use client";

import { Shield } from "lucide-react";
import { CanAccess } from "@/components/permissions/can-access";
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
 * Workspace Settings Root Page
 *
 * Consolidated workspace settings at /workspaces/[slug]/settings that combines:
 * - General information (name, slug, description, URL)
 * - Brand voice profile configuration
 * - Team & access management
 * - Workspace preferences
 * - Danger zone (delete workspace)
 *
 * **Permission Required:** `workspace.update` (Admin+ only)
 *
 * Part of Settings Consolidation (Phase 4)
 * Replaced old pages: general/, team/
 */
export default function WorkspaceSettingsPage() {
  return (
    <CanAccess
      permission={WORKSPACE_PERMISSIONS.UPDATE}
      fallback={
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Workspace Settings Access Restricted
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
    </CanAccess>
  );
}
