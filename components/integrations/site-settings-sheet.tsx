"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FieldController } from "@/components/forms/field-controller";
import { PasswordInput } from "@/components/forms/password-input";
import { useZodForm } from "@/components/forms/use-zod-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { WORDPRESS_PLUGIN_PATH } from "@/config/integrations";
import { useUpdateWordPress } from "@/hooks/use-integrations";
import type {
  ConnectionTestResult,
  Integration,
} from "@/lib/api-client/integrations";
import { dateFormat } from "@/lib/formatters/date-formatters";
import { log } from "@/lib/logger";
import {
  type WordPressSiteUpdateFormData,
  wordPressSiteUpdateSchema,
} from "@/schemas/integration-schemas";
import { siteHost } from "./site-host";
import { useSiteTest } from "./use-site-test";

function valuesOf(site: Integration): WordPressSiteUpdateFormData {
  return {
    site_url: site.site_url ?? "",
    api_endpoint: site.api_endpoint ?? "",
    // The saved key never comes back; a typed one replaces it.
    api_key: "",
  };
}

/**
 * A connected site's settings in a sheet beside the list (design/app-language.md §6): its address,
 * the plugin's endpoint, a new key, and the test. Publishing on or off and disconnecting are the
 * row's own actions.
 */
export function SiteSettingsSheet({
  workspaceId,
  site,
  open,
  canUpdate,
  onOpenChange,
}: {
  workspaceId: string;
  /** The site being edited, kept while the sheet closes. */
  site: Integration | null;
  open: boolean;
  canUpdate: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const update = useUpdateWordPress(workspaceId);
  const test = useSiteTest(workspaceId);
  const [result, setResult] = useState<ConnectionTestResult | null>(null);
  const [refusal, setRefusal] = useState<string | null>(null);
  const form = useZodForm(wordPressSiteUpdateSchema, {
    defaultValues: site ? valuesOf(site) : undefined,
  });
  const { isSubmitting, isDirty } = form.formState;

  // Each opening starts from the site's saved values, with no earlier result.
  useEffect(() => {
    if (open && site) form.reset(valuesOf(site));
    if (open) {
      setResult(null);
      setRefusal(null);
    }
  }, [open, site, form]);

  const onSubmit = form.handleSubmit(async (data) => {
    if (!site) return;
    setRefusal(null);
    try {
      await update.mutateAsync({
        siteId: site.id,
        data: {
          site_url: data.site_url,
          api_endpoint: data.api_endpoint,
          ...(data.api_key ? { api_key: data.api_key } : {}),
        },
      });
      toast.success("Saved");
      onOpenChange(false);
    } catch (error) {
      log.error("Saving a WordPress site failed", error);
      setRefusal(
        error instanceof Error && error.message
          ? error.message
          : "The changes weren't saved. Try again in a moment.",
      );
    }
  });

  return (
    <Sheet open={open && Boolean(site)} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        {site && (
          <>
            <SheetHeader>
              <SheetTitle className="break-all">{siteHost(site)}</SheetTitle>
              <SheetDescription>
                WordPress, connected {dateFormat.short(site.created_at)}
              </SheetDescription>
            </SheetHeader>
            <form
              id="site-settings"
              onSubmit={onSubmit}
              noValidate
              className="flex flex-col gap-5 px-4"
            >
              {refusal && (
                <Notice tone="danger" title="Not saved">
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
                    disabled={!canUpdate}
                  />
                )}
              </FieldController>
              <FieldController
                control={form.control}
                name="api_endpoint"
                label="Plugin endpoint"
                description={`Usually your address followed by ${WORDPRESS_PLUGIN_PATH}`}
                required
              >
                {(field) => (
                  <Input
                    {...field}
                    type="url"
                    inputMode="url"
                    className="font-mono"
                    disabled={!canUpdate}
                  />
                )}
              </FieldController>
              <FieldController
                control={form.control}
                name="api_key"
                label="API key"
                description={
                  site.has_api_key
                    ? "Leave it blank to keep the saved key, or paste a new one from the plugin's settings."
                    : "No key is saved: paste the one from the plugin's settings."
                }
              >
                {(field) => (
                  <PasswordInput
                    {...field}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder={site.has_api_key ? "Saved" : undefined}
                    className="font-mono"
                    disabled={!canUpdate}
                  />
                )}
              </FieldController>

              <div className="flex flex-col items-start gap-3 border-t border-border pt-5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => setResult(await test.run(site))}
                  disabled={test.isPending}
                >
                  {test.isPending ? "Testing…" : "Test connection"}
                </Button>
                <p className="text-sm text-muted-foreground">
                  Asks the plugin with the saved settings; nothing changes on
                  your site. Save a change before testing it.
                </p>
                <div role="status" aria-live="polite" className="w-full">
                  {result && (
                    <Notice
                      tone={result.ok ? "success" : "danger"}
                      title={
                        result.ok ? "The plugin answered" : "The test failed"
                      }
                    >
                      {result.message}
                    </Notice>
                  )}
                </div>
              </div>
            </form>
            <SheetFooter>
              <Button
                type="submit"
                form="site-settings"
                disabled={!canUpdate || !isDirty || isSubmitting}
              >
                {isSubmitting ? "Saving…" : "Save changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
