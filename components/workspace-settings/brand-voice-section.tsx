"use client";

import { useQuery } from "@tanstack/react-query";
import { PermissionGuard } from "@/components/permission/permission-guard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EditableBrandVoiceCard } from "@/components/workspace";
import { workspaceQueries } from "@/lib/query-keys";
import { WORKSPACE_PERMISSIONS } from "@/lib/permissions";
import { useWorkspace } from "@/providers/workspace-provider";

export function BrandVoiceSection() {
  const { workspace } = useWorkspace();

  const { data: brandVoiceData, isLoading } = useQuery({
    ...workspaceQueries.brandVoice(workspace?.id || ""),
    enabled: !!workspace?.id,
  });

  if (!workspace) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Brand Voice Profile</h3>
        <p className="text-sm text-muted-foreground">
          Define your brand's tone, style, and messaging guidelines
        </p>
      </div>

      <PermissionGuard
        permission={WORKSPACE_PERMISSIONS.UPDATE}
        fallback={
          <Card>
            <CardHeader>
              <CardTitle>Brand Voice Profile</CardTitle>
              <CardDescription>
                AI-extracted brand characteristics and positioning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You don't have permission to edit brand voice settings.
              </p>
            </CardContent>
          </Card>
        }
      >
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : (
          <EditableBrandVoiceCard
            workspace={{
              ...workspace,
              brand_voice: brandVoiceData?.brand_voice || workspace.brand_voice,
            }}
          />
        )}
      </PermissionGuard>
    </div>
  );
}
