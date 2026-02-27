"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
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
import * as React from "react";

const generalInfoSchema = z.object({
  name: z.string().min(1, "Workspace name is required").max(200),
  slug: z.string(),
  description: z.string().max(500).optional(),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type GeneralInfoForm = z.infer<typeof generalInfoSchema>;

export function GeneralInfoSection() {
  const { workspace } = useWorkspace();
  const router = useRouter();
  // const queryClient = useQueryClient();
  // const updateWorkspaceInList = useWorkspaceStore(
  //   (state) => state.updateWorkspaceInList,
  // );
  // const setCurrentWorkspace = useWorkspaceStore(
  //   (state) => state.setCurrentWorkspace,
  // );

  const form = useForm<GeneralInfoForm>({
    resolver: zodResolver(generalInfoSchema),
    values: {
      name: workspace?.name || "",
      slug: workspace?.slug || "",
      url: workspace?.url || "",
    },
  });

  // Reset form when workspace changes
  React.useEffect(() => {
    if (workspace) {
      form.reset({
        name: workspace.name || "",
        slug: workspace.slug || "",
        url: workspace.url || "",
      });
    }
  }, [workspace, form]);

  const onSubmit = async (data: GeneralInfoForm) => {
    try {
      await apiClient.workspaces.update(workspace?.id || "", {
        name: data.name,
        url: data.url,
      });

      router.refresh();
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
        <CardTitle>General Information</CardTitle>
        <CardDescription>
          Update your workspace name, slug, and other basic information
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workspace Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Workspace" {...field} />
                    </FormControl>
                    <FormDescription>
                      The display name for your workspace
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workspace Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="my-workspace" {...field} disabled />
                    </FormControl>
                    <FormDescription>
                      Used in URLs. Cannot be changed after creation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                      Your company or project website (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={
                  form.formState.isSubmitting || !form.formState.isDirty
                }
              >
                {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Form>
        </PermissionGuard>
      </CardContent>
    </Card>
  );
}
