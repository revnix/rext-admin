"use client";

/**
 * License Management Page
 *
 * Allows users to view and manage their license keys, including:
 * - Viewing all licenses
 * - Checking activation status
 * - Activating licenses on new instances
 * - Viewing and deactivating active instances
 */

import { Loader2, Plus, Shield } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ActivateLicenseModal } from "@/components/licenses/activate-license-modal";
import { PageLayout } from "@/components/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import type { License, LicenseActivation } from "@/types/license";
import { LicenseStatus } from "@/types/license";

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLicense, setExpandedLicense] = useState<string | null>(null);
  const [activations, setActivations] = useState<
    Record<string, LicenseActivation[]>
  >({});
  const [loadingActivations, setLoadingActivations] = useState<
    Record<string, boolean>
  >({});
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);

  const loadLicenses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.licenses.getLicenses();
      setLicenses(response.licenses || []);
    } catch (error) {
      toast.error("Failed to load licenses", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Load licenses on mount
  useEffect(() => {
    loadLicenses();
  }, [loadLicenses]);

  const loadActivations = async (licenseId: string) => {
    if (activations[licenseId]) {
      // Toggle if already loaded
      setExpandedLicense(expandedLicense === licenseId ? null : licenseId);
      return;
    }

    try {
      setLoadingActivations((prev) => ({ ...prev, [licenseId]: true }));
      const response =
        await apiClient.licenses.getLicenseActivations(licenseId);
      setActivations((prev) => ({
        ...prev,
        [licenseId]: response.activations || [],
      }));
      setExpandedLicense(licenseId);
    } catch (error) {
      toast.error("Failed to load activations", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setLoadingActivations((prev) => ({ ...prev, [licenseId]: false }));
    }
  };

  const handleDeactivate = async (licenseId: string, instanceId: string) => {
    try {
      await apiClient.licenses.deactivateLicense(licenseId, {
        instance_id: instanceId,
      });

      toast.success("Instance deactivated successfully");

      // Refresh activations
      const response =
        await apiClient.licenses.getLicenseActivations(licenseId);
      setActivations((prev) => ({
        ...prev,
        [licenseId]: response.activations || [],
      }));

      // Refresh licenses to update activation count
      await loadLicenses();
    } catch (error) {
      toast.error("Failed to deactivate instance", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    }
  };

  const handleActivateClick = (license: License) => {
    setSelectedLicense(license);
    setShowActivateModal(true);
  };

  const getStatusBadgeVariant = (status: LicenseStatus) => {
    switch (status) {
      case LicenseStatus.ACTIVE:
        return "default";
      case LicenseStatus.EXPIRED:
        return "destructive";
      case LicenseStatus.DISABLED:
      case LicenseStatus.REVOKED:
        return "secondary";
      default:
        return "outline";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    { label: "Licenses" },
  ];

  if (loading) {
    return (
      <PageLayout
        title="License Management"
        description="Manage your license keys and device activations"
        breadcrumbs={breadcrumbs}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading licenses...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="License Management"
      description="Manage your license keys and device activations"
      breadcrumbs={breadcrumbs}
    >
      {/* Licenses List */}
      {licenses.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Licenses Found</h3>
              <p className="text-muted-foreground mb-6">
                You don't have any license keys yet. Purchase a lifetime license
                to get started.
              </p>
              <Button asChild>
                <a href="/pricing">View Pricing</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {licenses.map((license) => (
            <Card key={license.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {license.product_name}
                      <Badge variant={getStatusBadgeVariant(license.status)}>
                        {license.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-2">
                      <span className="font-mono text-sm">
                        {license.license_key}
                      </span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* Activation Status */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Activations
                    </p>
                    <p className="text-lg font-semibold">
                      {license.activation_count}
                      {license.activation_limit
                        ? ` / ${license.activation_limit}`
                        : " / Unlimited"}
                    </p>
                  </div>

                  {/* Expiration */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Expires
                    </p>
                    <p className="text-lg font-semibold">
                      {license.expires_at
                        ? formatDate(license.expires_at)
                        : "Never"}
                    </p>
                  </div>

                  {/* Created Date */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Created
                    </p>
                    <p className="text-lg font-semibold">
                      {formatDate(license.created_at)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadActivations(license.id)}
                    disabled={loadingActivations[license.id]}
                  >
                    {loadingActivations[license.id] ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        {expandedLicense === license.id
                          ? "Hide Activations"
                          : "View Activations"}
                      </>
                    )}
                  </Button>

                  {license.status === LicenseStatus.ACTIVE &&
                    (!license.activation_limit ||
                      license.activation_count < license.activation_limit) && (
                      <Button
                        size="sm"
                        onClick={() => handleActivateClick(license)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Activate on New Device
                      </Button>
                    )}
                </div>

                {/* Activations List */}
                {expandedLicense === license.id && activations[license.id] && (
                  <div className="mt-6 border-t pt-4">
                    <h4 className="font-semibold mb-3">
                      Active Instances (
                      {
                        activations[license.id].filter((a) => a.is_active)
                          .length
                      }
                      )
                    </h4>

                    {activations[license.id].length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No activations yet
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {activations[license.id]
                          .filter((a) => a.is_active)
                          .map((activation) => (
                            <div
                              key={activation.id}
                              className="flex items-center justify-between p-3 bg-muted rounded-lg"
                            >
                              <div className="flex-1">
                                <p className="font-medium">
                                  {activation.instance_name ||
                                    activation.instance_id}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Activated{" "}
                                  {formatDate(activation.activated_at)}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleDeactivate(
                                    license.id,
                                    activation.instance_id,
                                  )
                                }
                              >
                                Deactivate
                              </Button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Activation Modal */}
      {selectedLicense && (
        <ActivateLicenseModal
          open={showActivateModal}
          onOpenChange={setShowActivateModal}
          license={selectedLicense}
          onSuccess={() => {
            // Refresh activations for the license
            loadActivations(selectedLicense.id);
            // Refresh licenses to update activation count
            loadLicenses();
          }}
        />
      )}
    </PageLayout>
  );
}
