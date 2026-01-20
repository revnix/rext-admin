"use client";

import { useEffect, useState, useCallback } from "react";
import { PageLayout } from "@/components/page-layout";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddIntegrationModal } from "./add-integration-modal";
import { CustomIntegrationDetailsModal } from "./custom-integration-details-modal";
import {
  integrationsApiService,
  type Integration,
} from "@/services/integrations-api";
import { log } from "@/lib/logger";

export default function IntegrationsPage() {
  const { workspace, workspaceSlug } = useWorkspace();
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
    if (!workspace?.id) return;
    fetchIntegrations();
  }, [workspace?.id, fetchIntegrations]);

  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    {
      label: workspace?.title || "...",
      href: workspaceRoutes.root(workspaceSlug),
    },
    { label: "Integrations" },
  ];

  const handleIntegrationClick = async (integration: Integration) => {
    if (!workspace?.id) return;

    // Set initial view to what we have, then optionally fetch fresh details
    // The requirement says /api/v1/content/sites/{site_id} is for rendering details
    try {
      // Fetch fresh details with workspace context to avoid 422
      const fullDetails = await integrationsApiService.getIntegration(
        integration.id,
        workspace.id,
      );
      setViewIntegration(fullDetails);
    } catch (e) {
      log.error("Failed to fetch integration details", e);
      setViewIntegration(integration); // Fallback
    }
  };

  const handleIntegrationAdded = () => {
    fetchIntegrations();
    setIsAddModalOpen(false);
  };

  const handleIntegrationUpdated = async (updated: Partial<Integration>) => {
    // This callback is called by the modal when an update happens (save or toggle).
    // We should refresh the list.
    // The Modal (CustomIntegrationDetailsModal) calls `onUpdate`.
    // We can assume the API call was made inside the Modal or we make it here.
    // Current Modal design (CustomIntegrationConfiguration) calls onUpdate with generic object.
    // I will refactor CustomIntegrationDetailsModal to handle the API calls internally
    // or passing explicit "onToggle", "onUpdate", "onDelete" handlers.
    // Ideally, the Page should handle business logic.

    // BUT, existing `CustomIntegrationDetailsModal` just calls `onUpdate`.
    // I'll update it to be smarter.
    await fetchIntegrations();
    // If it was just an update (not delete), we might keep modal open or close it?
    // If it was a toggle, we usually keep it open.
    // Let's refresh `viewIntegration` as well if it's still open and matches.
    if (viewIntegration && updated.id === viewIntegration.id) {
      // Ideally re-fetch or merge.
      // setViewIntegration(updated);
      // But typically we re-fetch to be safe.
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
        // Don't update view on error, keep existing view
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
      breadcrumbs={breadcrumbs}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {integrations.map((integration) => (
              <Card
                key={integration.id}
                className={`cursor-pointer transition-all border shadow-none rounded-[2rem] overflow-hidden ${
                  !integration.is_active
                    ? "opacity-60 bg-slate-50 border-slate-100"
                    : "border-slate-100 hover:border-slate-300 hover:shadow-sm"
                }`}
                onClick={() => handleIntegrationClick(integration)}
              >
                <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4 p-8">
                  <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-white p-1 border border-slate-100 shadow-sm flex items-center justify-center">
                    {/* biome-ignore lint/performance/noImgElement: External images without config */}
                    <img
                      src={
                        integration.logo ||
                        "https://upload.wikimedia.org/wikipedia/commons/9/98/WordPress_blue_logo.svg"
                      }
                      alt={integration.name || integration.integration_type}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg font-bold text-slate-900 capitalize">
                      {integration.name || integration.integration_type}
                    </CardTitle>
                  </div>
                  {!integration.is_active && (
                    <Badge variant="secondary" className="rounded-full px-3">
                      Inactive
                    </Badge>
                  )}
                  {integration.is_active && (
                    <Badge variant="default" className="rounded-full px-3">
                      Active
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <CardDescription className="text-base truncate">
                    {integration.site_url}
                  </CardDescription>
                </CardContent>
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
