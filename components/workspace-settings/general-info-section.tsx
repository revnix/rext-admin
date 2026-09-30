
"use client";

import * as React from "react";
import * as z from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { Route } from "next";

import { PermissionGuard } from "@/components/permission/permission-guard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { WORKSPACE_PERMISSIONS } from "@/lib/permissions";
import { useWorkspace } from "@/providers/workspace-provider";
import { useWorkspaceStore } from "@/stores/workspace";

const generalInfoSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Workspace name is required")
    .max(200, "Workspace name must be 200 characters or less")
    .regex(
      /[A-Za-z]/,
      "Workspace name must contain at least one letter",
    ),

  slug: z.string(),

  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),

  url: z
    .string()
    .trim()
    .min(1, "Website URL is required")
    .url("Must be a valid URL")
    .refine((value) => {
      try {
        const hostname = new URL(value).hostname;

        return /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/.test(
          hostname,
        );
      } catch {
        return false;
      }
    }, "URL must include a valid domain extension"),
});

type GeneralInfoForm = z.infer<typeof generalInfoSchema>;

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

  const form = useForm<GeneralInfoForm>({
    resolver: zodResolver(generalInfoSchema),

    // Validate while the user is typing.
    mode: "onChange",
    reValidateMode: "onChange",

    defaultValues: {
      name: "",
      slug: "",
      description: "",
      url: "",
    },
  });

  // Reset form when workspace changes.
  React.useEffect(() => {
    if (!workspace) {
      return;
    }

    form.reset({
      name: workspace.name || "",
      slug: workspace.slug || "",
      description: workspace.description || "",
      url: workspace.url || "",
    });
  }, [workspace, form]);

  const onSubmit = async (data: GeneralInfoForm) => {
    try {
      if (!workspace?.id) {
        throw new Error(
          "Workspace data is not loaded yet. Please try again.",
        );
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

        if (
          workspace.slug &&
          workspace.slug !== response.workspace.slug
        ) {
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

      toast.success(
        "Workspace settings have been saved successfully.",
      );
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
        <CardTitle>General Information</CardTitle>

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
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
              {/* Workspace Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workspace Name</FormLabel>

                    <FormControl>
                      <Input
                        placeholder="My Workspace"
                        {...field}
                      />
                    </FormControl>

                    <FormDescription>
                      The display name for your workspace
                    </FormDescription>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Workspace Slug */}
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workspace Slug</FormLabel>

                    <FormControl>
                      <Input
                        placeholder="my-workspace"
                        {...field}
                        disabled
                      />
                    </FormControl>

                    <FormDescription>
                      Used in URLs. Cannot be changed after creation
                    </FormDescription>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Website URL */}
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL</FormLabel>

                    <FormControl>
                      <Input
                        placeholder="https://example.com"
                        type="url"
                        {...field}
                      />
                    </FormControl>

                    <FormDescription>
                      Your company or project website
                    </FormDescription>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={
                  form.formState.isSubmitting ||
                  !form.formState.isDirty
                }
              >
                {form.formState.isSubmitting
                  ? "Saving..."
                  : "Save Changes"}
              </Button>
            </form>
          </Form>
        </PermissionGuard>
      </CardContent>
    </Card>
  );
}

