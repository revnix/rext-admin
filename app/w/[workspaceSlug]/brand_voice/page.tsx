"use client";

import { Loader2 } from "lucide-react";
import { PageLayout } from "@/components/page-layout";
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
import { WORKSPACE_PERMISSIONS } from "@/lib/permissions";

export default function BrandVoicePage() {
  const { workspace, workspaceId } = useWorkspace();
  const { isLoading: isPermLoading } = useWorkspacePermission(
    WORKSPACE_PERMISSIONS.READ,
    workspaceId,
  );

  if (!workspace?.id || isPermLoading) {
    return (
      <PageLayout title="Loading Permissions...">
        <div className="space-y-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Brand Voice"
      description="Define and manage your brand's unique voice and personality for AI-powered content creation."
      fullWidth
    >
      <PermissionGuard
        permission={WORKSPACE_PERMISSIONS.READ}
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
                <code className="text-xs bg-muted px-1 rounded">
                  workspace:read
                </code>
              </p>
            </CardContent>
          </Card>
        }
      >
        <div className="max-w-4xl py-6">
          <BrandVoiceSection />
        </div>
      </PermissionGuard>
    </PageLayout>
  );
}
