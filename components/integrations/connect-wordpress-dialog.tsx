"use client";

import { Download, ExternalLink } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { FieldController } from "@/components/forms/field-controller";
import { PasswordInput } from "@/components/forms/password-input";
import { useZodForm } from "@/components/forms/use-zod-form";
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
import { Notice } from "@/components/ui/notice";
import {
  WORDPRESS_GUIDE_URL,
  WORDPRESS_PLUGIN_PATH,
  WORDPRESS_PLUGIN_URL,
  WORDPRESS_PLUGIN_VERSION,
} from "@/config/integrations";
import { useConnectWordPress } from "@/hooks/use-integrations";
import { analytics } from "@/lib/analytics";
import { log } from "@/lib/logger";
import {
  pluginEndpointFor,
  type WordPressSiteFormData,
  wordPressSiteSchema,
} from "@/schemas/integration-schemas";

const EMPTY: WordPressSiteFormData = {
  site_url: "",
  api_key: "",
  api_endpoint: "",
};

/**
 * Connecting a WordPress site (plans/app/D-pages.md §2.3): where to get the plugin, then its three
 * fields. The backend asks the plugin before it saves, so a wrong key or a missing plugin is said here,
 * beside the fields, and nothing is stored.
 */
export function ConnectWordPressDialog({
  workspaceId,
  open,
  onOpenChange,
  onConnected,
}: {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** After the site is saved and the dialog closed: the editor publishes the article it was holding. */
  onConnected?: () => void;
}) {
  const connect = useConnectWordPress(workspaceId);
  const [refusal, setRefusal] = useState<string | null>(null);
  // The endpoint this dialog last filled in; one the person typed themselves is never replaced.
  const suggested = useRef("");
  const form = useZodForm(wordPressSiteSchema, { defaultValues: EMPTY });
  const { isSubmitting } = form.formState;

  const close = (next: boolean) => {
    if (!next) {
      form.reset(EMPTY);
      setRefusal(null);
      suggested.current = "";
    }
    onOpenChange(next);
  };

  // The endpoint is nearly always the address plus the plugin's path: fill it in once the address is,
  // and follow a corrected address while the endpoint is still the one filled in.
  const suggestEndpoint = () => {
    const current = form.getValues("api_endpoint");
    if (current && current !== suggested.current) return;
    const endpoint = pluginEndpointFor(
      form.getValues("site_url"),
      WORDPRESS_PLUGIN_PATH,
    );
    if (!endpoint || endpoint === current) return;
    suggested.current = endpoint;
    form.setValue("api_endpoint", endpoint, {
      shouldValidate: form.getFieldState("api_endpoint").isTouched,
    });
  };

  const onSubmit = form.handleSubmit(async (data) => {
    setRefusal(null);
    try {
      await connect.mutateAsync({ ...data, is_active: true });
      toast.success(`${new URL(data.site_url).hostname} is connected`);
      analytics.track("cms_connection_completed", {
        cms_type: "wordpress",
        workspace_id: workspaceId,
      });
      close(false);
      onConnected?.();
    } catch (error) {
      log.error("Connecting a WordPress site failed", error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : "The site didn't connect. Check the address and the key, then try again.";
      setRefusal(message);
      analytics.track("cms_connection_failed", {
        cms_type: "wordpress",
        workspace_id: workspaceId,
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect WordPress</DialogTitle>
          <DialogDescription>
            Rext AI publishes to your site through the Rext AI plugin.
          </DialogDescription>
        </DialogHeader>

        <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-muted-foreground">
          <li>
            Install the plugin on your site: upload the file under Plugins → Add
            New → Upload Plugin, then activate it. It isn't in the WordPress
            plugin directory yet.
            <div className="mt-2 flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <a href={WORDPRESS_PLUGIN_URL} download>
                  <Download aria-hidden />
                  Download the plugin (v{WORDPRESS_PLUGIN_VERSION}, .zip)
                </a>
              </Button>
              <Button data-rec="show" asChild variant="ghost" size="sm">
                <a
                  href={WORDPRESS_GUIDE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Setup guide
                  <ExternalLink aria-hidden />
                </a>
              </Button>
            </div>
          </li>
          <li>
            In WordPress, open the plugin's settings and copy its API key.
          </li>
          <li>Paste it below with your site's address.</li>
        </ol>

        <form
          id="connect-wordpress"
          onSubmit={onSubmit}
          noValidate
          className="flex flex-col gap-5"
        >
          {refusal && (
            <Notice tone="danger" title="The site didn't connect">
              {refusal}
            </Notice>
          )}
          <FieldController
            control={form.control}
            name="site_url"
            label="Site address"
            required
          >
            {(field) => (
              <Input
                {...field}
                type="url"
                inputMode="url"
                autoComplete="url"
                placeholder="https://example.com"
                onBlur={() => {
                  field.onBlur();
                  suggestEndpoint();
                }}
              />
            )}
          </FieldController>
          <FieldController
            control={form.control}
            name="api_key"
            label="API key"
            description="From the plugin's settings page in WordPress."
            required
          >
            {(field) => (
              <PasswordInput
                {...field}
                autoComplete="off"
                spellCheck={false}
                className="font-mono"
              />
            )}
          </FieldController>
          <FieldController
            control={form.control}
            name="api_endpoint"
            label="Plugin endpoint"
            description={`Your address followed by ${WORDPRESS_PLUGIN_PATH}, unless your site moved its REST API.`}
            required
          >
            {(field) => (
              <Input
                {...field}
                type="url"
                inputMode="url"
                placeholder={`https://example.com${WORDPRESS_PLUGIN_PATH}`}
                className="font-mono"
              />
            )}
          </FieldController>
        </form>

        <DialogFooter>
          <Button
            data-rec="show"
            type="button"
            variant="outline"
            onClick={() => close(false)}
          >
            Cancel
          </Button>
          <Button
            data-rec="show"
            type="submit"
            form="connect-wordpress"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Checking the plugin…" : "Connect site"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
