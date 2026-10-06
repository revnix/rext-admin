"use client";

import { useState } from "react";
import { ListPage } from "@/components/layouts";
import { useWorkspace } from "@/providers/workspace-provider";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Settings } from "lucide-react";
import { AddIntegrationModal } from "./add-integration-modal";
import { CustomIntegrationDetailsModal } from "./custom-integration-details-modal";
import type { Integration } from "@/lib/api-client/integrations";
import {
  useIntegrations,
  useSetIntegrationActive,
} from "@/hooks/use-integrations";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { LockedFeatureTooltip } from "@/components/permission/locked-feature-tooltip";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { INTEGRATION_PERMISSIONS } from "@/lib/permissions";

export default function IntegrationsPage() {
  const { workspace } = useWorkspace();
  const { hasPermission: canRead, isLoading: isPermLoading } =
    useWorkspacePermission(INTEGRATION_PERMISSIONS.READ, workspace?.id);
  const { hasPermission: canCreate } = useWorkspacePermission(
    INTEGRATION_PERMISSIONS.CREATE,
    workspace?.id,
  );
  const { hasPermission: canUpdate } = useWorkspacePermission(
    INTEGRATION_PERMISSIONS.UPDATE,
    workspace?.id,
  );
  const { hasPermission: canDelete } = useWorkspacePermission(
    INTEGRATION_PERMISSIONS.DELETE,
    workspace?.id,
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewIntegration, setViewIntegration] = useState<Integration | null>(
    null,
  );
  const { data: integrations = [], isLoading } = useIntegrations(
    workspace?.id ?? null,
    canRead,
  );
  const setActive = useSetIntegrationActive(workspace?.id ?? "");

  const handleToggleActive = (integration: Integration, checked: boolean) => {
    setActive.mutate(
      { siteId: integration.id, active: checked },
      {
        onSuccess: () =>
          toast.success(checked ? "Site activated" : "Site deactivated"),
        onError: () => toast.error("Failed to update integration status"),
      },
    );
  };

  if (!workspace?.id || isPermLoading) {
    return (
      <ListPage title="Loading Permissions...">
        <div className="space-y-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-foreground" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </ListPage>
    );
  }

  return (
    <ListPage
      title="Integrations"
      description="Connect your workspace with third-party platforms."
      actions={
        canCreate ? (
          <Button
            className="w-full sm:w-auto"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Integration
          </Button>
        ) : (
          <LockedFeatureTooltip message="You need the Create Integration permission to connect an integration">
            <Button className="w-full sm:w-auto" disabled>
              <Plus className="mr-2 h-4 w-4" />
              Add Integration
            </Button>
          </LockedFeatureTooltip>
        )
      }
    >
      <div className="space-y-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : integrations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-surface-inset rounded-md border border-dashed">
            No integrations connected yet. Click "Add Integration" to start.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {integrations.map((integration) => (
              <Card
                key={integration.id}
                className="overflow-hidden transition-all"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border bg-card">
                      <AvatarImage
                        src="https://upload.wikimedia.org/wikipedia/commons/9/98/WordPress_blue_logo.svg"
                        alt="WordPress"
                        className="object-contain p-1"
                      />
                      <AvatarFallback>WP</AvatarFallback>
                    </Avatar>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-2">
                  <CardTitle className="text-base font-semibold mb-2">
                    WordPress
                  </CardTitle>
                  <CardDescription className="line-clamp-2 min-h-10 break-all">
                    {integration.site_url}
                  </CardDescription>
                </CardContent>
                <CardFooter className="flex items-center justify-between p-6 border-t border-border">
                  <div className="flex gap-2">
                    {canUpdate || canDelete ? (
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => setViewIntegration(integration)}
                      >
                        <Settings className="h-4 w-4" />
                        <span className="sr-only">Settings</span>
                      </Button>
                    ) : (
                      <LockedFeatureTooltip message="You need the Update Integration or Delete Integration permission to manage this integration">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          disabled
                        >
                          <Settings className="h-4 w-4" />
                          <span className="sr-only">Settings</span>
                        </Button>
                      </LockedFeatureTooltip>
                    )}
                  </div>
                  {canUpdate ? (
                    <Switch
                      aria-label={`Publish to ${integration.site_url}`}
                      checked={integration.is_active}
                      onCheckedChange={(checked) =>
                        handleToggleActive(integration, checked)
                      }
                    />
                  ) : (
                    <div className="className">
                      <LockedFeatureTooltip message="You need the Update Integration permission to change activation">
                        <Switch checked={integration.is_active} disabled />
                      </LockedFeatureTooltip>
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AddIntegrationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={() => setIsAddModalOpen(false)}
      />

      <CustomIntegrationDetailsModal
        isOpen={!!viewIntegration}
        onClose={() => setViewIntegration(null)}
        integration={viewIntegration}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
    </ListPage>
  );
}
