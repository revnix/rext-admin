"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { CanAccess } from "@/components/permissions/can-access";
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
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import { WORKSPACE_PERMISSIONS } from "@/lib/permissions";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";

const generalInfoSchema = z.object({
  title: z.string().min(1, "Workspace name is required").max(100),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(50)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens",
    ),
  description: z.string().max(500).optional(),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type GeneralInfoForm = z.infer<typeof generalInfoSchema>;

export function GeneralInfoSection() {
  const { workspace, workspaceSlug } = useWorkspace();
  const router = useRouter();

  const form = useForm<GeneralInfoForm>({
    resolver: zodResolver(generalInfoSchema),
    values: {
      title: workspace?.title || "",
      slug: workspace?.slug || "",
      description: "",
      url: workspace?.url || "",
    },
  });

  const onSubmit = async (data: GeneralInfoForm) => {
    try {
      await apiClient.workspaces.update(workspace?.id || "", {
        title: data.title,
        url: data.url,
      });

      // If slug changed, redirect to new URL (note: backend doesn't allow slug changes yet)
      if (data.slug !== workspaceSlug) {
        router.push(workspaceRoutes.settings.root(data.slug));
      } else {
        // Reload to get updated workspace data
        router.refresh();
      }

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
        <CanAccess
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
                name="title"
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What is this workspace about?"
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A brief description of this workspace
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
        </CanAccess>
      </CardContent>
    </Card>
  );
}
