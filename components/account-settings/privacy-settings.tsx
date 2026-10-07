"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { FormShell } from "@/components/forms/form-shell";
import { ToggleController } from "@/components/forms/toggle-controller";
import { useZodForm } from "@/components/forms/use-zod-form";
import { Notice } from "@/components/ui/notice";
import { apiClient } from "@/lib/api-client";
import { getPrivacyExportErrorMessage } from "@/lib/error-messages/api-user-messages";
import { logger } from "@/lib/logger";
import {
  type DataExportFormValues,
  dataExportSchema,
  defaultDataExportValues,
} from "@/schemas/account-schemas";

const log = logger.forComponent("PrivacySettings");

const EXPORT_ITEMS: Array<{
  name: keyof DataExportFormValues;
  label: string;
  description: string;
}> = [
  {
    name: "include_profile",
    label: "Profile information",
    description: "Basic account details, email, username, and settings",
  },
  {
    name: "include_roles",
    label: "Role assignments",
    description: "All roles assigned to your account across workspaces",
  },
  {
    name: "include_workspaces",
    label: "Workspace memberships",
    description: "Workspaces you're a member of and your role in each",
  },
  {
    name: "include_activity",
    label: "Activity log",
    description: "Your account activity and action history",
  },
  {
    name: "include_billing",
    label: "Subscription and billing",
    description: "Subscription plans, billing history, and payment information",
  },
  {
    name: "include_usage",
    label: "Usage",
    description:
      "Content creation stats, workspace usage, and activity metrics",
  },
];

/** Saves the export the backend returned as a JSON file on this device. False when the browser refused. */
function saveAsJson(payload: Record<string, unknown>, filename: string) {
  try {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    log.error("The export couldn't be saved on this device", error);
    return false;
  }
}

/**
 * Exporting the account's data (Settings, Data and trash): the categories as a form on the field
 * set. The backend builds the export at once, returns it, and emails a copy in the background
 * (rext-backend's POST /users/export-data), so the file is saved here and the email is "on its way",
 * never "sent".
 */
export function PrivacySettings() {
  const form = useZodForm(dataExportSchema, {
    defaultValues: defaultDataExportValues,
  });
  const [saved, setSaved] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const exportMutation = useMutation({
    mutationFn: (values: DataExportFormValues) =>
      apiClient.account.requestDataExport(values),
  });

  const onSubmit = async (values: DataExportFormValues) => {
    setProblem(null);
    try {
      const result = await exportMutation.mutateAsync(values);
      setSaved(
        Boolean(result.export_payload && result.filename) &&
          saveAsJson(
            result.export_payload as Record<string, unknown>,
            result.filename as string,
          ),
      );
      // Done, not unsaved: leaving the page asks nothing.
      form.reset(values);
    } catch (error) {
      log.error("Data export request failed", error);
      setProblem(getPrivacyExportErrorMessage(error));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {problem && (
        <Notice tone="danger" title="Your data wasn't exported">
          {problem}
        </Notice>
      )}
      {exportMutation.isSuccess && !problem && (
        <Notice
          tone="success"
          title={saved ? "Your data is exported" : "Your export is on its way"}
        >
          {saved
            ? "The file is saved to this device, and a copy is on its way to your email address."
            : "A copy is on its way to your email address."}
        </Notice>
      )}
      <FormShell form={form} onSubmit={onSubmit} submitLabel="Export my data">
        {EXPORT_ITEMS.map((item) => (
          <ToggleController
            key={item.name}
            control={form.control}
            name={item.name}
            label={item.label}
            description={item.description}
          />
        ))}
      </FormShell>
    </div>
  );
}
