"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

import { FormShell } from "@/components/forms/form-shell";
import { useZodForm } from "@/components/forms/use-zod-form";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BrandVoiceFields,
  saveBrandVoice,
} from "@/components/workspace-settings/brand-voice-fields";
import { DraftedNotice } from "@/components/workspace-settings/drafted-notice";
import { useShowAfter } from "@/hooks/use-show-after";
import { workspaceQueries } from "@/lib/query-keys";
import { workspaceRoutes } from "@/lib/routes";
import {
  type BrandVoiceFormValues,
  brandVoiceFormSchema,
  toBrandVoiceFormValues,
} from "@/schemas/brand-voice-schemas";

/**
 * A new workspace's last step (FB2.1, rext-control#682): what the analysis read from the website,
 * in the creation flow itself and editable, then Finish. The analysis has saved the draft already,
 * so Finish saves only what was changed here, then opens Generate content: the first article is
 * the next thing to do (the founder's choice, 2026-10-07). The same fields stay in Settings →
 * Brand voice for later.
 */
export function WorkspaceReviewStep({
  workspaceId,
  workspaceSlug,
  website,
  withoutSite = false,
  after,
}: {
  workspaceId: string;
  workspaceSlug: string;
  website?: string;
  /** Made from a description of the business: there is no website (rext-control#853). */
  withoutSite?: boolean;
  /** Under the fields, before Finish: what the draft showed that the fields don't hold. */
  after?: ReactNode;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isPending, isError, refetch } = useQuery(
    workspaceQueries.brandVoice(workspaceId),
  );

  // A quick read shows no skeleton at all: it appears only after a short delay.
  const showSkeleton = useShowAfter(isPending);

  const form = useZodForm(brandVoiceFormSchema, {
    defaultValues: toBrandVoiceFormValues(),
  });

  // The drafted brand voice, once read; anything typed meanwhile stays.
  useEffect(() => {
    form.reset(toBrandVoiceFormValues(data?.brand_voice), {
      keepDirtyValues: true,
    });
  }, [data, form]);

  const finish = async (values: BrandVoiceFormValues) => {
    try {
      if (form.formState.isDirty) {
        await saveBrandVoice(queryClient, workspaceId, values);
      }
      router.push(workspaceRoutes.generate_content(workspaceSlug) as Route);
    } catch (error) {
      form.setError("root.server", {
        message:
          error instanceof Error
            ? error.message
            : "Your changes couldn't be saved. Try again.",
      });
    }
  };

  if (isPending) {
    return showSkeleton ? <Skeleton className="h-96 w-full" /> : null;
  }

  if (isError) {
    return (
      <Notice
        tone="danger"
        title={
          withoutSite
            ? "The brand voice couldn't be loaded"
            : "The details from your website couldn't be loaded"
        }
        action={
          <Button
            data-rec="show"
            size="sm"
            variant="outline"
            onClick={() => void refetch()}
          >
            Try again
          </Button>
        }
      >
        Your workspace is created and its details are saved. Try again, or
        review them later in the workspace's Brand voice settings.
      </Notice>
    );
  }

  const serverError = form.formState.errors.root?.server?.message;

  return (
    <div className="flex flex-col gap-8">
      <DraftedNotice
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
        website={website}
        withoutSite={withoutSite}
        competitors={data?.brand_voice?.competitors}
        closing="Check each part, change anything that's off, then finish."
      />
      <FormShell form={form} onSubmit={finish} submitLabel="Finish" sticky>
        {serverError && (
          <Notice tone="danger" title="Your changes weren't saved">
            {serverError}
          </Notice>
        )}
        <BrandVoiceFields control={form.control} />
        {after}
      </FormShell>
    </div>
  );
}
