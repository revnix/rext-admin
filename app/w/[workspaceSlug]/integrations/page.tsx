"use client";

import { useState } from "react";
import { ConnectWordPressDialog } from "@/components/integrations/connect-wordpress-dialog";
import { ConnectedSitesTable } from "@/components/integrations/connected-sites-table";
import { DisconnectSiteDialog } from "@/components/integrations/disconnect-site-dialog";
import { IntegrationCatalogue } from "@/components/integrations/integration-catalogue";
import { SiteSettingsSheet } from "@/components/integrations/site-settings-sheet";
import { ListPage } from "@/components/layouts";
import { SettingsGroup } from "@/components/settings/settings-group";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { useIntegrations } from "@/hooks/use-integrations";
import { useWorkspacePermission } from "@/hooks/use-permission";
import type { Integration } from "@/lib/api-client/integrations";
import { INTEGRATION_PERMISSIONS } from "@/lib/permissions";
import { useWorkspace } from "@/providers/workspace-provider";

const NO_SITES: Integration[] = [];

/**
 * Integrations (plans/app/D-pages.md §2.3): the sites this workspace publishes to, then where else it
 * can publish. A workspace with no site opens on the catalogue, WordPress first; once one is
 * connected, its table comes first.
 */
export default function IntegrationsPage() {
  const { workspaceId } = useWorkspace();
  const { hasPermission: canRead, isLoading: isPermissionLoading } =
    useWorkspacePermission(INTEGRATION_PERMISSIONS.READ, workspaceId);
  const { hasPermission: canCreate } = useWorkspacePermission(
    INTEGRATION_PERMISSIONS.CREATE,
    workspaceId,
  );
  const { hasPermission: canUpdate } = useWorkspacePermission(
    INTEGRATION_PERMISSIONS.UPDATE,
    workspaceId,
  );
  const { hasPermission: canDelete } = useWorkspacePermission(
    INTEGRATION_PERMISSIONS.DELETE,
    workspaceId,
  );
  const { data, isLoading, isError } = useIntegrations(
    workspaceId ?? null,
    canRead,
  );
  const [connecting, setConnecting] = useState(false);
  // The site stays set while its sheet or dialog closes, so the closing panel keeps its words.
  const [settingsOf, setSettingsOf] = useState<Integration | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState<Integration | null>(null);
  const [disconnectOpen, setDisconnectOpen] = useState(false);

  const openSettings = (site: Integration) => {
    setSettingsOf(site);
    setSettingsOpen(true);
  };
  const openDisconnect = (site: Integration) => {
    setDisconnecting(site);
    setDisconnectOpen(true);
  };

  // Only WordPress connects today; a site of another kind isn't this page's to manage.
  const sites = (data ?? NO_SITES).filter(
    (site) => site.integration_type.toLowerCase() === "wordpress",
  );
  const hasSites = sites.length > 0;

  if (!workspaceId || isPermissionLoading) {
    return (
      <ListPage title="Integrations">
        <Skeleton className="h-64 w-full" />
      </ListPage>
    );
  }

  const catalogue = (
    <IntegrationCatalogue
      hasSites={hasSites}
      canCreate={canCreate}
      onConnectWordPress={() => setConnecting(true)}
    />
  );

  return (
    <ListPage
      title="Integrations"
      description="The sites Rext AI publishes your articles to."
    >
      {!canRead ? (
        <Notice title="Integrations are hidden from your role">
          Ask the workspace's owner if you need to see them.
        </Notice>
      ) : hasSites || isLoading || isError ? (
        <div className="flex flex-col gap-12">
          <SettingsGroup
            title="Connected sites"
            description="Rext AI publishes only to active sites: pause one to skip it without disconnecting it."
          >
            <ConnectedSitesTable
              workspaceId={workspaceId}
              sites={sites}
              isLoading={isLoading}
              failed={isError}
              canUpdate={canUpdate}
              canDelete={canDelete}
              onOpenSettings={openSettings}
              onDisconnect={openDisconnect}
            />
          </SettingsGroup>
          <SettingsGroup title="Add an integration">{catalogue}</SettingsGroup>
        </div>
      ) : (
        <SettingsGroup
          title="Connect where you publish"
          description="Connect your site once, then publish any article to it from the editor."
        >
          {catalogue}
        </SettingsGroup>
      )}

      <ConnectWordPressDialog
        workspaceId={workspaceId}
        open={connecting}
        onOpenChange={setConnecting}
      />
      <SiteSettingsSheet
        workspaceId={workspaceId}
        site={settingsOf}
        open={settingsOpen}
        canUpdate={canUpdate}
        onOpenChange={setSettingsOpen}
      />
      <DisconnectSiteDialog
        workspaceId={workspaceId}
        site={disconnecting}
        open={disconnectOpen}
        onOpenChange={setDisconnectOpen}
      />
    </ListPage>
  );
}
