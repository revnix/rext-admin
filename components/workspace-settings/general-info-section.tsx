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
import { useWorkspaceStore } from "@/stores/workspace";

/**
 * Workspace settings, General: the name and the website, the slug and the icon shown. Every member
 * sees them; changing them needs workspace.update, so without it the form is shown disabled.
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

      const response = await apiClient.workspaces.update(workspace.id, {
        name: data.name,
        url: data.url,
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
            required
            description="The site the brand voice is read from."
          >
            {(field) => (
              <Input {...field} type="url" placeholder="https://example.com" />
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
                  : "No icon could be read from your website, so the name's first letter stands in."}
              </FieldDescription>
            </div>
          </Field>
        </FormSection>
      </FormShell>
    </fieldset>
  );
}
