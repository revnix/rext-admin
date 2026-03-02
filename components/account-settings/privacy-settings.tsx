"use client";

import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";
import type { DataExportRequest } from "@/types/account";
import { getPrivacyExportErrorMessage } from "@/lib/error-messages/api-user-messages";
import { logger } from "@/lib/logger";

export function PrivacySettings() {
  const log = logger.forComponent("PrivacySettings");

  const [exportOptions, setExportOptions] = useState<DataExportRequest>({
    include_profile: true,
    include_roles: true,
    include_workspaces: true,
    include_activity: true,
    include_billing: true,
    include_usage: true,
  });

  const exportMutation = useMutation({
    mutationFn: (data: DataExportRequest) =>
      apiClient.account.requestDataExport(data),
    onSuccess: (data) => {
      toast.success(
        data.message || "Your data export will be sent to your email shortly.",
      );
    },
    onError: (error: unknown) => {
      log.error("Data export request failed", error);
      toast.error(getPrivacyExportErrorMessage(error));
    },
  });

  const handleExport = () => {
    exportMutation.mutate(exportOptions);
  };

  const exportItems = [
    {
      id: "include_profile",
      label: "Profile Information",
      description: "Basic account details, email, name, and settings",
    },
    {
      id: "include_roles",
      label: "Role Assignments",
      description: "All roles assigned to your account across workspaces",
    },
    {
      id: "include_workspaces",
      label: "Workspace Memberships",
      description: "Workspaces you're a member of and your role in each",
    },
    {
      id: "include_activity",
      label: "Activity Logs",
      description: "Your account activity and action history",
    },
    {
      id: "include_billing",
      label: "Subscription & Billing Data",
      description:
        "Subscription plans, billing history, and payment information",
    },
    {
      id: "include_usage",
      label: "Usage Metrics",
      description:
        "Content creation stats, workspace usage, and activity metrics",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Data Export Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Export Your Data</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Request a copy of your data to be sent to your email address
          </p>
        </div>

        <div className="space-y-3">
          {exportItems.map((item) => (
            <div
              key={item.id}
              className="flex items-start space-x-3 p-3 border rounded-lg"
            >
              <Checkbox
                id={item.id}
                checked={
                  exportOptions[item.id as keyof DataExportRequest] as boolean
                }
                onCheckedChange={(checked) =>
                  setExportOptions((prev) => ({
                    ...prev,
                    [item.id]: checked,
                  }))
                }
                disabled={exportMutation.isPending}
              />
              <div className="flex-1 space-y-1">
                <Label htmlFor={item.id} className="cursor-pointer font-medium">
                  {item.label}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {exportMutation.isSuccess && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Export request submitted successfully. Check your email for the
              download link.
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleExport}
          disabled={exportMutation.isPending}
          className="w-full sm:w-auto"
        >
          {exportMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Preparing Export...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Request Data Export
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          The export will be sent to your email address as a JSON file
          containing all selected data. Processing may take a few minutes.
        </p>
      </div>
    </div>
  );
}
