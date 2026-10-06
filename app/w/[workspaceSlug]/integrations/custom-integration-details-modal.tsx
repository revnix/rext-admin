import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CustomIntegrationConfiguration,
  type WordPressSiteChanges,
} from "./custom-integration-configuration";
import type { Integration } from "@/lib/api-client/integrations";
import {
  useDisconnectWordPress,
  useUpdateWordPress,
} from "@/hooks/use-integrations";
import { toast } from "sonner";
import { useWorkspace } from "@/providers/workspace-provider";
import { log } from "@/lib/logger";

interface CustomIntegrationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  integration: Integration | null;
  canUpdate: boolean;
  canDelete: boolean;
}

export function CustomIntegrationDetailsModal({
  isOpen,
  onClose,
  integration,
  canUpdate,
  canDelete,
}: CustomIntegrationDetailsModalProps) {
  const { workspace } = useWorkspace();
  const updateSite = useUpdateWordPress(workspace?.id ?? "");
  const disconnectSite = useDisconnectWordPress(workspace?.id ?? "");

  if (!integration) return null;

  const handleConfigurationUpdate = async (changes: WordPressSiteChanges) => {
    if (!workspace?.id) {
      toast.error("Workspace ID missing");
      return;
    }
    try {
      // One PATCH: the address, the endpoint, the state, and the key only when
      // a new one was typed (left out, the stored key stays).
      await updateSite.mutateAsync({
        siteId: integration.id,
        data: {
          site_url: changes.site_url,
          api_endpoint: changes.api_endpoint,
          is_active: changes.is_active,
          ...(changes.api_key ? { api_key: changes.api_key } : {}),
        },
      });
      toast.success("Integration updated successfully");
      onClose();
    } catch (e) {
      log.error("Failed to update", e);
      toast.error(
        e instanceof Error ? e.message : "Failed to update integration",
      );
    }
  };

  const handleConfigurationDelete = async () => {
    if (!workspace?.id) {
      toast.error("Workspace ID missing");
      return;
    }
    try {
      await disconnectSite.mutateAsync(integration.id);
      toast.success("Integration deleted");
      onClose();
    } catch (e) {
      log.error("Failed to delete", e);
      toast.error(
        e instanceof Error ? e.message : "Failed to delete integration",
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>WordPress Configuration</DialogTitle>
          <DialogDescription>
            Configure your WordPress connection settings.
          </DialogDescription>
        </DialogHeader>
        <CustomIntegrationConfiguration
          integration={integration}
          onUpdate={handleConfigurationUpdate}
          onDelete={canDelete ? handleConfigurationDelete : undefined}
          canUpdate={canUpdate}
        />
      </DialogContent>
    </Dialog>
  );
}
