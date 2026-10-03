"use client";

import { useEffect, useState, useCallback } from "react";
import { PageLayout } from "@/components/page-layout";
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
import {
  integrationsApiService,
  type Integration,
} from "@/services/integrations-api";
import { log } from "@/lib/logger";
import { analytics } from "@/lib/analytics";
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
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewIntegration, setViewIntegration] = useState<Integration | null>(
    null,
  );

  const fetchIntegrations = useCallback(async () => {
    if (!workspace?.id || !canRead) return;
    try {
      setIsLoading(true);
      const data = await integrationsApiService.listIntegrations(workspace.id);
      setIntegrations(data);

      const pendingKey = `shopify_install_pending_${workspace.id}`;
      if (
        typeof window !== "undefined" &&
        window.sessionStorage.getItem(pendingKey) &&
        data.some((i) => i.integration_type?.toLowerCase() === "shopify")
      ) {
        window.sessionStorage.removeItem(pendingKey);
        analytics.track("cms_connection_completed", {
          cms_type: "shopify",
          workspace_id: workspace.id,
        });
      }
    } catch (error) {
      log.error("Failed to fetch integrations", error);
    } finally {
      setIsLoading(false);
    }
  }, [workspace?.id, canRead]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const handleIntegrationClick = async (integration: Integration) => {
    if (!workspace?.id) return;
    try {
      const fullDetails = await integrationsApiService.getIntegration(
        integration.id,
        workspace.id,
      );
      setViewIntegration(fullDetails);
    } catch (e) {
      log.error("Failed to fetch integration details", e);
      setViewIntegration(integration);
    }
  };

  const handleToggleActive = async (
    integration: Integration,
    checked: boolean,
  ) => {
    if (!workspace?.id) return;
    // Optimistic update
    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === integration.id ? { ...i, is_active: checked } : i,
      ),
    );

    try {
      if (checked) {
        await integrationsApiService.activateIntegration(
          integration.id,
          workspace.id,
        );
        toast.success(`${integration.name || "Integration"} activated`);
      } else {
        await integrationsApiService.deactivateIntegration(
          integration.id,
          workspace.id,
        );
        toast.success(`${integration.name || "Integration"} deactivated`);
      }
    } catch (error) {
      log.error("Failed to toggle integration", error);
      toast.error("Failed to update integration status");
      // Revert optimism
      setIntegrations((prev) =>
        prev.map((i) =>
          i.id === integration.id ? { ...i, is_active: !checked } : i,
        ),
      );
    }
  };

  const handleIntegrationAdded = () => {
    fetchIntegrations();
    setIsAddModalOpen(false);
  };

  const handleIntegrationUpdated = async (updated: Partial<Integration>) => {
    await fetchIntegrations();
    if (viewIntegration && updated.id === viewIntegration.id) {
      try {
        if (workspace?.id && updated.id) {
          const fullDetails = await integrationsApiService.getIntegration(
            updated.id,
            workspace.id,
          );
          setViewIntegration(fullDetails);
        }
      } catch (e) {
        log.error("Failed to fetch integration details", e);
      }
    }
  };

  const handleIntegrationDeleted = async () => {
    await fetchIntegrations();
    setViewIntegration(null);
  };

  if (!workspace?.id || isPermLoading) {
    return (
      <PageLayout title="Loading Permissions...">
        <div className="space-y-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-foreground" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
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
          <div className="text-center py-12 text-muted-foreground bg-slate-100 dark:bg-accent rounded-md border border-dashed">
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
                    <Avatar className="h-10 w-10 border bg-white">
                      <AvatarImage
                        src={
                          integration.logo ||
                          (integration.integration_type.toLowerCase() ===
                          "shopify"
                            ? "https://upload.wikimedia.org/wikipedia/commons/0/0e/Shopify_logo_2018.svg"
                            : "https://upload.wikimedia.org/wikipedia/commons/9/98/WordPress_blue_logo.svg")
                        }
                        alt={integration.name || integration.integration_type}
                        className="object-contain p-1"
                      />
                      <AvatarFallback>
                        {(integration.name || integration.integration_type)
                          .substring(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-2">
                  <CardTitle className="text-base font-semibold mb-2 capitalize">
                    {integration.name || integration.integration_type}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 min-h-10">
                    {integration.description ||
                      `Connect ${integration.name || integration.integration_type} to sync your content automatically.`}
                  </CardDescription>
                </CardContent>
                <CardFooter className="flex items-center justify-between p-6 border-t border-slate-100">
                  <div className="flex gap-2">
                    {canUpdate || canDelete ? (
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => handleIntegrationClick(integration)}
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
        onAdd={handleIntegrationAdded}
      />

      <CustomIntegrationDetailsModal
        isOpen={!!viewIntegration}
        onClose={() => setViewIntegration(null)}
        integration={viewIntegration}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onUpdate={handleIntegrationUpdated}
        onDelete={handleIntegrationDeleted}
      />
    </PageLayout>
  );
}
