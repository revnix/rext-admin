"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, CircleAlert, CircleCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useState } from "react";
import {
  updateIntegrationSchema,
  type UpdateIntegrationFormData,
} from "@/schemas/integration-schemas";
import type {
  ConnectionTestResult,
  Integration,
} from "@/lib/api-client/integrations";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useTestWordPress } from "@/hooks/use-integrations";
import { useWorkspace } from "@/providers/workspace-provider";

/** The form's values; an empty `api_key` keeps the saved key. */
export type WordPressSiteChanges = UpdateIntegrationFormData;

interface CustomIntegrationConfigurationProps {
  integration: Integration;
  onUpdate: (changes: WordPressSiteChanges) => Promise<void>;
  onDelete?: () => void;
  canUpdate?: boolean;
}

export function CustomIntegrationConfiguration({
  integration,
  onUpdate,
  onDelete,
  canUpdate = true,
}: CustomIntegrationConfigurationProps) {
  const { workspace } = useWorkspace();
  const testSite = useTestWordPress(workspace?.id ?? "");
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(
    null,
  );
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const form = useForm<UpdateIntegrationFormData>({
    resolver: zodResolver(updateIntegrationSchema),
    defaultValues: {
      site_url: integration.site_url ?? "",
      // The saved key never comes back from the backend; a typed one replaces it.
      api_key: "",
      api_endpoint: integration.api_endpoint ?? "",
      is_active: integration.is_active,
    },
  });

  const { isSubmitting } = form.formState;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleToggleEnable = (checked: boolean) => {
    form.setValue("is_active", checked);
  };

  const handleTest = async () => {
    setTestResult(null);
    try {
      setTestResult(await testSite.mutateAsync(integration.id));
    } catch (e) {
      setTestResult({
        site_id: integration.id,
        ok: false,
        status: "error",
        message: e instanceof Error ? e.message : "The test could not run.",
        checked_at: new Date().toISOString(),
      });
    }
  };

  const onSubmit = async (data: UpdateIntegrationFormData) => {
    await onUpdate(data);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 mt-6 text-left"
      >
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 items-start">
          {/* Enable Integration */}
          <div>
            <FormLabel className="text-base font-medium">
              Enable Integration
            </FormLabel>
          </div>
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={handleToggleEnable}
                  />
                </FormControl>
                <p className="text-sm text-muted-foreground">
                  Enable or disable the Rext AI integration.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Site URL */}
          <div className="pt-2">
            <FormLabel className="text-base font-medium">Site URL</FormLabel>
          </div>
          <FormField
            control={form.control}
            name="site_url"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <div className="flex gap-2 max-w-xl">
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="https://example.com"
                      className="font-mono text-sm"
                    />
                  </FormControl>
                  <Button
                    variant="outline"
                    onClick={() =>
                      field.value && copyToClipboard(field.value, "url")
                    }
                    className="shrink-0"
                    type="button"
                  >
                    {copiedField === "url" ? (
                      <Check className="h-4 w-4 text-success-600" />
                    ) : (
                      "Copy"
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  The URL for this integration.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* API Key */}
          <div className="pt-2">
            <FormLabel className="text-base font-medium">API Key</FormLabel>
          </div>
          <FormField
            control={form.control}
            name="api_key"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <div className="max-w-xl">
                  <FormControl>
                    <Input
                      type={showApiKey ? "text" : "password"}
                      {...field}
                      placeholder={
                        integration.has_api_key ? "Saved" : "rext_..."
                      }
                      autoComplete="off"
                      className="font-mono text-sm mb-2"
                    />
                  </FormControl>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowApiKey(!showApiKey)}
                    type="button"
                  >
                    {showApiKey ? "Hide" : "Show"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {integration.has_api_key
                    ? "Leave it blank to keep the saved key, or paste a new one from the Rext AI plugin."
                    : "The API key from the Rext AI plugin."}
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* API Endpoint */}
          <div className="pt-2">
            <FormLabel className="text-base font-medium">
              API Endpoint
            </FormLabel>
          </div>
          <FormField
            control={form.control}
            name="api_endpoint"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <div className="flex gap-2 max-w-xl">
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="https://example.com/wp-json/rext-ai/v1/"
                      className="font-mono text-sm"
                    />
                  </FormControl>
                  <Button
                    variant="outline"
                    onClick={() =>
                      field.value && copyToClipboard(field.value, "endpoint")
                    }
                    className="shrink-0"
                    type="button"
                  >
                    {copiedField === "endpoint" ? (
                      <Check className="h-4 w-4 text-success-600" />
                    ) : (
                      "Copy"
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  The REST API endpoint for this integration.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Connection test: the saved settings, checked again */}
          <div className="pt-2">
            <FormLabel className="text-base font-medium">Connection</FormLabel>
          </div>
          <div className="space-y-2">
            <Button
              variant="outline"
              type="button"
              onClick={handleTest}
              disabled={testSite.isPending}
            >
              {testSite.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test connection"
              )}
            </Button>
            <p className="text-sm text-muted-foreground">
              Checks the saved settings with the Rext AI plugin; nothing changes
              on your site.
            </p>
            <div role="status" aria-live="polite">
              {testResult && (
                <p
                  className={
                    testResult.ok
                      ? "flex items-start gap-2 text-sm text-success-700"
                      : "flex items-start gap-2 text-sm text-danger-700"
                  }
                >
                  {testResult.ok ? (
                    <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  {testResult.message}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-6 border-t col-span-1 md:col-span-2 flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
            <ConfirmationDialog
              title="Delete Integration"
              description="Are you sure you want to delete this integration?"
              confirmText="Delete"
              variant="destructive"
              onConfirm={onDelete || (() => {})}
            >
              <Button
                variant="destructive"
                className="w-full sm:w-auto"
                type="button"
                disabled={!onDelete}
              >
                Delete Integration
              </Button>
            </ConfirmationDialog>
            <Button
              type="submit"
              disabled={isSubmitting || !canUpdate}
              className="w-full sm:w-auto min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
