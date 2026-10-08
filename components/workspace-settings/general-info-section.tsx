"use client";

import * as React from "react";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import type { Route } from "next";

import { FieldController } from "@/components/forms/field-controller";
import { FormSection, FormShell } from "@/components/forms/form-shell";
import { useSavedStatus } from "@/components/forms/use-saved-status";
import { useZodForm } from "@/components/forms/use-zod-form";
import { WorkspaceFavicon } from "@/components/shell/workspace-favicon";
import { BrandVoiceRefreshControl } from "@/components/workspace/brand-voice-refresh-control";
import { Field, FieldDescription, FieldTitle } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { apiClient } from "@/lib/api-client";
import { WORKSPACE_PERMISSIONS } from "@/lib/permissions";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";
import {
  type WorkspaceGeneralInfo,
  workspaceGeneralInfoSchema,
} from "@/schemas/workspace-schemas";
import { brandVoiceRefreshFor, useWorkspaceStore } from "@/stores/workspace";

/**
 * Workspace settings, General: the name and the website, the slug and the icon shown. Every member
 * sees them; changing them needs workspace.update, so without it the form is shown disabled.
 *
 * A workspace made from a description of the business has no website (rext-control#853): the field
 * is then empty and can stay so. Adding one saves it and starts nothing; the page then offers to
 * read it, since a read replaces the brand voice and must be asked for.
 */
export function GeneralInfoSection() {
  const { workspace, workspaceId } = useWorkspace();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission: canUpdate, isLoading: isPermissionLoading } =
    useWorkspacePermission(WORKSPACE_PERMISSIONS.UPDATE, workspaceId);

  const setCurrentWorkspace = useWorkspaceStore(
    (state) => state.setCurrentWorkspace,
  );

  const updateWorkspaceInList = useWorkspaceStore(
    (state) => state.updateWorkspaceInList,
  );

  const form = useZodForm(workspaceGeneralInfoSchema, {
    defaultValues: { name: "", slug: "", url: "" },
  });
  const { status, markSaved } = useSavedStatus(form.formState.isDirty);
  // A website was just added to a workspace that had none: the offer to read it.
  const [websiteAdded, setWebsiteAdded] = React.useState(false);
  const readError = useWorkspaceStore(
    (state) =>
      brandVoiceRefreshFor(state.brandVoiceRefresh, workspace?.id).refreshError,
  );

  // Follow the workspace as it loads and refetches, keeping what the person is typing.
  React.useEffect(() => {
    if (!workspace) {
      return;
    }

    form.reset(
      {
        name: workspace.name || "",
        slug: workspace.slug || "",
        url: workspace.url || "",
      },
      { keepDirtyValues: true },
    );
  }, [workspace, form]);

  const onSubmit = async (data: WorkspaceGeneralInfo) => {
    try {
      if (!workspace?.id) {
        throw new Error("The workspace hasn't loaded yet. Try again.");
      }

      const hadWebsite = Boolean(workspace.url);
      if (hadWebsite && !data.url) {
        // The backend keeps the address it has when none is sent: say so, not "saved".
        form.setError(
          "url",
          { message: "A website can be changed here, but not removed." },
          { shouldFocus: true },
        );
        return;
      }
      const response = await apiClient.workspaces.update(workspace.id, {
        name: data.name,
        ...(data.url ? { url: data.url } : {}),
      });

      // Update local store immediately.
      if (response?.workspace) {
        setCurrentWorkspace(response.workspace);
        updateWorkspaceInList(response.workspace);

        // Update detail cache.
        queryClient.setQueryData(
          ["workspaces", "detail", response.workspace.slug],
          response,
        );

        queryClient.setQueryData(
          ["workspaces", "detail", response.workspace.id],
          response,
        );

        if (workspace.slug && workspace.slug !== response.workspace.slug) {
          queryClient.setQueryData(
            ["workspaces", "detail", workspace.slug],
            response,
          );
        }
      }

      // Refresh workspace-related caches.
      await queryClient.invalidateQueries({
        predicate: ({ queryKey }) =>
          queryKey[0] === "workspaces" &&
          (queryKey.length === 1 ||
            queryKey[1] === "list" ||
            queryKey[1] === "switcher" ||
            queryKey[1] === "detail"),
      });

      markSaved();
      const saved = response?.workspace;
      form.reset({
        name: saved?.name ?? data.name,
        slug: saved?.slug ?? data.slug,
        url: saved?.url ?? data.url,
      });
      if (!hadWebsite && data.url) setWebsiteAdded(true);

      // Rename can regenerate the workspace slug.
      const newSlug = saved?.slug;

      if (newSlug && newSlug !== workspace.slug) {
        router.replace(workspaceRoutes.settings.root(newSlug) as Route);
      } else {
        router.refresh();
      }
    } catch (error) {
      form.setError("root.server", {
        message:
          error instanceof Error
            ? error.message
            : "The workspace couldn't be saved. Try again.",
      });
    }
  };

  const serverError = form.formState.errors.root?.server?.message;
  const readOnly = !isPermissionLoading && !canUpdate;

  return (
    <fieldset disabled={!workspace || !canUpdate} className="min-w-0">
      <FormShell
        form={form}
        onSubmit={onSubmit}
        submitLabel="Save changes"
        status={status}
      >
        {serverError && (
          <Notice tone="danger" title="Your changes weren't saved">
            {serverError}
          </Notice>
        )}
        {websiteAdded && workspace?.url && (
          <Notice
            tone="info"
            title="Your website is saved. Read it now?"
            action={
              <BrandVoiceRefreshControl
                workspaceId={workspace.id}
                buttonVariant="default"
                buttonSize="sm"
              >
                Read the website
              </BrandVoiceRefreshControl>
            }
          >
            We can read it for the brand voice, the people named on it and your
            competitors. What the site says replaces the brand voice as it is
            now, your own changes included, and the list of competitors;
            personas you added yourself stay. You can also do this later, from
            Brand voice.
          </Notice>
        )}
        {websiteAdded && readError && (
          <Notice tone="danger" title="The website couldn't be read">
            {readError}
          </Notice>
        )}
        <FormSection
          title="General"
          description={
            readOnly
              ? "Your role can see these settings but not change them."
              : "The workspace's name and the website its articles are for."
          }
        >
          <FieldController
            control={form.control}
            name="name"
            label="Workspace name"
            required
            description="Shown in the workspace switcher and on invitations."
          >
            {(field) => <Input {...field} placeholder="My workspace" />}
          </FieldController>
          <FieldController
            control={form.control}
            name="url"
            label="Website"
            description={
              workspace && !workspace.url
                ? "None yet. Add your website and we can read it for the brand voice, the people named on it and your competitors."
                : "The site the brand voice is read from."
            }
          >
            {(field) => (
              // A text field, as on the create form: `type="url"` makes the browser refuse a
              // bare domain in its own words (rext-control#854).
              <Input
                {...field}
                type="text"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="url"
                spellCheck={false}
                placeholder="yoursite.com"
              />
            )}
          </FieldController>
          <FieldController
            control={form.control}
            name="slug"
            label="Workspace address"
            description="The workspace's part of its web addresses; it can't be changed."
          >
            {(field) => <Input {...field} readOnly disabled />}
          </FieldController>
          <Field>
            <FieldTitle>Icon</FieldTitle>
            <div className="flex items-center gap-3">
              <WorkspaceFavicon
                name={workspace?.name ?? ""}
                src={workspace?.favicon_url}
              />
              <FieldDescription>
                {workspace?.favicon_url
                  ? "Your website's icon, as the workspace switcher shows it."
                  : workspace && !workspace.url
                    ? "The name's first letter stands in until there is a website to take an icon from."
                    : "No icon could be read from your website, so the name's first letter stands in."}
              </FieldDescription>
            </div>
          </Field>
        </FormSection>
      </FormShell>
    </fieldset>
  );
}
