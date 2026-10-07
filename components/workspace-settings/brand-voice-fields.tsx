"use client";

import type { QueryClient } from "@tanstack/react-query";
import type { Control } from "react-hook-form";

import { FieldController } from "@/components/forms/field-controller";
import { FormSection } from "@/components/forms/form-shell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import { workspaceQueries } from "@/lib/query-keys";
import {
  BRAND_VOICE_LIMITS,
  type BrandVoiceFormValues,
  splitLines,
} from "@/schemas/brand-voice-schemas";

const ONE_PER_LINE = "One per line.";

/**
 * The brand voice's fields, grouped as the settings show them: Settings → Brand voice
 * (BrandVoiceSection) and a new workspace's review step (WorkspaceReviewStep) render the same ones.
 */
export function BrandVoiceFields({
  control,
}: {
  control: Control<BrandVoiceFormValues>;
}) {
  return (
    <>
      <FormSection title="The brand">
        <FieldController
          control={control}
          name="brand_name"
          label="Brand name"
          maxLength={BRAND_VOICE_LIMITS.brand_name}
          description="Written into articles exactly as you type it here."
        >
          {(field) => <Input {...field} placeholder="Acme" />}
        </FieldController>
        <FieldController
          control={control}
          name="about"
          label="About"
          maxLength={BRAND_VOICE_LIMITS.about}
          description="What the brand does, in a few sentences."
        >
          {(field) => <Textarea {...field} rows={4} />}
        </FieldController>
        <FieldController
          control={control}
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
          control={control}
          name="customer_profile"
          label="Customers"
          maxLength={BRAND_VOICE_LIMITS.customer_profile}
          description="Who buys from the brand, and what they need."
        >
          {(field) => <Textarea {...field} rows={3} />}
        </FieldController>
        <FieldController
          control={control}
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
          control={control}
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
          control={control}
          name="content_pillar"
          label="Content pillars"
          description={`The themes articles come back to. ${ONE_PER_LINE}`}
        >
          {(field) => <Textarea {...field} rows={4} />}
        </FieldController>
      </FormSection>

      <FormSection title="Competitors">
        <FieldController
          control={control}
          name="competitors"
          label="Competitors"
          description={`Company names, ${ONE_PER_LINE.toLowerCase()} A name you add is checked for a live website when you save.`}
        >
          {(field) => <Textarea {...field} rows={4} />}
        </FieldController>
      </FormSection>
    </>
  );
}

/** Saves the brand voice, then keeps the cached brand voice and the workspace detail in step. */
export async function saveBrandVoice(
  queryClient: QueryClient,
  workspaceId: string,
  values: BrandVoiceFormValues,
) {
  const response = await apiClient.workspaces.updateBrandVoice(workspaceId, {
    brand_name: values.brand_name.trim(),
    about: values.about.trim(),
    customer_profile: values.customer_profile.trim(),
    selling_position: values.selling_position.trim(),
    target_audience: splitLines(values.target_audience),
    brand_voice: splitLines(values.brand_voice),
    competitors: splitLines(values.competitors),
    content_strategy: splitLines(values.content_pillar),
  });
  queryClient.setQueryData(
    workspaceQueries.brandVoice(workspaceId).queryKey,
    response,
  );
  // The workspace detail carries the brand voice too.
  await queryClient.invalidateQueries({ queryKey: ["workspaces", "detail"] });
  return response;
}
