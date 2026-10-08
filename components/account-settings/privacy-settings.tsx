"use client";

import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { apiClient } from "@/lib/api-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  dataExportSchema,
  defaultDataExportValues,
  type DataExportFormValues,
} from "@/schemas/account-schemas";
import { getPrivacyExportErrorMessage } from "@/lib/error-messages/api-user-messages";
import { logger } from "@/lib/logger";

export function PrivacySettings() {
  const log = logger.forComponent("PrivacySettings");

  const form = useForm<DataExportFormValues>({
    resolver: zodResolver(dataExportSchema),
    defaultValues: defaultDataExportValues,
  });

  // Whether the file was saved here: without a payload, or when the browser refuses, only the email copy says so.
  const [downloaded, setDownloaded] = useState(false);

  const exportMutation = useMutation({
    mutationFn: (data: DataExportFormValues) =>
      apiClient.account.requestDataExport(data),
    onSuccess: (data) => {
      let saved = false;
      if (data.export_payload && data.filename) {
        try {
          const jsonStr = JSON.stringify(data.export_payload, null, 2);
          const blob = new Blob([jsonStr], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = data.filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          saved = true;
        } catch (err) {
          log.error("Failed to generate client-side download", err);
        }
      }
      setDownloaded(saved);
      toast.success(
        saved
          ? "Data export completed: your file is downloading."
          : "Data export completed: a copy is on its way to your email.",
      );
    },
    onError: (error: unknown) => {
      log.error("Data export request failed", error);
      toast.error(getPrivacyExportErrorMessage(error));
    },
  });

  const exportItems: Array<{
    id: keyof DataExportFormValues;
    label: string;
    description: string;
  }> = [
    {
      id: "include_profile",
      label: "Profile information",
      description: "Basic account details, email, username, and settings",
    },
    {
      id: "include_roles",
      label: "Role assignments",
      description: "All roles assigned to your account across workspaces",
    },
    {
      id: "include_workspaces",
      label: "Workspace memberships",
      description: "Workspaces you're a member of and your role in each",
    },
    {
      id: "include_activity",
      label: "Activity log",
      description: "Your account activity and action history",
    },
    {
      id: "include_billing",
      label: "Subscription and billing",
      description:
        "Subscription plans, billing history, and payment information",
    },
    {
      id: "include_usage",
      label: "Usage",
      description:
        "Content creation stats, workspace usage, and activity metrics",
    },
  ];

  const onSubmit = (values: DataExportFormValues) => {
    exportMutation.mutate(values);
  };

  return (
    <div className="space-y-6">
      {/* Data Export Section */}
      <div className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {exportItems.map((item) => (
              <FormField
                key={item.id}
                control={form.control}
                name={item.id}
                render={({ field }) => (
                  <FormItem className="flex items-start space-x-3 p-3 border rounded-md">
                    <FormControl>
                      <Checkbox
                        id={item.id}
                        checked={field.value}
                        onCheckedChange={(checked) =>
                          field.onChange(checked === true)
                        }
                        disabled={exportMutation.isPending}
                      />
                    </FormControl>
                    <div className="flex-1 space-y-1">
                      <FormLabel
                        htmlFor={item.id}
                        className="cursor-pointer font-medium"
                      >
                        {item.label}
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            ))}

            <Button
              data-rec="show"
              type="submit"
              disabled={exportMutation.isPending}
              className="w-full sm:w-auto"
            >
              {exportMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Preparing the export…
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Request the export
                </>
              )}
            </Button>
          </form>
        </Form>

        {exportMutation.isSuccess && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              {downloaded
                ? "Data export completed. Your file should start downloading automatically, and a copy is on its way to your email."
                : "Data export completed. A copy is on its way to your email."}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
