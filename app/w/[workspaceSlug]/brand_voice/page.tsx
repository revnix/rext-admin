"use client";

import { Loader2 } from "lucide-react";
import { SettingsPage } from "@/components/layouts";
import { BrandVoiceSection } from "@/components/workspace-settings/brand-voice-section";
import { PermissionGuard } from "@/components/permission/permission-guard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useWorkspace } from "@/providers/workspace-provider";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { BRAND_VOICE_PERMISSIONS } from "@/lib/permissions";

export default function BrandVoicePage() {
  const { workspace, workspaceId } = useWorkspace();
  const { isLoading: isPermLoading } = useWorkspacePermission(
    BRAND_VOICE_PERMISSIONS.READ,
    workspaceId,
  );

  if (!workspace?.id || isPermLoading) {
    return (
      <SettingsPage title="Loading Permissions..." sections={[]}>
        <div className="space-y-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-foreground" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </SettingsPage>
    );
  }

  return (
    <SettingsPage
      title="Brand Voice"
      sections={[]}
      description="Define and manage your brand's unique voice and personality for AI-powered content creation."
    >
      <PermissionGuard
        permission={BRAND_VOICE_PERMISSIONS.READ}
        showLoading={false}
        fallback={
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to view brand voice in this workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Required permission:{" "}
                <code className="text-xs bg-muted px-1 rounded-md">
                  brand_voice.read
                </code>
              </p>
            </CardContent>
          </Card>
        }
      >
        <BrandVoiceSection />
      </PermissionGuard>
    </SettingsPage>
  );
}
