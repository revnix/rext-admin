"use client";

import { useQuery } from "@tanstack/react-query";
import { PermissionGuard } from "@/components/permission/permission-guard";
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

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : (
        <PermissionGuard
          permission={WORKSPACE_PERMISSIONS.UPDATE}
          fallback={
            <EditableBrandVoiceCard
              workspace={{
                ...workspace,
                brand_voice:
                  brandVoiceData?.brand_voice || workspace.brand_voice,
              }}
              readOnly
            />
          }
        >
          <EditableBrandVoiceCard
            workspace={{
              ...workspace,
              brand_voice: brandVoiceData?.brand_voice || workspace.brand_voice,
            }}
          />
        </PermissionGuard>
      )}
    </div>
  );
}
