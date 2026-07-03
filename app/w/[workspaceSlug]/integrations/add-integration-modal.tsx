"use client";

import type React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useWorkspace } from "@/providers/workspace-provider";
import { integrationsApiService } from "@/services/integrations-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import {
  integrationSchema,
  type IntegrationFormData,
  shopifyIntegrationSchema,
  type ShopifyIntegrationFormData,
} from "@/schemas/integration-schemas";
import { log } from "@/lib/logger";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AddIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (integration: unknown) => void;
}

type IntegrationType = "wordpress" | "shopify";

function WordPressLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
    >
      <title>WordPress Logo</title>
      <path
        d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"
        fill="#21759B"
      />
      <path
        d="M3.608 12c0 3.304 1.92 6.166 4.724 7.569L4.26 9.681A8.37 8.37 0 003.608 12zM17.86 11.549c0-1.031-.37-1.744-.687-2.299-.423-.687-.82-1.268-.82-1.955 0-.766.582-1.48 1.401-1.48.037 0 .072.005.108.007A8.387 8.387 0 0012 3.608c-2.9 0-5.453 1.487-6.942 3.743.195.006.379.01.536.01 .87 0 2.217-.106 2.217-.106.448-.026.5.632.053.685 0 0-.451.053-.953.079l3.032 9.015 1.822-5.463-1.297-3.552c-.448-.026-.872-.079-.872-.079-.448-.026-.396-.711.053-.685 0 0 1.374.106 2.191.106.87 0 2.217-.106 2.217-.106.449-.026.501.632.053.685 0 0-.452.053-.953.079l3.01 8.953.831-2.776c.36-1.151.634-1.977.634-2.689z"
        fill="white"
      />
      <path
        d="M12.085 12.865l-2.499 7.261a8.408 8.408 0 004.913-.127 .745.745 0 01-.061-.118l-2.353-7.016zM19.315 8.265a6.6 6.6 0 01.058.87c0 .858-.16 1.822-.64 3.029l-2.57 7.427A8.393 8.393 0 0020.393 12a8.355 8.355 0 00-1.078-3.735z"
        fill="white"
      />
    </svg>
  );
}

function ShopifyLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 109.5 124.5"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
    >
      <title>Shopify Logo</title>
      <path
        d="M74.7 14.8s-.3.1-.7.2c-.4-1.2-1-2.6-1.8-4-2.6-4.9-6.4-7.5-11-7.5-.3 0-.6 0-.9.1-.1-.2-.3-.3-.4-.5-2.1-2.3-4.8-3.3-8-3.2-6.2.2-12.4 4.7-17.4 12.7-3.5 5.6-6.2 12.6-6.9 18.1l-11.9 3.7c-3.5 1.1-3.6 1.2-4.1 4.5C11.2 41.5 0 124.5 0 124.5l80.6 13.9V14.2c-.7.2-5.9 0-5.9.6zm-13.7 4.2c-2.9.9-6.1 1.9-9.3 2.9.9-3.4 2.6-6.9 4.7-9.1 .8-.8 1.9-1.7 3.2-2.2 1.3 2.6 1.6 6.3 1.4 8.4zm-5.8-11.5c1 0 1.9.2 2.7.7-1.2.6-2.4 1.6-3.4 2.7-2.8 3-4.9 7.6-5.8 12-2.7.8-5.3 1.6-7.8 2.4 1.5-8.1 7.4-17.5 14.3-17.8z"
        fill="#95BF47"
      />
      <path
        d="M73.4 14.7c-.4 0-.7.1-1.1.1-3.2 8.5-9.8 19.8-13.5 23.5l-9.7 3c5.4-14.2 9.8-22.5 9.8-22.5s-1.5-4.2-4.5-7.2c-2.1-2-4.9-3.2-8.4-3.4L27.6 30.5l-14.8 4.6 80.4 13.8L74.7 14.8l-1.3-.1z"
        fill="#5E8E3E"
      />
      <path
        d="M51.8 52.9l-8.1 2.4s-3.4-1.8-8.5-1.8c-6.8 0-7.2 4.3-7.2 5.4 0 5.9 15.4 8.2 15.4 22.1 0 10.9-6.9 17.9-16.3 17.9-11.2 0-16.9-7-16.9-7l3-9.9s5.9 5 10.8 5c3.2 0 4.6-2.5 4.6-4.4 0-7.7-12.7-8-12.7-20.8 0-10.7 7.7-21.1 23.2-21.1 5.9-.1 8.7 1.7 12.7 12.2z"
        fill="white"
      />
    </svg>
  );
}

const INTEGRATION_OPTIONS: {
  type: IntegrationType;
  label: string;
  Logo: React.ComponentType<{ className?: string }>;
  description: string;
}[] = [
  {
    type: "wordpress",
    label: "WordPress",
    Logo: WordPressLogo,
    description: "Publish content directly to your WordPress site",
  },
  {
    type: "shopify",
    label: "Shopify",
    Logo: ShopifyLogo,
    description: "Sync content with your Shopify store blog",
  },
];

// ── WordPress form ────────────────────────────────────────────────────────────

function WordPressForm({
  onSuccess,
  onClose,
  workspaceId,
}: {
  onSuccess: () => void;
  onClose: () => void;
  workspaceId: string;
}) {
  const form = useForm<IntegrationFormData>({
    resolver: zodResolver(integrationSchema),
    defaultValues: {
      site_url: "",
      api_key: "",
      api_endpoint: "",
      is_active: true,
    },
  });
  const { isSubmitting } = form.formState;

  const onSubmit = async (data: IntegrationFormData) => {
    try {
      await integrationsApiService.createIntegration(workspaceId, {
        integration_type: "wordpress",
        is_active: data.is_active,
        site_url: data.site_url,
        api_endpoint: data.api_endpoint,
        api_key: data.api_key,
      });
      toast.success("WordPress connection added successfully");
      form.reset();
      onSuccess();
    } catch (error: unknown) {
      log.error("Failed to add WordPress integration", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add integration",
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2 space-y-0">
              <FormLabel>Enable Integration</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="site_url"
          render={({ field }) => (
            <FormItem className="grid gap-2 space-y-0">
              <FormLabel>WordPress Site URL *</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://yoursite.com"
                  {...field}
                />
              </FormControl>
              <p className="text-[0.8rem] text-muted-foreground">
                Must start with https:// and include a valid domain (e.g.
                yoursite.com)
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="api_key"
          render={({ field }) => (
            <FormItem className="grid gap-2 space-y-0">
              <FormLabel>API Key *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter API key from Rext plugin"
                  {...field}
                />
              </FormControl>
              <p className="text-[0.8rem] text-muted-foreground">
                Get this from the Rext WordPress plugin settings
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="api_endpoint"
          render={({ field }) => (
            <FormItem className="grid gap-2 space-y-0">
              <FormLabel>API Endpoint *</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://yoursite.com/wp-json/rext-ai/v1/"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Connection"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function ShopifyForm({
  onSuccess: _onSuccess,
  onClose,
  workspaceId,
}: {
  onSuccess: () => void;
  onClose: () => void;
  workspaceId: string;
}) {
  const form = useForm<
    Pick<ShopifyIntegrationFormData, "store_url" | "is_active">
  >({
    resolver: zodResolver(
      shopifyIntegrationSchema.pick({ store_url: true, is_active: true }),
    ),
    defaultValues: {
      store_url: "",
      is_active: true,
    },
  });
  const { isSubmitting } = form.formState;

  const onSubmit = async (
    data: Pick<ShopifyIntegrationFormData, "store_url" | "is_active">,
  ) => {
    try {
      const result = await integrationsApiService.startShopifyInstall(
        workspaceId,
        {
          store_url: data.store_url,
          return_path:
            typeof window !== "undefined"
              ? window.location.pathname
              : undefined,
        },
      );

      const installUrl =
        result.install_url || result.redirect_url || result.url;

      if (installUrl) {
        toast.success("Opening Shopify installation in a new tab...");
        window.open(installUrl, "_blank", "noopener,noreferrer");
      } else {
        throw new Error("Failed to get installation URL from Shopify");
      }
    } catch (error: unknown) {
      log.error("Failed to start Shopify installation", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to start installation",
      );
    }
  };

  const handleEnableChange = (checked: boolean) => {
    form.setValue("is_active", checked);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2 space-y-0">
              <FormLabel>Enable Integration</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={handleEnableChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="store_url"
          render={({ field }) => (
            <FormItem className="grid gap-2 space-y-0">
              <FormLabel>Store URL *</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://yourstore.myshopify.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Connecting..." : "Install on Shopify"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export function AddIntegrationModal({
  isOpen,
  onClose,
  onAdd,
}: AddIntegrationModalProps) {
  const { workspace } = useWorkspace();
  const [selectedType, setSelectedType] = useState<IntegrationType | null>(
    null,
  );

  const handleClose = () => {
    setSelectedType(null);
    onClose();
  };

  const handleSuccess = () => {
    onAdd(null);
    setSelectedType(null);
  };

  const selected = INTEGRATION_OPTIONS.find((o) => o.type === selectedType);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {selected ? `Connect ${selected.label}` : "Add Integration"}
          </DialogTitle>
          <DialogDescription>
            {selected
              ? selected.description
              : "Choose a platform to connect with your workspace."}
          </DialogDescription>
        </DialogHeader>

        {/* Type selector */}
        {!selectedType && (
          <div className="grid grid-cols-2 gap-3 py-4">
            {INTEGRATION_OPTIONS.map((opt) => (
              <button
                key={opt.type}
                type="button"
                onClick={() => {
                  setSelectedType(opt.type);
                }}
                className={cn(
                  "flex flex-col items-center gap-3 p-5 rounded-xl border border-border/50 bg-card hover:border-primary/40 hover:bg-accent/10 transition-all duration-200 cursor-pointer text-left group",
                )}
              >
                <opt.Logo className="h-8 w-auto object-contain" />
                <div>
                  <p className="text-[13px] font-semibold text-foreground text-center">
                    {opt.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground/60 text-center mt-0.5 leading-snug">
                    {opt.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Back button when type is selected */}
        {selectedType && (
          <button
            type="button"
            onClick={() => setSelectedType(null)}
            className="text-[12px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 -mt-1 mb-1"
          >
            ← Back to integrations
          </button>
        )}

        {/* Forms */}
        {selectedType === "wordpress" && workspace?.id && (
          <WordPressForm
            workspaceId={workspace.id}
            onSuccess={handleSuccess}
            onClose={handleClose}
          />
        )}
        {selectedType === "shopify" && workspace?.id && (
          <ShopifyForm
            workspaceId={workspace.id}
            onSuccess={handleSuccess}
            onClose={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
