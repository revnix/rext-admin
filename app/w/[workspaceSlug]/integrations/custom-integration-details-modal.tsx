import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CustomIntegrationConfiguration } from "./custom-integration-configuration";
import { integrationsApiService } from "@/services/integrations-api";
import { toast } from "sonner"; // Assuming sonner
import { useWorkspace } from "@/providers/workspace-provider";

interface CustomIntegrationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  integration: any | null;
  onUpdate: (updatedIntegration: any) => void;
  onDelete?: () => void;
}

export function CustomIntegrationDetailsModal({
  isOpen,
  onClose,
  integration,
  onUpdate,
  onDelete,
}: CustomIntegrationDetailsModalProps) {
  const { workspace } = useWorkspace(); // Hook to get workspace ID

  if (!integration) return null;

  const handleConfigurationUpdate = async (updatedData: any) => {
    if (!workspace?.id) {
      toast.error("Workspace ID missing");
      return;
    }

    // Detect what changed.
    try {
      // 1. General update for fields
      const apiPayload = {
        site_url: updatedData.site_url,
        api_endpoint: updatedData.api_endpoint,
        api_key: updatedData.api_key,
        // We still send is_active in patch as backup or if supported,
        // but we'll use specific APIs next to be sure.
        is_active: updatedData.is_active ?? updatedData.active,
      };

      await integrationsApiService.updateIntegration(
        integration.id,
        workspace.id,
        apiPayload,
      );

      // 2. Handle specific Activation/Deactivation if status changed
      const oldActive = integration.is_active ?? integration.active;
      const newActive = updatedData.is_active ?? updatedData.active;

      if (newActive !== oldActive) {
        if (newActive) {
          await integrationsApiService.activateIntegration(
            integration.id,
            workspace.id,
          );
        } else {
          await integrationsApiService.deactivateIntegration(
            integration.id,
            workspace.id,
          );
        }
      }

      toast.success("Integration updated successfully");
      onUpdate(updatedData);
      onClose();
    } catch (e) {
      console.error("Failed to update", e);
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
    if (!confirm("Are you sure you want to delete this integration?")) return;
    try {
      await integrationsApiService.deleteIntegration(
        integration.id,
        workspace.id,
      );
      toast.success("Integration deleted");
      if (onDelete) onDelete();
      // onClose(); // onDelete usually handles view clearing
    } catch (e) {
      console.error("Failed to delete", e);
      toast.error(
        e instanceof Error ? e.message : "Failed to delete integration",
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            {integration.name || integration.integration_type} Configuration
          </DialogTitle>
          <DialogDescription>
            Configure your {integration.name} connection settings.
          </DialogDescription>
        </DialogHeader>
        <CustomIntegrationConfiguration
          integration={integration}
          onUpdate={handleConfigurationUpdate}
          onDelete={handleConfigurationDelete}
        />
      </DialogContent>
    </Dialog>
  );
}
