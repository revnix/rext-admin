"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { FormShell } from "@/components/forms/form-shell";
import { useSavedStatus } from "@/components/forms/use-saved-status";
import { useZodForm } from "@/components/forms/use-zod-form";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { BrandVoiceRefreshControl } from "@/components/workspace";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { BRAND_VOICE_PERMISSIONS } from "@/lib/permissions";
import { workspaceQueries } from "@/lib/query-keys";
import { useWorkspace } from "@/providers/workspace-provider";
import {
  type BrandVoiceFormValues,
  brandVoiceFormSchema,
  toBrandVoiceFormValues,
} from "@/schemas/brand-voice-schemas";
import { brandVoiceRefreshFor, useWorkspaceStore } from "@/stores/workspace";
import { SettingsGroup } from "@/components/settings/settings-group";
import {
  BrandVoiceFields,
  saveBrandVoice,
} from "@/components/workspace-settings/brand-voice-fields";
import {
  DraftedNotice,
  namedPeople,
} from "@/components/workspace-settings/drafted-notice";

/**
 * Workspace settings, Brand voice: the one place the brand voice is edited (plans/app/D-pages.md
 * §2.6). Every generation reads it. It is read from the workspace's website when the workspace is
 * created; "Read the website again" re-runs that and replaces the fields. Without
 * brand_voice.update the form is shown disabled.
 */
export function BrandVoiceSection() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  // Arriving from a new workspace's analysis: the notice shows for this visit only. The parameter
  // leaves the address at once, so coming back later (from Personas, say) shows no stale notice.
  const [drafted] = useState(() => searchParams.get("drafted") === "1");
  useEffect(() => {
    if (searchParams.get("drafted") === null) return;
    const rest = new URLSearchParams(searchParams);
    rest.delete("drafted");
    const query = rest.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}` as Route, {
      scroll: false,
    });
  }, [searchParams, pathname, router]);
  const { workspace, workspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const { hasPermission: canRead, isLoading: isReadLoading } =
    useWorkspacePermission(BRAND_VOICE_PERMISSIONS.READ, workspaceId);
  const { hasPermission: canUpdate, isLoading: isUpdateLoading } =
    useWorkspacePermission(BRAND_VOICE_PERMISSIONS.UPDATE, workspaceId);
  // A failed refresh in another workspace isn't this one's.
  const refreshError = useWorkspaceStore(
    (state) =>
      brandVoiceRefreshFor(state.brandVoiceRefresh, workspace?.id).refreshError,
  );

  const { data, isLoading } = useQuery({
    ...workspaceQueries.brandVoice(workspace?.id || ""),
    enabled: !!workspace?.id && canRead,
  });
  const voice = data?.brand_voice ?? workspace?.brand_voice;

  const form = useZodForm(brandVoiceFormSchema, {
    defaultValues: toBrandVoiceFormValues(),
  });
  const { status, markSaved } = useSavedStatus(form.formState.isDirty);

  // Follow the saved brand voice (loading, a save, a refresh from the website), keeping
  // whatever the person is still typing.
  useEffect(() => {
    form.reset(toBrandVoiceFormValues(voice), { keepDirtyValues: true });
  }, [voice, form]);

  const onSubmit = async (values: BrandVoiceFormValues) => {
    if (!workspace?.id) return;
    try {
      const response = await saveBrandVoice(queryClient, workspace.id, values);
      markSaved();
      form.reset(toBrandVoiceFormValues(response.brand_voice));
    } catch (error) {
      form.setError("root.server", {
        message:
          error instanceof Error
            ? error.message
            : "The brand voice couldn't be saved. Try again.",
      });
    }
  };

  if (!workspace?.id || isReadLoading || isUpdateLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!canRead) {
    return (
      <Notice title="The brand voice is hidden from your role">
        Ask the workspace's owner if you need to see it.
      </Notice>
    );
  }

  const serverError = form.formState.errors.root?.server?.message;

  return (
    <div className="flex flex-col gap-8">
      {/* Arriving from a new workspace's analysis (WorkspaceCreateWizard): the draft is saved already. */}
      {drafted && (
        <DraftedNotice
          workspaceId={workspace.id}
          workspaceSlug={workspace.slug}
          website={workspace.url ?? ""}
          withoutSite={!workspace.url}
          competitors={voice?.competitors}
        />
      )}
      <SettingsGroup
        title="Brand voice"
        description={
          form.formState.isDirty && canUpdate
            ? "How every article sounds and who it's written for. Save or undo your changes before reading the website again: it replaces the fields below."
            : "How every article sounds and who it's written for. It was read from your website when the workspace was created; reading the website again replaces the fields below."
        }
        action={
          canUpdate && (
            <BrandVoiceRefreshControl
              workspaceId={workspace.id}
              buttonVariant="outline"
              buttonSize="default"
              // A refresh replaces the saved voice, and unsaved edits would then be saved over it.
              disabled={form.formState.isSubmitting || form.formState.isDirty}
            >
              <RefreshCw aria-hidden />
              Read the website again
            </BrandVoiceRefreshControl>
          )
        }
      >
        {refreshError && (
          <Notice tone="danger" title="The website couldn't be read">
            {refreshError}
          </Notice>
        )}
      </SettingsGroup>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <fieldset disabled={!canUpdate} className="min-w-0">
          <FormShell
            form={form}
            onSubmit={onSubmit}
            submitLabel="Save brand voice"
            status={status}
            sticky
          >
            {!canUpdate && (
              <p className="text-sm text-muted-foreground">
                Your role can see the brand voice but not change it.
              </p>
            )}
            {serverError && (
              <Notice tone="danger" title="The brand voice wasn't saved">
                {serverError}
              </Notice>
            )}
            <BrandVoiceFields control={form.control} />
          </FormShell>
        </fieldset>
      )}
    </div>
  );
}

// The notice moved to its own file (the creation flow shows it too); kept importable from here.
export { DraftedNotice, namedPeople };
