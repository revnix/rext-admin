"use client";

import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Download, Loader2 } from "lucide-react";
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

  const exportMutation = useMutation({
    mutationFn: (data: DataExportFormValues) =>
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

  const exportItems: Array<{
    id: keyof DataExportFormValues;
    label: string;
    description: string;
  }> = [
    {
      id: "include_profile",
      label: "Profile Information",
      description: "Basic account details, email, username, and settings",
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

  const onSubmit = (values: DataExportFormValues) => {
    exportMutation.mutate(values);
  };

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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {exportItems.map((item) => (
              <FormField
                key={item.id}
                control={form.control}
                name={item.id}
                render={({ field }) => (
                  <FormItem className="flex items-start space-x-3 p-3 border rounded-lg">
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
              type="submit"
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
          </form>
        </Form>

        {exportMutation.isSuccess && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Export request submitted successfully. Check your email for the
              download link.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
