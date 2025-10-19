"use client";

/**
 * License Activation Modal
 *
 * Modal dialog for activating a license on a new device/instance.
 * Collects instance identifier and optional instance name.
 */

import { Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";
import type { License } from "@/types/license";

export interface ActivateLicenseModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal should close */
  onOpenChange: (open: boolean) => void;
  /** License to activate */
  license: License;
  /** Callback after successful activation */
  onSuccess?: () => void;
}

/**
 * Modal for activating a license on a new instance
 */
export function ActivateLicenseModal({
  open,
  onOpenChange,
  license,
  onSuccess,
}: ActivateLicenseModalProps) {
  const [instanceId, setInstanceId] = useState("");
  const [instanceName, setInstanceName] = useState("");
  const [isActivating, setIsActivating] = useState(false);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!instanceId.trim()) {
      toast.error("Instance ID is required");
      return;
    }

    try {
      setIsActivating(true);

      await apiClient.licenses.activateLicense({
        license_key: license.license_key,
        instance_id: instanceId.trim(),
        instance_name: instanceName.trim() || undefined,
      });

      toast.success("License activated successfully", {
        description: `Activated on ${instanceName || instanceId}`,
      });

      // Reset form
      setInstanceId("");
      setInstanceName("");

      // Close modal
      onOpenChange(false);

      // Call success callback
      onSuccess?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to activate license";

      toast.error("Activation failed", {
        description: errorMessage,
      });
    } finally {
      setIsActivating(false);
    }
  };

  const handleClose = () => {
    if (!isActivating) {
      setInstanceId("");
      setInstanceName("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Activate License</DialogTitle>
          <DialogDescription>
            Activate your license key on a new device or instance
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleActivate}>
          <div className="space-y-4 py-4">
            {/* License Info */}
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">License Key</p>
              <p className="text-sm font-mono text-muted-foreground">
                {license.license_key}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {license.product_name}
              </p>
            </div>

            {/* Activation Limit Info */}
            {license.activation_limit && (
              <div className="text-sm text-muted-foreground">
                <p>
                  Activations: {license.activation_count} /{" "}
                  {license.activation_limit}
                </p>
                <p>
                  {license.activation_limit - license.activation_count}{" "}
                  activation
                  {license.activation_limit - license.activation_count !== 1
                    ? "s"
                    : ""}{" "}
                  remaining
                </p>
              </div>
            )}

            {/* Instance ID Field */}
            <div className="space-y-2">
              <Label htmlFor="instance-id">
                Instance ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="instance-id"
                type="text"
                placeholder="e.g., device-12345, my-server-001"
                value={instanceId}
                onChange={(e) => setInstanceId(e.target.value)}
                required
                maxLength={255}
                disabled={isActivating}
              />
              <p className="text-xs text-muted-foreground">
                A unique identifier for this device or installation (e.g.,
                device ID, domain name, server hostname)
              </p>
            </div>

            {/* Instance Name Field */}
            <div className="space-y-2">
              <Label htmlFor="instance-name">Instance Name (Optional)</Label>
              <Input
                id="instance-name"
                type="text"
                placeholder="e.g., My Laptop, Production Server"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                maxLength={255}
                disabled={isActivating}
              />
              <p className="text-xs text-muted-foreground">
                A friendly name to help you identify this activation
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isActivating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isActivating || !instanceId.trim()}>
              {isActivating && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Activate License
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
