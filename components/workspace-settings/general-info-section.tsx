"use client";

import * as React from "react";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { Route } from "next";

import { FieldController } from "@/components/forms/field-controller";
import { FormShell } from "@/components/forms/form-shell";
import { useZodForm } from "@/components/forms/use-zod-form";
import { PermissionGuard } from "@/components/permission/permission-guard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { WORKSPACE_PERMISSIONS } from "@/lib/permissions";
import { useWorkspace } from "@/providers/workspace-provider";
import {
  type WorkspaceGeneralInfo,
  workspaceGeneralInfoSchema,
} from "@/schemas/workspace-schemas";
import { useWorkspaceStore } from "@/stores/workspace";

export function GeneralInfoSection() {
  const { workspace } = useWorkspace();
  const router = useRouter();
  const queryClient = useQueryClient();

  const setCurrentWorkspace = useWorkspaceStore(
    (state) => state.setCurrentWorkspace,
  );

  const updateWorkspaceInList = useWorkspaceStore(
    (state) => state.updateWorkspaceInList,
  );

  const form = useZodForm(workspaceGeneralInfoSchema, {
    defaultValues: { name: "", slug: "", url: "" },
  });
  // The inline "Saved" beside the button; the next change clears it.
  const [saved, setSaved] = React.useState(false);
  const isDirty = form.formState.isDirty;
  React.useEffect(() => {
    if (isDirty) setSaved(false);
  }, [isDirty]);

  // Reset form when workspace changes.
  React.useEffect(() => {
    if (!workspace) {
      return;
    }

    form.reset({
      name: workspace.name || "",
      slug: workspace.slug || "",
      url: workspace.url || "",
    });
  }, [workspace, form]);

  const onSubmit = async (data: WorkspaceGeneralInfo) => {
    try {
      if (!workspace?.id) {
        throw new Error("Workspace data is not loaded yet. Please try again.");
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

      // Rename can regenerate the workspace slug.
      const newSlug = response?.workspace?.slug;

      if (newSlug && newSlug !== workspace.slug) {
        router.replace(`/w/${newSlug}/settings` as Route);
      } else {
        router.refresh();
      }

      setSaved(true);
      toast.success("Workspace settings have been saved successfully.");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update workspace settings";

      toast.error(errorMessage);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>General information</CardTitle>

        <CardDescription>
          Update your workspace name, and other basic information
        </CardDescription>
      </CardHeader>

      <CardContent>
        <PermissionGuard
          permission={WORKSPACE_PERMISSIONS.UPDATE}
          fallback={
            <p className="text-sm text-muted-foreground">
              You don't have permission to edit workspace settings.
            </p>
          }
        >
          <FormShell
            form={form}
            onSubmit={onSubmit}
            submitLabel="Save changes"
            status={saved ? "Saved" : null}
          >
            <FieldGroup>
              <FieldController
                control={form.control}
                name="name"
                label="Workspace name"
                required
                description="The display name for your workspace."
              >
                {(field) => <Input {...field} placeholder="My Workspace" />}
              </FieldController>
              <FieldController
                control={form.control}
                name="slug"
                label="Workspace slug"
                description="Used in URLs; it can't be changed after creation."
              >
                {(field) => (
                  <Input {...field} placeholder="my-workspace" disabled />
                )}
              </FieldController>
              <FieldController
                control={form.control}
                name="url"
                label="Website URL"
                required
                description="Your company or project website."
              >
                {(field) => (
                  <Input
                    {...field}
                    type="url"
                    placeholder="https://example.com"
                  />
                )}
              </FieldController>
            </FieldGroup>
          </FormShell>
        </PermissionGuard>
      </CardContent>
    </Card>
  );
}
