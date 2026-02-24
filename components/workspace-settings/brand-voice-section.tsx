"use client";

import { CanAccess } from "@/components/permissions/can-access";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EditableBrandVoiceCard } from "@/components/workspace";
import { WORKSPACE_PERMISSIONS } from "@/lib/permissions";
import { useWorkspace } from "@/providers/workspace-provider";

export function BrandVoiceSection() {
  const { workspace } = useWorkspace();

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

      <CanAccess
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
        <EditableBrandVoiceCard workspace={workspace} />
      </CanAccess>
    </div>
  );
}
