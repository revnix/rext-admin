"use client";

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
} from "@/schemas/integration-schemas";

interface AddIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (integration: any) => void;
}

export function AddIntegrationModal({
  isOpen,
  onClose,
  onAdd,
}: AddIntegrationModalProps) {
  const { workspace } = useWorkspace();

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
    if (!workspace?.id) return;

    try {
      await integrationsApiService.createIntegration(workspace.id, {
        integration_type: "wordpress",
        is_active: data.is_active,
        site_url: data.site_url,
        api_endpoint: data.api_endpoint,
        api_key: data.api_key,
      });
      toast.success("WordPress connection added successfully");
      onAdd(null); // Signal success
      form.reset();
      onClose();
    } catch (error: any) {
      console.error("Failed to add integration", error);
      toast.error(error.message || "Failed to add integration");
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {
        form.reset();
        onClose();
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add WordPress Connection</DialogTitle>
          <DialogDescription>
            Connect your WordPress site to publish content directly from Rext
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 py-4"
          >
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
                    <Input placeholder="https://yoursite.com" {...field} />
                  </FormControl>
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
                      type="password"
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
      </DialogContent>
    </Dialog>
  );
}
