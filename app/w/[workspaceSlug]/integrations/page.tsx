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
import { Plus, Settings } from "lucide-react";
import { AddIntegrationModal } from "./add-integration-modal";
import { CustomIntegrationDetailsModal } from "./custom-integration-details-modal";
import {
  integrationsApiService,
  type Integration,
} from "@/services/integrations-api";
import { log } from "@/lib/logger";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

export default function IntegrationsPage() {
  const { workspace } = useWorkspace();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewIntegration, setViewIntegration] = useState<Integration | null>(
    null,
  );

  const fetchIntegrations = useCallback(async () => {
    if (!workspace?.id) return;
    try {
      setIsLoading(true);
      const data = await integrationsApiService.listIntegrations(workspace.id);
      setIntegrations(data);
    } catch (error) {
      log.error("Failed to fetch integrations", error);
    } finally {
      setIsLoading(false);
    }
  }, [workspace?.id]);

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

  return (
    <PageLayout
      title="Integrations"
      description="Connect your workspace with third-party platforms."
      actions={
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Integration
        </Button>
      }
    >
      <div className="space-y-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : integrations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
            No integrations connected yet. Click "Add Integration" to start.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {integrations.map((integration) => (
              <Card
                key={integration.id}
                className="overflow-hidden transition-all hover:shadow-md"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border bg-white">
                      <AvatarImage
                        src={
                          integration.logo ||
                          "https://upload.wikimedia.org/wikipedia/commons/9/98/WordPress_blue_logo.svg"
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
                  <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                    {integration.description ||
                      `Connect ${integration.name || integration.integration_type} to sync your content automatically.`}
                  </CardDescription>
                </CardContent>
                <CardFooter className="flex items-center justify-between p-6 border-t border-slate-100">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => handleIntegrationClick(integration)}
                    >
                      <Settings className="h-4 w-4" />
                      <span className="sr-only">Settings</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleIntegrationClick(integration)}
                    >
                      Details
                    </Button>
                  </div>
                  <Switch
                    checked={integration.is_active}
                    onCheckedChange={(checked) =>
                      handleToggleActive(integration, checked)
                    }
                  />
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
        onUpdate={handleIntegrationUpdated}
        onDelete={handleIntegrationDeleted}
      />
    </PageLayout>
  );
}
