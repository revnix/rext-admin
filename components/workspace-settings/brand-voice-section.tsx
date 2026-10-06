"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useEffect } from "react";

import { FieldController } from "@/components/forms/field-controller";
import { FormSection, FormShell } from "@/components/forms/form-shell";
import { useSavedStatus } from "@/components/forms/use-saved-status";
import { useZodForm } from "@/components/forms/use-zod-form";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { BrandVoiceRefreshControl } from "@/components/workspace";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { apiClient } from "@/lib/api-client";
import { BRAND_VOICE_PERMISSIONS } from "@/lib/permissions";
import { workspaceQueries } from "@/lib/query-keys";
import { useWorkspace } from "@/providers/workspace-provider";
import {
  BRAND_VOICE_LIMITS,
  type BrandVoiceFormValues,
  brandVoiceFormSchema,
  splitLines,
  toBrandVoiceFormValues,
} from "@/schemas/brand-voice-schemas";
import { useWorkspaceStore } from "@/stores/workspace";
import { SettingsGroup } from "@/components/settings/settings-group";

const ONE_PER_LINE = "One per line.";

/**
 * Workspace settings, Brand voice: the one place the brand voice is edited (plans/app/D-pages.md
 * §2.6). Every generation reads it. It is read from the workspace's website when the workspace is
 * created; "Read the website again" re-runs that and replaces the fields. Without
 * brand_voice.update the form is shown disabled.
 */
export function BrandVoiceSection() {
  const { workspace, workspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const { hasPermission: canRead, isLoading: isReadLoading } =
    useWorkspacePermission(BRAND_VOICE_PERMISSIONS.READ, workspaceId);
  const { hasPermission: canUpdate, isLoading: isUpdateLoading } =
    useWorkspacePermission(BRAND_VOICE_PERMISSIONS.UPDATE, workspaceId);
  const refreshError = useWorkspaceStore(
    (state) => state.brandVoiceRefresh.refreshError,
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
      const response = await apiClient.workspaces.updateBrandVoice(
        workspace.id,
        {
          brand_name: values.brand_name.trim(),
          about: values.about.trim(),
          customer_profile: values.customer_profile.trim(),
          selling_position: values.selling_position.trim(),
          target_audience: splitLines(values.target_audience),
          brand_voice: splitLines(values.brand_voice),
          competitors: splitLines(values.competitors),
          content_strategy: splitLines(values.content_pillar),
        },
      );
      markSaved();
      form.reset(toBrandVoiceFormValues(response.brand_voice));
      queryClient.setQueryData(
        workspaceQueries.brandVoice(workspace.id).queryKey,
        response,
      );
      // The workspace detail carries the brand voice too.
      await queryClient.invalidateQueries({
        queryKey: ["workspaces", "detail"],
      });
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
            <FormSection title="The brand">
              <FieldController
                control={form.control}
                name="brand_name"
                label="Brand name"
                maxLength={BRAND_VOICE_LIMITS.brand_name}
                description="Written into articles exactly as you type it here."
              >
                {(field) => <Input {...field} placeholder="Acme" />}
              </FieldController>
              <FieldController
                control={form.control}
                name="about"
                label="About"
                maxLength={BRAND_VOICE_LIMITS.about}
                description="What the brand does, in a few sentences."
              >
                {(field) => <Textarea {...field} rows={4} />}
              </FieldController>
              <FieldController
                control={form.control}
                name="selling_position"
                label="What sets it apart"
                maxLength={BRAND_VOICE_LIMITS.selling_position}
                description="Why a customer chooses it over the others."
              >
                {(field) => <Textarea {...field} rows={3} />}
              </FieldController>
            </FormSection>

            <FormSection title="Who it's for">
              <FieldController
                control={form.control}
                name="customer_profile"
                label="Customers"
                maxLength={BRAND_VOICE_LIMITS.customer_profile}
                description="Who buys from the brand, and what they need."
              >
                {(field) => <Textarea {...field} rows={3} />}
              </FieldController>
              <FieldController
                control={form.control}
                name="target_audience"
                label="Audiences"
                description={`The groups articles speak to. ${ONE_PER_LINE}`}
              >
                {(field) => (
                  <Textarea
                    {...field}
                    rows={4}
                    placeholder={"Small business owners\nMarketing managers"}
                  />
                )}
              </FieldController>
            </FormSection>

            <FormSection title="How it sounds">
              <FieldController
                control={form.control}
                name="brand_voice"
                label="Voice"
                description={`Words for the tone of the writing. ${ONE_PER_LINE}`}
              >
                {(field) => (
                  <Textarea
                    {...field}
                    rows={4}
                    placeholder={"Friendly\nPlain-spoken"}
                  />
                )}
              </FieldController>
              <FieldController
                control={form.control}
                name="content_pillar"
                label="Content pillars"
                description={`The themes articles come back to. ${ONE_PER_LINE}`}
              >
                {(field) => <Textarea {...field} rows={4} />}
              </FieldController>
            </FormSection>

            <FormSection title="Competitors">
              <FieldController
                control={form.control}
                name="competitors"
                label="Competitors"
                description={`Company names, ${ONE_PER_LINE.toLowerCase()} A name you add is checked for a live website when you save.`}
              >
                {(field) => <Textarea {...field} rows={4} />}
              </FieldController>
            </FormSection>
          </FormShell>
        </fieldset>
      )}
    </div>
  );
}
