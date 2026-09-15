"use client";

import { useQuery } from "@tanstack/react-query";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { Skeleton } from "@/components/ui/skeleton";
import { EditableBrandVoiceCard } from "@/components/workspace";
import { workspaceQueries } from "@/lib/query-keys";
import { BRAND_VOICE_PERMISSIONS } from "@/lib/permissions";
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
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : (
        <PermissionGuard
          permission={BRAND_VOICE_PERMISSIONS.UPDATE}
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
