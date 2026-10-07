"use client";

import { SettingsPage, type SettingsSection } from "@/components/layouts";
import { useWorkspacePermission } from "@/hooks/use-permission";
import {
  BRAND_VOICE_PERMISSIONS,
  CONTENT_PERMISSIONS,
  MEMBER_PERMISSIONS,
  PERSONA_PERMISSIONS,
  WORKSPACE_PERMISSIONS,
} from "@/lib/permissions";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";

/**
 * Workspace settings (plans/app/D-pages.md §2.6): one SettingsPage, a route per section. General is
 * open to every member (read-only without workspace.update); the others are listed only for the
 * people who may open them, as the sidebar does. Trash (D13b) is for whoever may read the articles
 * or the personas: the backend lists only the kinds they may read.
 */
export default function WorkspaceSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { workspaceId, workspaceSlug } = useWorkspace();
  const { hasPermission: canReadBrandVoice } = useWorkspacePermission(
    BRAND_VOICE_PERMISSIONS.READ,
    workspaceId,
  );
  const { hasPermission: canReadMembers } = useWorkspacePermission(
    MEMBER_PERMISSIONS.READ,
    workspaceId,
  );
  const { hasPermission: canReadContent } = useWorkspacePermission(
    CONTENT_PERMISSIONS.READ,
    workspaceId,
  );
  const { hasPermission: canReadPersonas } = useWorkspacePermission(
    PERSONA_PERMISSIONS.READ,
    workspaceId,
  );
  const { hasPermission: canDelete } = useWorkspacePermission(
    WORKSPACE_PERMISSIONS.DELETE,
    workspaceId,
  );

  const sections: SettingsSection[] = [
    { label: "General", href: workspaceRoutes.settings.root(workspaceSlug) },
  ];
  if (canReadBrandVoice) {
    sections.push({
      label: "Brand voice",
      href: workspaceRoutes.settings.brandVoice(workspaceSlug),
    });
  }
  if (canReadMembers) {
    sections.push({
      label: "Members",
      href: workspaceRoutes.settings.members(workspaceSlug),
    });
  }
  if (canReadContent || canReadPersonas) {
    sections.push({
      label: "Trash",
      href: workspaceRoutes.settings.trash(workspaceSlug),
    });
  }
  if (canDelete) {
    sections.push({
      label: "Danger zone",
      href: workspaceRoutes.settings.dangerZone(workspaceSlug),
    });
  }

  return (
    <SettingsPage
      title="Workspace settings"
      description="The workspace's details, how its articles sound, and who works in it."
      sections={sections}
    >
      {children}
    </SettingsPage>
  );
}
