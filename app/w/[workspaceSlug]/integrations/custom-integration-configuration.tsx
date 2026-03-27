"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2 } from "lucide-react";
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
  integrationSchema,
  type IntegrationFormData,
} from "@/schemas/integration-schemas";
import type { Integration } from "@/services/integrations-api";

interface CustomIntegrationConfigurationProps {
  integration: Integration;
  onUpdate: (updatedIntegration: Partial<Integration>) => void;
  onDelete?: () => void;
}

export function CustomIntegrationConfiguration({
  integration,
  onUpdate,
  onDelete,
}: CustomIntegrationConfigurationProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const form = useForm<IntegrationFormData>({
    resolver: zodResolver(integrationSchema),
    defaultValues: {
      site_url:
        integration.site?.site_url ||
        (integration.config?.url as string | undefined) ||
        "",
      api_key:
        integration.site?.api_key ||
        (integration.config?.apiKey as string | undefined) ||
        "",
      api_endpoint:
        integration.site?.api_endpoint ||
        (integration.config?.api_endpoint as string | undefined) ||
        "",
      is_active: integration.site?.is_active ?? true,
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

  const onSubmit = async (data: IntegrationFormData) => {
    // Construct payload with only updateable fields
    const payload = {
      site_url: data.site_url,
      api_key: data.api_key,
      api_endpoint: data.api_endpoint,
      active: data.is_active,
      is_active: data.is_active,
    };
    await onUpdate(payload);
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
            <FormLabel className="text-base font-medium text-slate-700">
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
            <FormLabel className="text-base font-medium text-slate-700">
              Site URL
            </FormLabel>
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
                      className="bg-white font-mono text-sm"
                    />
                  </FormControl>
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(field.value, "url")}
                    className="shrink-0"
                    type="button"
                  >
                    {copiedField === "url" ? (
                      <Check className="h-4 w-4 text-green-600" />
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
            <FormLabel className="text-base font-medium text-slate-700">
              API Key
            </FormLabel>
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
                      placeholder="rext_..."
                      className="bg-white font-mono text-sm mb-2"
                    />
                  </FormControl>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="text-slate-600"
                      type="button"
                    >
                      {showApiKey ? "Hide" : "Show"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(field.value, "key")}
                      className="text-slate-600"
                      type="button"
                    >
                      {copiedField === "key" ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        "Copy"
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  The API key used for authentication.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* API Endpoint */}
          <div className="pt-2">
            <FormLabel className="text-base font-medium text-slate-700">
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
                      className="bg-white font-mono text-sm"
                    />
                  </FormControl>
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(field.value, "endpoint")}
                    className="shrink-0"
                    type="button"
                  >
                    {copiedField === "endpoint" ? (
                      <Check className="h-4 w-4 text-green-600" />
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

          {/* Actions */}
          <div className="pt-6 border-t col-span-1 md:col-span-2 flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
            <Button
              variant="destructive"
              onClick={onDelete}
              className="w-full sm:w-auto"
              type="button"
            >
              Delete Integration
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
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
