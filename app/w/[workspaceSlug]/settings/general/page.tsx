"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { CanAccess } from "@/components/permissions/can-access";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import { WORKSPACE_PERMISSIONS } from "@/lib/permissions";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";

const generalSettingsSchema = z.object({
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

type GeneralSettingsForm = z.infer<typeof generalSettingsSchema>;

export default function WorkspaceGeneralSettings() {
  const { workspace, workspaceSlug } = useWorkspace();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const form = useForm<GeneralSettingsForm>({
    resolver: zodResolver(generalSettingsSchema),
    values: {
      title: workspace?.title || "",
      slug: workspace?.slug || "",
      description: "",
      url: workspace?.url || "",
    },
  });

  const onSubmit = async (data: GeneralSettingsForm) => {
    try {
      await apiClient.workspaces.update(workspace?.id || "", {
        title: data.title,
        url: data.url,
      });

      // If slug changed, redirect to new URL (note: backend doesn't allow slug changes yet)
      if (data.slug !== workspaceSlug) {
        router.push(workspaceRoutes.settings.general(data.slug));
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

  const handleDelete = async () => {
    if (!passwordConfirmation) {
      toast.error("Please enter your password to confirm deletion.");
      return;
    }

    setIsDeleting(true);
    try {
      // First verify password
      try {
        await apiClient.request("/api/v1/user/verify-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: passwordConfirmation }),
        });
      } catch {
        toast.error("The password you entered is incorrect.");
        setIsDeleting(false);
        return;
      }

      // Delete workspace
      await apiClient.workspaces.delete(workspace?.id || "");

      // Show success message with recovery info
      toast.success(
        "The workspace has been deleted. You have 30 days to recover it.",
      );

      setDeleteDialogOpen(false);
      setPasswordConfirmation("");
      router.push("/dashboard");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete workspace";
      toast.error(errorMessage);
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
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
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
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
                        <Input placeholder="my-workspace" {...field} />
                      </FormControl>
                      <FormDescription>
                        Used in URLs. Can only contain lowercase letters,
                        numbers, and hyphens
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

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that permanently affect your workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CanAccess
            permission={WORKSPACE_PERMISSIONS.DELETE}
            fallback={
              <p className="text-sm text-muted-foreground">
                Only workspace owners can delete the workspace.
              </p>
            }
          >
            <div className="flex items-center justify-between p-4 border border-destructive rounded-lg">
              <div>
                <h4 className="text-sm font-medium">Delete Workspace</h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this workspace and all its data
                </p>
              </div>
              <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isDeleting}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Workspace
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete "{workspace?.title}"?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will soft-delete the workspace. You'll have{" "}
                      <strong>30 days</strong> to recover it before permanent
                      deletion.
                      <br />
                      <br />
                      All associated data will be preserved during the recovery
                      period:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Knowledge bases and content</li>
                        <li>Topics and generations</li>
                        <li>Team members and their access</li>
                        <li>Settings and configurations</li>
                      </ul>
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <div className="space-y-2 py-4">
                    <Label htmlFor="password-confirm">
                      Enter your password to confirm
                    </Label>
                    <Input
                      id="password-confirm"
                      type="password"
                      placeholder="Your password"
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && passwordConfirmation) {
                          handleDelete();
                        }
                      }}
                    />
                  </div>

                  <AlertDialogFooter>
                    <AlertDialogCancel
                      onClick={() => {
                        setPasswordConfirmation("");
                        setDeleteDialogOpen(false);
                      }}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={!passwordConfirmation || isDeleting}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {isDeleting ? "Deleting..." : "Delete workspace"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CanAccess>
        </CardContent>
      </Card>
    </div>
  );
}
